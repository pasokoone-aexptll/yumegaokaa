import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
const source = ts.transpileModule(readFileSync('apps/mobile/src/hooks/useEventDetail.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function harness(rpc) {
  const state = []; let index = 0, notifications = 0;
  const exports = {};
  new Function('require', 'exports', source)(id => {
    if (id === 'react') return {
      useCallback: x => x, useRef: x => ({ current: x }),
      useState: x => { const i = index++; state[i] = x; return [x, v => { state[i] = v; }]; },
    };
    if (id === 'expo-router') return { useFocusEffect() {} };
    if (id.includes('streetChanges')) return { streetChanges: { notify() { notifications++; } } };
    return { native: { rpc } };
  }, exports);
  return { hook: exports.useEventDetail('e1'), state, notifications: () => notifications };
}
test('a pre-mutation read cannot restore an old registration; duplicate taps send once', async () => {
  let resolveOld, resolveMutation, writes = 0, reads = 0;
  const h = harness(op => {
    if (op === 'operator_status') return Promise.resolve({ operator: false });
    if (op === 'event_get') {
      reads++;
      return reads === 1 ? new Promise(r => { resolveOld = r; }) : Promise.resolve({ joined: true });
    }
    writes++; return new Promise(r => { resolveMutation = r; });
  });
  const old = h.hook.load();
  const mutation = h.hook.act('event_register', { joined: true, revision: 0 });
  await h.hook.act('event_register', { joined: true, revision: 0 });
  assert.equal(writes, 1);
  resolveMutation({}); await mutation;
  resolveOld({ joined: false }); await old;
  assert.equal(h.state[0].joined, true);
  assert.equal(h.notifications(), 1);
});
test('cancellation closes details without fetching an intentionally unavailable event', async () => {
  const calls = [];
  const h = harness(async op => { calls.push(op); return {}; });
  await h.hook.act('event_cancel', { revision: 1 });
  assert.deepEqual(calls, ['event_cancel']);
  assert.equal(h.state[4], true);
  assert.equal(h.state[0], undefined);
  assert.equal(h.state[1], '');
});
test('a lost mutation response re-reads server state instead of reporting false success', async () => {
  const h = harness(async op => {
    if (op === 'event_register') throw Error('response lost');
    return { joined: false, registration_revision: 2 };
  });
  await h.hook.act('event_register', { joined: false, revision: 1 });
  assert.equal(h.state[0].joined, false);
  assert.match(h.state[1], /操作結果/);
  assert.equal(h.state[3], false);
});

test('non-host operator gets roster control without host mutation rights', async () => {
  const h = harness(async op => op === 'operator_status' ? { operator: true } : { mine: false });
  await h.hook.load();
  assert.equal(h.state[0].mine, false);
  assert.equal(h.state[7], true);
});
