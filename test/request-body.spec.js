import nock from 'nock';
import configureStore from './redux-store.mock';

import {
  HTTP_REQUEST,
  METHOD_POST,
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

describe('Request Body', () => {
  let mockStore, store;

  before(() => nock.disableNetConnect());
  after(() => nock.enableNetConnect());
  afterEach(() => nock.cleanAll());

  beforeEach('setup store mock factory', () => {
    mockStore = configureStore([
      httpRequestMiddleware()
    ]);
  });

  beforeEach('setup store instance', () => {
    store = mockStore({});
  });

  describe('when the given request `body` is an object', () => {
    it('sends the given `body` as a json', (done) => {
      const scope = nock('http://localhost')
        .post('/api/test', {
          string: 'abcdefg',
          number:  1234.56,
          boolean: true
        })
        .reply(200);

      const request = {
        type: 'test:request_body',
        [HTTP_REQUEST]: {
          path: '/api/test',
          method: METHOD_POST,
          body: {
            string: 'abcdefg',
            number:  1234.56,
            boolean: true
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
