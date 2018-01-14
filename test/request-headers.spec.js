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

describe('Request Headers', () => {
  let mockStore, store;

  before(() => nock.disableNetConnect());
  after(() => nock.enableNetConnect());
  afterEach(() => nock.cleanAll());

  describe('when request `headers` are present', () => {
    beforeEach('setup store mock factory', () => {
      mockStore = configureStore([
        httpRequestMiddleware()
      ]);
    });

    beforeEach('setup store instance', () => {
      store = mockStore({});
    });

    it('sends the given headers', (done) => {
      const scope = nock('http://localhost')
        .matchHeader('If-None-Match', 'a64df51425fc')
        .get('/api/test')
        .reply(200);

      const request = {
        type: 'test:request_headers',
        [HTTP_REQUEST]: {
          path: '/api/test',
          headers: {
            'If-None-Match': 'a64df51425fc'
          },
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

  describe('when default headers are preconfigured', () => {
    beforeEach('setup store mock factory', () => {
      mockStore = configureStore([
        httpRequestMiddleware({
          defaultHeaders: {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json'
          }
        })
      ]);
    });

    beforeEach('setup store instance', () => {
      store = mockStore({});
    });

    it('sends the default headers', (done) => {
      const scope = nock('http://localhost')
        .matchHeader('Content-Type', 'application/json; charset=utf-8')
        .matchHeader('Accept', 'application/json')
        .get('/api/test')
        .reply(200);

      const request = {
        type: 'test:request_default_headers',
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

    describe('and request `headers` are present', () => {
      it('sends merged with defaults', (done) => {
        const scope = nock('http://localhost')
          .matchHeader('Content-Type', 'application/json; charset=utf-8')
          .matchHeader('Accept', 'text/xml')
          .matchHeader('If-None-Match', 'a64df51425fc')
          .get('/api/test')
          .reply(200);

        const request = {
          type: 'test:request_headers',
          [HTTP_REQUEST]: {
            path: '/api/test',
            headers: {
              'Accept': 'text/xml',
              'If-None-Match': 'a64df51425fc'
            },
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
});
