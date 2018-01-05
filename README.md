# Redux Http Request Middleware

> todo: write a great readme!


## Installation

Using NPM:

```bash
$ npm install redux-http-request-middleware --save
```

Using Yarn:

```bash
$ yarn add redux-http-request-middleware
```


## Usage Example

In your initialization file:

_i.e. `src/index.js` or `src/redux/index.js`_

```js
import { applyMiddleware, createStore } from 'redux';
import { httpRequestMiddleware } from 'redux-http-request-middleware';

import reducer from './reducers';

const store = createStore(
  reducer,
  applyMiddleware(httpRequestMiddleware())
);

// render the application
```

Now you can attach http request to your redux actions like this:

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
      [401]: (result) => ({ // the action will be dispatched on response with status code 401 "Unauthorized"
        type: 'LOGIN_FAILURE',
        message: 'Invalid credentials'
      }).
      failure: (err) => ({ // the action that will be dispatched if request failures
        type: 'LOGIN_FAILURE',
        message: `Error: ${err.message}`
      })
    }
  }
});
```

And then dispatch the action from your components/sagas/etc...

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


## API


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
