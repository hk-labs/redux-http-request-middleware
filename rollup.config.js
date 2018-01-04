import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import prettier from 'rollup-plugin-prettier';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';

const {NODE_ENV} = process.env;

const config = {
  input: 'src/index.js',
  plugins: [],
  external: ['superagent'],
  output: {
    globals: {
      superagent: 'superagent'
    }
  }
};

if (NODE_ENV === 'es' || NODE_ENV === 'cjs') {
  config.output.format = NODE_ENV;
  config.plugins.push(
    babel({
      plugins: ['external-helpers']
    }),
    prettier({
      tabWidth: 2,
      singleQuote: true,
      sourceMap: true
    })
  )
}

if (NODE_ENV === 'development' || NODE_ENV === 'production') {
  config.output.format = 'umd';
  config.output.name = 'ReduxHttpRequestMiddleware';
  config.plugins.push(
    resolve({
      jsnext: true
    }),
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers'],
      externalHelpers: true
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
    })
  )
}

if (NODE_ENV === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  );
}

export default config;
