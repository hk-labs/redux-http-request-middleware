# Redux Http Request Middleware

> todo: write a great readme!

## Installation

NPM:

```bash
$ npm install redux-http-request-middleware --save
```

Yarn:

```bash
$ yarn add redux-http-request-middleware
```

## Usage Example

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


## API


## Contributing

Feel free to dive in! [Open an issue](https://github.com/hk-labs/redux-http-request-middleware/issues/new) or submit PRs.


## Running tests

In your terminal run:

```bash
$ npm test
```

or using yarn:

```bash
$ yarn test
```


## License

Licensed under [MIT](LICENSE) © 2017-present Holy Krab Labs
