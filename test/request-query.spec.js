import nock from 'nock';
import configureStore from './redux-store.mock';

import {
  HTTP_REQUEST,
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

describe('Request Query', () => {
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

  describe('when the given `query` is a string', () => {
    it('attaches the given query string', (done) => {
      const scope = nock('http://localhost')
        .get('/api/test?foo=bar&baz=qux')
        .reply(200);

      const request = {
        type: 'test:query_string',
        [HTTP_REQUEST]: {
          path: '/api/test',
          query: 'foo=bar&baz=qux',
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

  describe('when the given `query` is an object', () => {
    it('converts to a query string', (done) => {
      const scope = nock('http://localhost')
        .get('/api/test?foo=bar&baz=qux')
        .reply(200);

      const request = {
        type: 'test:query_object',
        [HTTP_REQUEST]: {
          path: '/api/test',
          query: { foo: 'bar', baz: 'qux' },
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
