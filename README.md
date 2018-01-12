# Redux Http Request Middleware

[![Build Status](https://travis-ci.org/hk-labs/redux-http-request-middleware.svg?branch=master)](https://travis-ci.org/hk-labs/redux-http-request-middleware)
[![npm version](https://badge.fury.io/js/redux-http-request-middleware.svg)](https://badge.fury.io/js/redux-http-request-middleware)
[![dependencies Status](https://david-dm.org/hk-labs/redux-http-request-middleware/status.svg)](https://david-dm.org/hk-labs/redux-http-request-middleware)

The concept of this library is that you can define your own redux actions with any type and payload attaching the http request ability using the `HTTP_REQUEST` field.

Technically, when dispatching the action charged with `HTTP_REQUEST`, the middleware sends the http request eventually dispatching the response (success/failure) handler.
Additionally, dispatching this actions returns promises which makes it friendly with libs like [Redux Form](https://github.com/erikras/redux-form) and [Redux Saga](https://github.com/redux-saga/redux-saga) and makes possible the "server-side rendering".


## Installation

Using NPM:

```bash
$ npm install redux-http-request-middleware --save
```

Using Yarn:

```bash
$ yarn add redux-http-request-middleware
```

## Basic setup

Register the `httpRequestMiddleware` in your redux store configuration:

_i.e. `src/index.js` or `src/redux/index.js`_

```js
import { applyMiddleware, createStore } from 'redux';
import { httpRequestMiddleware } from 'redux-http-request-middleware';

import rootReducer from './reducers';

const httpRequestOptions = { // optional configuration
  defaultHeaders: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
};

const store = createStore(
  rootReducer,
  applyMiddleware(
    httpRequestMiddleware(httpRequestOptions)
  )
);
```

## Usage example

The library keeps declarative programming style (as react/redux are), no callback hell, just define a pure actions.

_i.e `src/redux/actions/auth.js`:_

```js
import { HTTP_REQUEST, METHOD_POST } from 'redux-http-request-middleware';

/**
 * Create the "login" action.
 */
const login = (email, password) => ({
  type: 'LOGIN_REQUEST',
  payload: { email, password }, // you can have any fields in your action, it's not required
  [HTTP_REQUEST]: { // here we go!
    path: '/api/login',
    method: METHOD_POST, // or simply 'post'
    body: { email, password }, // this will be sent as a json
    handlers: {
      success: (result) => ({ // the actions that will be dispatched on success response
        type: 'LOGIN_SUCCESS',
        payload: result
      }),
      failure: (error) => ({ // the action that will be dispatched if request failures
        type: 'LOGIN_FAILURE',
        message: `Error: ${error.message}`
      })
    }
  }
});
```

And then dispatch your actions from your components/sagas/etc...

_i.e. `src/components/LoginForm.js`_

```js
import React, {Component} from 'react';
import {connect} from 'react-redux';

import {login} from '../redux/actions/auth';

export class LoginForm extends Component {
  ...

  handleSubmit = () => {
    const {email, password} = this.state;
    const {dispatch} = this.props;
    dispatch(login(email, password));
  }

  ...

  render() {
    ...
  }
}

const mapStateToProps = (state, props) => ({ ... });

export default connect(mapStateToProps)(LoginForm);
```


## Documentation

> todo...


## API Reference

> todo...


## Contributing

Feel free to dive in! [Open an issue](https://github.com/hk-labs/redux-http-request-middleware/issues/new) or submit PRs.


## Running tests

Using NPM:

```bash
$ npm test
```

Using Yarn:

```bash
$ yarn test
```


## License

Licensed under [MIT](LICENSE) © 2017-present Holy Krab Labs
