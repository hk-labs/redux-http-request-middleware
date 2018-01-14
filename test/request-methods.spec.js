import nock from 'nock';
import configureStore from './redux-store.mock';

import {
  HTTP_REQUEST,
  METHOD_GET,
  METHOD_POST,
  METHOD_PUT,
  METHOD_PATCH,
  METHOD_DELETE,
  httpRequestMiddleware
} from '../src/http-request-middleware';

const requestSuccess = (payload = {}) => ({
  type: 'test:request_success',
  payload
});

const unexpectedResponse = (payload) => ({
  type: 'test:unexpected_response',
  payload
});

describe('Request Methods (Verbs)', () => {
  let mockStore, store;

  before(() => nock.disableNetConnect());
  after(() => nock.enableNetConnect());
  afterEach(() => nock.cleanAll());

  before('setup store mock factory', () => {
    mockStore = configureStore([
      httpRequestMiddleware()
    ]);
  });

  beforeEach('setup store instance', () => {
    store = mockStore({});
  });

  it('GET is default', (done) => {
    const scope = nock('http://localhost')
      .get('/api/test')
      .reply(200);

    const request = {
      type: `test:default_method`,
      [HTTP_REQUEST]: {
        path: '/api/test',
        handlers: {
          success: requestSuccess,
          failure: unexpectedResponse
        }
      }
    };

    const actions = [
      request,
      requestSuccess()
    ];

    store.expect(actions, (err) => {
      if (err) {
        return done(err);
      }

      try {
        scope.done();
        done();
      }
      catch (err) {
        done(err);
      }
    });

    store.dispatch(request);
  });

  [ METHOD_GET,
    METHOD_POST,
    METHOD_PUT,
    METHOD_PATCH,
    METHOD_DELETE
  ].forEach((method) => {
    it(`${method.toUpperCase()} "/api/test"`, (done) => {
      const scope = nock('http://localhost')
        [method]('/api/test')
        .reply(200);

      const request = {
        type: `test:method_${method}`,
        [HTTP_REQUEST]: {
          path: '/api/test',
          method,
          handlers: {
            success: requestSuccess,
            failure: unexpectedResponse
          }
        }
      };

      const actions = [
        request,
        requestSuccess()
      ];

      store.expect(actions, (err) => {
        if (err) {
          return done(err);
        }

        try {
          scope.done();
          done();
        }
        catch (err) {
          done(err);
        }
      });

      store.dispatch(request);
    });
  });
});
