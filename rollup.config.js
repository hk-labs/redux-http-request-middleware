import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import {uglify} from 'rollup-plugin-uglify';

const {NODE_ENV} = process.env;

const config = {
  input: 'src/http-request-middleware.js',
  plugins: [],
  external: ['superagent'],
  output: {}
};

if (NODE_ENV === 'es' || NODE_ENV === 'cjs') {
  config.output.format = NODE_ENV;

  config.plugins.push(
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    })
  );
}

else if (NODE_ENV === 'development' || NODE_ENV === 'production') {
  config.output.format = 'umd';
  config.output.name = 'ReduxHttpRequestMiddleware';
  config.output.globals = { superagent: 'superagent' };

  config.plugins.push(
    resolve(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    }),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
    })
  );

  if (NODE_ENV === 'production') {
    config.plugins.push(
      uglify({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true
        }
      })
    );
  }
}

export default config;
