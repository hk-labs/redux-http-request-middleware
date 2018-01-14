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

describe('Request Path', () => {
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

  describe('when the given `path` is relative', () => {
    it('requests the given `path` relative to the current url', (done) => {
      const scope = nock('http://localhost')
        .get('/')
        .reply(200);

      const request = {
        type: 'test:relative_path',
        [HTTP_REQUEST]: {
          path: '/',
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

  describe('when the given `path` is an absolute url', () => {
    it('requests the given url', (done) => {
      const scope = nock('https://test.localhost.dev/')
        .get('/')
        .reply(200);

      const request = {
        type: 'test:absolute_url',
        [HTTP_REQUEST]: {
          path: 'https://test.localhost.dev/',
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
