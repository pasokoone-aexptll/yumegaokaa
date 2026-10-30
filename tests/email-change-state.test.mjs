import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
const source = ts.transpileModule(readFileSync('apps/mobile/src/hooks/useEmailChange.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function harness(native) {
  const state = []; let index = 0, focus;
  const exports = {};
  new Function('require', 'exports', source)(id => {
    if (id === 'react') return {
      useCallback: x => x, useRef: x => ({ current: x }),
      useState: x => { const i = index++; state[i] = x; return [x, v => { state[i] = v; }]; },
    };
    if (id === 'expo-router') return { useFocusEffect(fn) { focus = fn; } };
    return { native };
  }, exports);
  return { hook: exports.useEmailChange(), state, focus: () => focus() };
}
test('lost send response restores the pending address instead of leaving verification inaccessible', async () => {
  const h = harness({
    changeEmail: async () => { throw Error('response lost'); },
    accountDetails: async () => ({ email: 'old@example.test', new_email: 'new@example.test' }),
  });
  await h.hook.send();
  assert.equal(h.state[0], 'old@example.test');
  assert.equal(h.state[1], 'new@example.test');
  assert.equal(h.state[8], true);
  assert.match(h.state[6], /操作結果/);
});
test('duplicate sends are serialized and blur prevents late account display', async () => {
  let finish, reads = 0, sends = 0;
  const h = harness({
    changeEmail: () => { sends++; return new Promise(r => { finish = r; }); },
    accountDetails: async () => { reads++; return { email: 'old', new_email: '' }; },
  });
  const blur = h.focus();
  await new Promise(r => setImmediate(r));
  const send = h.hook.send();
  await h.hook.send();
  assert.equal(sends, 1);
  blur(); finish(); await send;
  assert.equal(reads, 1);
  assert.equal(h.state[5], false);
});
test('failed account read gates actions and retry recovers the current state', async () => {
  let failed = true;
  const h = harness({ accountDetails: async () => {
    if (failed) throw Error('offline');
    return { email: 'current@example.test', new_email: '' };
  } });
  await h.hook.load();
  assert.equal(h.state[8], false);
  assert.equal(h.state[7], false);
  failed = false;
  await h.hook.load();
  assert.equal(h.state[8], true);
  assert.equal(h.state[6], '');
});
