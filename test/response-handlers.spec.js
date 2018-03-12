import nock from 'nock';
import sinon from 'sinon';
import configureStore from './redux-store.mock';

import {
  OK,
  CREATED,
  ACCEPTED,
  NO_CONTENT,
  NOT_MODIFIED,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  UNPROCESSABLE_ENTITY,
  INTERNAL_SERVER_ERROR,
  getStatusText
} from 'http-status-codes';

import {
  HTTP_REQUEST,
  HTTP_RESPONSE,
  httpRequestMiddleware
} from '../src/http-request-middleware';

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

const throwUnexpectedSuccess = () => {
  throw new Error('unexpected promise resolve, an error should have been occurred');
};

describe('Response Handlers', () => {
  let mockStore, $store;

  before(() => nock.disableNetConnect());
  after(() => nock.enableNetConnect());
  afterEach(() => nock.cleanAll());

  before('setup store mock factory', () => {
    mockStore = configureStore([
      httpRequestMiddleware()
    ]);
  });

  beforeEach('setup `$store` instance', () => {
    $store = mockStore({});
  });

  describe('generic case handlers (success/failure)', () => {
    let request;

    beforeEach('setup default request action', () => {
      request = {
        type: 'test:response_handler',
        [HTTP_REQUEST]: {
          path: '/api/test',
          handlers: {
            success: 'test:request_success',
            failure: requestFailure
          }
        }
      };
    });

    describe('if the server response is successful', () => {
      beforeEach('mock http response', () => {
        nock('http://localhost')
          .get('/api/test')
          .reply(200, {
            string: 'abcdefg',
            number:  1234.56,
            boolean: true
          });
      });

      describe('when the given `success` handler is a string (action type)', () => {
        beforeEach('setup case-specific success handler', () => {
          request[HTTP_REQUEST].handlers = {
            success: 'test:request_success',
            failure: requestFailure
          };
        });

        it('dispatches an action with a specified `type` providing the response body as a `payload`', () => {
          return $store.dispatch(request)
            .then(() => {
              const [first, second] = $store.getActions();

              expect(first).to.deep.equal(request);

              expect(second).to.deep.equal({
                type: 'test:request_success',
                payload: {
                  string: 'abcdefg',
                  number: 1234.56,
                  boolean: true
                }
              });
            });
        });

        it('attaches the original response object as `[HTTP_RESPONSE]`', () => {
          return $store.dispatch(request)
            .then(() => {
              const [_, second] = $store.getActions();

              //noinspection JSCheckFunctionSignatures
              expect(second)
                .to.have.property(HTTP_RESPONSE)
                .that.deep.includes({
                  status: 200,
                  body: {
                    string: 'abcdefg',
                    number:  1234.56,
                    boolean: true
                  }
              });
            });
        });
      });

      describe('when the given `success` handler is an object (action)', () => {
        beforeEach('setup case-specific success handler', () => {
          request[HTTP_REQUEST].handlers = {
            success: {
              type: 'test:request_success',
              custom: 'custom field value'
            },
            failure: requestFailure
          };
        });

        it('dispatches the given action providing the response body as a `payload`', () => {
          return $store.dispatch(request)
            .then(() => {
              const [first, second] = $store.getActions();

              expect(first).to.deep.equal(request);

              expect(second).to.deep.equal({
                type: 'test:request_success',
                custom: 'custom field value',
                payload: {
                  string: 'abcdefg',
                  number:  1234.56,
                  boolean: true
                }
              });
            });
          });

        it('attaches the original response object as `[HTTP_RESPONSE]`', () => {
          return $store.dispatch(request)
            .then(() => {
              const [_, second] = $store.getActions();

              //noinspection JSCheckFunctionSignatures
              expect(second)
                .to.have.property(HTTP_RESPONSE)
                .that.deep.includes({
                  status: 200,
                  body: {
                    string: 'abcdefg',
                    number:  1234.56,
                    boolean: true
                  }
                });
            });
        });
      });

      describe('when the given `success` handler is a function (action creator)', () => {
        beforeEach('setup case-specific success handler', () => {
          request[HTTP_REQUEST].handlers = {
            success: sinon.spy(requestSuccess),
            failure: requestFailure
          };
        });

        it('dispatches the given handler as an action creator providing the response body', () => {
          const {success} = request[HTTP_REQUEST].handlers;

          return $store.dispatch(request)
            .then(() => {
              const [first, second] = $store.getActions();
              expect(first).to.deep.equal(request);

              expect(success).to.have.been.called;

              expect(second).to.deep.equal(requestSuccess({
                string: 'abcdefg',
                number:  1234.56,
                boolean: true
              }));
            });
          });

        it('additionally provides the original response object as a second argument', () => {
          return $store.dispatch(request)
            .then(() => {
              const [_, second] = $store.getActions();

              //noinspection JSCheckFunctionSignatures
              expect(second)
                .to.have.property(HTTP_RESPONSE)
                .that.deep.includes({
                  status: 200,
                  body: {
                    string: 'abcdefg',
                    number:  1234.56,
                    boolean: true
                  }
                });
            });
        });
      });
    });

    describe('if the server response is failed', () => {
      beforeEach('mock http response', () => {
        nock('http://localhost')
          .get('/api/test')
          .reply(422, {
            errors: {
              email: 'This email is already registered'
            }
          });
      });

      describe('when the given `failure` handler is a string (action type)', () => {
        beforeEach('setup case-specific failure handler', () => {
          request[HTTP_REQUEST].handlers = {
            success: requestSuccess,
            failure: 'test:request_failure'
          };
        });

        it('dispatches an action with a specified `type` providing the occurred `error` and `payload`', () => {
          return $store.dispatch(request)
            .then(throwUnexpectedSuccess)
            .catch((err) => {
              if (err.status !== 422) {
                throw err;
              }

              const [first, second] = $store.getActions();
              expect(first).to.deep.equal(request);

              expect(second).to.deep.include({
                type: 'test:request_failure',
                error: 'Unprocessable Entity',
                payload: {
                  errors: {
                    email: 'This email is already registered'
                  }
                }
              });
            });
        });

        it('attaches the original response object as `[HTTP_RESPONSE]`', () => {
          return $store.dispatch(request)
            .then(throwUnexpectedSuccess)
            .catch((err) => {
              if (err.status !== 422) {
                throw err;
              }

              const [_, second] = $store.getActions();

              //noinspection JSCheckFunctionSignatures
              expect(second)
                .to.have.property(HTTP_RESPONSE)
                .that.deep.includes({
                  status: 422,
                  body: {
                    errors: {
                      email: 'This email is already registered'
                    }
                  }
                });
            });
        });
      });

      describe('when the given `failure` handler is an object (action)', () => {
        beforeEach('setup case-specific failure handler', () => {
          request[HTTP_REQUEST].handlers = {
            success: requestSuccess,
            failure: {
              type: 'test:request_failure',
              custom: 'custom field value'
            }
          };
        });

        it('dispatches the given action providing the occurred `error` and `payload`', () => {
          return $store.dispatch(request)
            .then(throwUnexpectedSuccess)
            .catch((err) => {
              if (err.status !== 422) {
                throw err;
              }

              const [first, second] = $store.getActions();
              expect(first).to.deep.equal(request);

              expect(second).to.deep.include({
                type: 'test:request_failure',
                custom: 'custom field value',
                error: 'Unprocessable Entity',
                payload: {
                  errors: {
                    email: 'This email is already registered'
                  }
                }
              });
            });
        });

        it('attaches the original response object as `[HTTP_RESPONSE]`', () => {
          return $store.dispatch(request)
            .then(throwUnexpectedSuccess)
            .catch((err) => {
              if (err.status !== 422) {
                throw err;
              }

              const [_, second] = $store.getActions();

              //noinspection JSCheckFunctionSignatures
              expect(second)
                .to.have.property(HTTP_RESPONSE)
                .that.deep.includes({
                  status: 422,
                  body: {
                    errors: {
                      email: 'This email is already registered'
                    }
                  }
                });
            });
        });
      });

      describe('when the given `failure` handler is a function (action creator)', () => {
        beforeEach('setup case-specific failure handler', () => {
          request[HTTP_REQUEST].handlers = {
            success: requestSuccess,
            failure: sinon.spy(requestFailure)
          };
        });

        it('dispatches the given handler as an action creator providing the occurred `error` and `payload`', () => {
          const {failure} = request[HTTP_REQUEST].handlers;

          return $store.dispatch(request)
            .then(throwUnexpectedSuccess)
            .catch((err) => {
              if (err.status !== 422) {
                throw err;
              }

              const [first, second] = $store.getActions();
              expect(first).to.deep.equal(request);

              expect(failure).to.have.been.called;

              expect(second).to.deep.include(
                requestFailure(new Error('Unprocessable Entity'), {
                  errors: {
                    email: 'This email is already registered'
                  }
                })
              );
            });
        });

        it('additionally provides the original response object as a third argument', () => {
          return $store.dispatch(request)
            .then(throwUnexpectedSuccess)
            .catch((err) => {
              if (err.status !== 422) {
                throw err;
              }

              const [_, second] = $store.getActions();

              //noinspection JSCheckFunctionSignatures
              expect(second)
                .to.have.property(HTTP_RESPONSE)
                .that.deep.includes({
                  status: 422,
                  body: {
                    errors: {
                      email: 'This email is already registered'
                    }
                  }
                });
            });
        });
      });
    });

    describe('if the requesting is failed', () => {
      beforeEach('mock request error', () => {
        nock('http://localhost')
          .get('/api/test')
          .replyWithError('Network Error');
      });

      describe('when the given `failure` handler is a string (action type)', () => {
        beforeEach('setup case-specific failure handler', () => {
          request[HTTP_REQUEST].handlers = {
            success: requestSuccess,
            failure: 'test:request_failure'
          };
        });

        it('dispatches the given handler as an action `type` providing the occurred `error`', () => {
          return $store.dispatch(request)
            .then(throwUnexpectedSuccess)
            .catch((err) => {
              if (err.message !== 'Network Error') {
                throw err;
              }

              const [first, second] = $store.getActions();
              expect(first).to.deep.equal(request);

              expect(second).to.deep.include({
                type: 'test:request_failure',
                error: 'Network Error'
              });
            });
        });
      });

      describe('when the given `failure` handler is an object (action)', () => {
        beforeEach('setup case-specific failure handler', () => {
          request[HTTP_REQUEST].handlers = {
            success: requestSuccess,
            failure: {
              type: 'test:request_failure',
              custom: 'custom field value'
            }
          };
        });

        it('dispatches the given handler as an object providing the occurred `error`', () => {
          return $store.dispatch(request)
            .then(throwUnexpectedSuccess)
            .catch((err) => {
              if (err.message !== 'Network Error') {
                throw err;
              }

              const [first, second] = $store.getActions();
              expect(first).to.deep.equal(request);

              expect(second).to.deep.include({
                type: 'test:request_failure',
                custom: 'custom field value',
                error: 'Network Error'
              });
            });
        });
      });

      describe('when the given `failure` handler is a function (action creator)', () => {
        beforeEach('setup case-specific failure handler', () => {
          request[HTTP_REQUEST].handlers = {
            success: requestSuccess,
            failure: sinon.spy(requestFailure)
          };
        });

        it('dispatches the given handler as an action creator providing the occurred `error`', () => {
          const {failure} = request[HTTP_REQUEST].handlers;

          return $store.dispatch(request)
            .then(throwUnexpectedSuccess)
            .catch((err) => {
              if (err.message !== 'Network Error') {
                throw err;
              }

              const [first, second] = $store.getActions();
              expect(first).to.deep.equal(request);

              expect(failure).to.have.been.called;

              expect(second).to.deep.include(
                requestFailure(new Error('Network Error'))
              );
            });
          });
      });
    });
  });

  describe('concrete case handlers (by status codes)', () => {
    let request;

    [
      { method: 'get',  status: OK },
      { method: 'post', status: CREATED },
      { method: 'put',  status: ACCEPTED },
      { method: 'delete', status: NO_CONTENT },
      { method: 'get',  status: NOT_MODIFIED },
      { method: 'get',  status: UNAUTHORIZED },
      { method: 'post', status: FORBIDDEN },
      { method: 'get',  status: NOT_FOUND },
      { method: 'put',  status: CONFLICT },
      { method: 'patch', status: UNPROCESSABLE_ENTITY },
      { method: 'delete', status: INTERNAL_SERVER_ERROR }
    ]
      .forEach(({method, status}) => {
        describe(`${method.toUpperCase()} /api/test => [${status} "${getStatusText(status)}"]`, () => {
          beforeEach('mock case-specific http response', () => {
            nock('http://localhost')
              [method](`/api/test`)
              .reply(status, {
                string: 'abcdefg',
                number:  1234.56,
                boolean: true
              });
          });

          beforeEach('setup default request action', () => {
            request = {
              type: 'test:response_status_handler',
              [HTTP_REQUEST]: {
                path: `/api/test`,
                method,
                handlers: {
                  success: requestSuccess,
                  failure: requestFailure
                }
              }
            };
          });

          describe('when the given status handler is a string (action type)', () => {
            beforeEach('setup case-specific status handler', () => {
              request[HTTP_REQUEST].handlers[status] = `test:status_${status}_handler`;
            });

            it('dispatches an action with a specified `type` providing the response body as a `payload`',
              (done) => {
                $store.expect([
                  request,
                  {
                    type: `test:status_${status}_handler`,
                    payload: {
                      string: 'abcdefg',
                      number:  1234.56,
                      boolean: true
                    }
                  }
                ], err => done(err));

              $store.dispatch(request)
                .catch(() => {/* prevent console warnings */});
            });

            it('attaches the original response object as `[HTTP_RESPONSE]`', (done) => {
              const actions = [
                request,
                {
                  type: `test:status_${status}_handler`,
                  payload: {
                    string: 'abcdefg',
                    number:  1234.56,
                    boolean: true
                  }
                }
              ];

              $store.expect(actions, (err) => {
                if (err) {
                  return done(err);
                }

                const dispatched = $store.getActions();
                const action = dispatched[dispatched.length - 1];

                //noinspection JSCheckFunctionSignatures
                expect(action)
                  .to.have.property(HTTP_RESPONSE)
                  .that.deep.includes({
                    status,
                    body: {
                      string: 'abcdefg',
                      number:  1234.56,
                      boolean: true
                    }
                  });

                done();
              });

              $store.dispatch(request)
                .catch(() => {/* prevent console warnings */});
            });
          });

          describe('when the given status handler is an object (action)', () => {
            beforeEach('setup case-specific status handler', () => {
              request[HTTP_REQUEST].handlers[status] = {
                type: `test:status_${status}_handler`,
                custom: 'custom field value'
              };
            });

            it('dispatches the given action providing the response body as a `payload`', (done) => {
              $store.expect([
                request,
                {
                  type: `test:status_${status}_handler`,
                  custom: 'custom field value',
                  payload: {
                    string: 'abcdefg',
                    number:  1234.56,
                    boolean: true
                  }
                }
              ], err => done(err));

              $store.dispatch(request)
                .catch(() => {/* prevent console warnings */});
            });

            it('attaches the original response object as `[HTTP_RESPONSE]`', (done) => {
              const actions = [
                request,
                {
                  type: `test:status_${status}_handler`,
                  custom: 'custom field value',
                  payload: {
                    string: 'abcdefg',
                    number:  1234.56,
                    boolean: true
                  }
                }
              ];

              $store.expect(actions, (err) => {
                if (err) {
                  return done(err);
                }

                const dispatched = $store.getActions();
                const action = dispatched[dispatched.length - 1];

                //noinspection JSCheckFunctionSignatures
                expect(action)
                  .to.have.property(HTTP_RESPONSE)
                  .that.deep.includes({
                    status,
                    body: {
                      string: 'abcdefg',
                      number:  1234.56,
                      boolean: true
                    }
                  });

                done();
              });

              $store.dispatch(request)
                .catch(() => {/* prevent console warnings */});
            });
          });

          describe('when the given status handler is a function (action creator)', () => {
            beforeEach('setup case-specific status handler', () => {
              request[HTTP_REQUEST].handlers[status] = sinon.spy(requestSuccess);
            });

            it('dispatches the given handler as an action creator providing the response body as a `payload`',
              (done) => {
                const actions = [
                  request,
                  requestSuccess({
                    string: 'abcdefg',
                    number:  1234.56,
                    boolean: true
                  })
                ];

                $store.expect(actions, (err) => {
                  if (err) {
                    return done(err);
                  }

                  try {
                    expect(request[HTTP_REQUEST].handlers[status]).to.have.been.called;
                  }
                  catch (err) {
                    return done(err);
                  }

                  done();
                });

                $store.dispatch(request)
                  .catch(() => {/* prevent console warnings */});
              });

            it('additionally provides the original response object as a second argument', (done) => {
              const actions = [
                request,
                requestSuccess({
                  string: 'abcdefg',
                  number:  1234.56,
                  boolean: true
                })
              ];

              $store.expect(actions, (err) => {
                if (err) {
                  return done(err);
                }

                const dispatched = $store.getActions();
                const action = dispatched[dispatched.length - 1];

                //noinspection JSCheckFunctionSignatures
                expect(action)
                  .to.have.property(HTTP_RESPONSE)
                  .that.deep.includes({
                    status,
                    body: {
                      string: 'abcdefg',
                      number:  1234.56,
                      boolean: true
                    }
                  });

                done();
              });

              $store.dispatch(request)
                .catch(() => {/* prevent console warnings */});
            });
          });
        });
      });
  });
});
