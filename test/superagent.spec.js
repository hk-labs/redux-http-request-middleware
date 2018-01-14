import nock from 'nock';
import sinon from 'sinon';
import superagent from 'superagent';
import configureStore from './redux-store.mock';

import {
  HTTP_REQUEST,
  HTTP_RESPONSE,
  httpRequestMiddleware
} from '../src';

const requestSuccess = (payload = {}, response) => ({
  type: 'test:request_success',
  payload,
  [HTTP_RESPONSE]: response
});

const requestFailure = (err, payload = {}, response) => ({
  type: 'test:request_failure',
  error: err.message,
  payload,
  [HTTP_RESPONSE]: response
});

function createSuperagentStub() {
  return [
    'get',
    'post',
    'put',
    'patch',
    'delete'
  ].reduce((agent, method) => {
    agent[method] = sinon.spy(agent[method]);
    return agent;
  }, superagent.agent());
}

describe('Configuration', () => {
  let mockStore, store;

  before(() => nock.disableNetConnect());
  after(() => nock.enableNetConnect());
  afterEach(() => nock.cleanAll());

  describe('with preconfigured `agent`', () => {
    let $superagent;

    beforeEach('setup superagent stub', () => {
      $superagent = createSuperagentStub();
    });

    beforeEach('setup store mock factory', () => {
      mockStore = configureStore([
        httpRequestMiddleware({ agent: $superagent })
      ]);
    });

    beforeEach('setup store instance', () => {
      store = mockStore({});
    });

    let request;

    beforeEach('setup default request action', () => {
      request = {
        type: 'test:response_handler',
        [HTTP_REQUEST]: {
          path: '/api/test',
          handlers: {
            success: requestSuccess,
            failure: requestFailure
          }
        }
      };
    });

    beforeEach('mock http response', () => {
      nock('http://localhost')
        .get('/api/test')
        .reply(200, {
          string: 'abcdefg',
          number:  1234.56,
          boolean: true
        });
    });

    it('uses the given `superagent` instance', (done) => {
      const actions = [
        request,
        {
          type: 'test:request_success',
          payload: {
            string: 'abcdefg',
            number:  1234.56,
            boolean: true
          }
        }
      ];

      store.expect(actions, (err) => {
        if (err) {
          return done(err);
        }

        try {
          expect($superagent.get).to.have.been.called;
        }
        catch (err) {
          return done(err);
        }

        done();
      });

      store.dispatch(request);
    });
  });
});
