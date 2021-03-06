import superagent from 'superagent';

/**
 * The `HTTP_REQUEST` symbol.
 *
 * @type {symbol}
 */
export const HTTP_REQUEST = Symbol('HTTP_REQUEST');

/**
 * The `HTTP_REQUEST` symbol.
 *
 * @type {symbol}
 */
export const HTTP_RESPONSE = Symbol('HTTP_RESPONSE');

/**
 * The internally used `$PROMISE` symbol.
 *
 * @type {symbol}
 */
export const $PROMISE = Symbol('$PROMISE');

/**
 * Http request methods (verbs).
 */
export const METHOD_GET     = 'get';
export const METHOD_POST    = 'post';
export const METHOD_PUT     = 'put';
export const METHOD_PATCH   = 'patch';
export const METHOD_DELETE  = 'delete';

/**
 * @private
 * @param {{agent: superagent, defaultHeaders: Object}} options
 * @param {Object} payload
 * @param {String} payload.path
 * @param {String} [payload.method]
 * @param {Object<String, (String|Number)>} [payload.query]
 * @param {Object<String, *>} [payload.body]
 */
function request(options, payload) {
  const {
    agent = superagent,
    defaultHeaders = undefined
  } = options;

  const {
    path,
    method = METHOD_GET,
    headers = undefined,
    query = undefined,
    body = undefined
  } = payload;

  const req = agent[method](path);

  defaultHeaders && req.set(defaultHeaders);
  headers && req.set(headers);
  query && req.query(query);
  body && req.send(body);

  return req;
}

/**
 * Create the http response action from a given handler (action/creator etc.),
 * attaching the `HTTP_RESPONSE` symbol'ed field with a value of response object.
 *
 * @private
 * @param {String|Object|function} handler
 * @param {object} params
 * @param {Response} [params.response]
 * @param {*} [params.payload]
 * @param {Error} [params.error]
 * @return {{
 *   type: String,
 *   payload: *,
 *   error?: Error,
 *   [HTTP_RESPONSE]: superagent.Response
 * }} action
 */
function response(handler, params) {
  let action;

  switch (typeof handler) {
    case 'function':
      action = params.error
        ? handler(params.error, params.payload, params.response)
        : handler(params.payload, params.response);

      break;

    case 'object':
      action = { ...handler };
      params.error && (action.error = params.error.message);
      params.payload && (action.payload = params.payload);
      params.response && (action[HTTP_RESPONSE] = params.response);
      break;

    case 'string': {
      action = { type: handler };
      params.error && (action.error = params.error.message);
      params.payload && (action.payload = params.payload);
      params.response && (action[HTTP_RESPONSE] = params.response);
      break;
    }

    default:
      throw new Error(`unable to create response action from "${JSON.stringify(handler)}"`);
  }

  return action;
}

/**
 * Http request middleware factory.
 *
 * @param {Object} [options] – http request middleware options
 * @param {superagent} [options.agent] – preconfigured `superagent` instance
 * @param {Object} [options.defaultHeaders] – default headers
 */
export function httpRequestMiddleware(options) {
  options || (options = {});

  return store => next => action => {
    const httpRequestPayload = action[HTTP_REQUEST];

    if (typeof httpRequestPayload === 'undefined') {
      return next(action);
    }

    const {handlers = {}} = httpRequestPayload;

    action[$PROMISE] = request(options, httpRequestPayload)
      .then((res) => {
        if (handlers[res.status]) {
          store.dispatch(response(handlers[res.status], {
            payload: res.body,
            response: res
          }));
        }

        else if (handlers.success) {
          store.dispatch(response(handlers.success, {
            payload: res.body,
            response: res
          }));
        }

        return res;
      })
      .catch((err) => {
        if (handlers[err.status]) {
          const params = {};
          err.response && (params.response = err.response);
          err.response && err.response.body && (params.payload = err.response.body);
          store.dispatch(response(handlers[err.status], params));
        }

        else if (handlers.failure) {
          const params = { error: err };
          err.response && (params.response = err.response);
          err.response && err.response.body && (params.payload = err.response.body);
          store.dispatch(response(handlers.failure, params));
        }

        throw err;
      });

    next(action);

    return action[$PROMISE];
  };
}
