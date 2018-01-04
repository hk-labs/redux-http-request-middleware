import reduxMockStore from 'redux-mock-store';
import chai from 'chai';

/**
 * Force assertion errors to be informative when comparing actions.
 */
chai.config.truncateThreshold = 0;

/**
 * Setup a store mock factory.
 *
 * @param {Array<function>} [middlewares]
 */
export default function configureStore(middlewares) {
  const mockStore = reduxMockStore(middlewares);

  return (initialState) => {
    const store = mockStore(initialState);

    /**
     * Setup expected actions.
     *
     * @param {Array<{type: string, ...any}>} actions
     * @param {function(err:Error?)} done
     */
    store.expect = (actions, done) => {
      if (!Array.isArray(actions)) {
        throw new Error('expecting actions is required to be an array');
      }

      const expectations = [...actions];

      const unsubscribe = store.subscribe(() => {
        const actions = store.getActions();
        const action = actions[actions.length - 1];

        if (!expectations.length) {
          unsubscribe();
          done(new Error(`unexpected action "${JSON.stringify(action)}"`));
          return;
        }

        const expected = expectations.shift();

        try {
          expect(action).to.eql(expected);

          if (!expectations.length) { // all expectations are justified
            unsubscribe();
            done();
          }

          // otherwise, continue
        }
        catch (err) {
          unsubscribe();
          done(err);
        }
      });
    };

    return store;
  };
}
