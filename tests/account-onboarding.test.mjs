import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';

const source = ts.transpileModule(
  readFileSync('apps/mobile/src/hooks/useAccountAccess.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

async function check(status, name, failure = false, contributed = true) {
  const states = [], calls = [], exports = {};
  const native = {
    rpc: async (operation) => {
      calls.push(operation);
      if (operation === 'account_access') return { status };
      if (failure) throw Error('network_error');
      if (operation === 'street_icon_get') return { contributed };
      return { display_name: name };
    },
    stop: async () => {},
    session: async () => {},
  };
  const react = {
    createContext: value => value,
    useState: value => [value, next => states.push(next)],
    useRef: value => ({ current: value }),
    useCallback: callback => callback,
    useEffect: () => {},
  };
  new Function('require', 'exports', source)(
    id => id === 'react' ? react : id === 'react-native' ? {} : { native },
    exports,
  );
  exports.useAccountAccess(true, 7).retry();
  await new Promise(resolve => setImmediate(resolve));
  return { states, calls };
}

test('invited member without a name must complete profile; saved name resumes Map access', async () => {
  assert.deepEqual((await check('active', '')).states, [{ revision: 7, chatRestrictedUntil: null, status: 'profile_required' }]);
  assert.deepEqual((await check('active', '街の人')).states, [{ revision: 7, chatRestrictedUntil: null, status: 'active' }]);
});

test('unregistered and suspended users do not read profiles; network failure cannot complete onboarding', async () => {
  for (const status of ['unregistered', 'suspended', 'withdrawn']) {
    const result = await check(status, '');
    assert.deepEqual(result.calls, ['account_access']);
    assert.equal(result.states[0].status, status);
  }
  assert.deepEqual((await check('active', '', true)).states, []);
});

test('first enrollment requires pool contribution independently of the saved display name', async () => {
  assert.deepEqual((await check('active', 'name', false, false)).states,
    [{ revision: 7, chatRestrictedUntil: null, status: 'pool_required' }]);
});
