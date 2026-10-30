import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
const source = ts.transpileModule(readFileSync('apps/mobile/src/hooks/useModeration.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function harness(rpc) {
  const state = []; let index = 0, focus, notifications = 0;
  const exports = {};
  new Function('require', 'exports', source)(id => {
    if (id === 'react') return {
      useCallback: x => x, useRef: x => ({ current: x }),
      useState: x => { const i = index++; state[i] = x; return [x, v => { state[i] = v; }]; },
    };
    if (id === 'expo-router') return { useFocusEffect(fn) { focus = fn; } };
    if (id.includes('streetChanges')) return { streetChanges: { notify() { notifications++; } } };
    return { native: { rpc } };
  }, exports);
  const hook = exports.useModeration();
  return { hook, state, focus: () => focus(), notifications: () => notifications };
}
test('late report evidence does not reappear after leaving the screen', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; }));
  const blur = h.focus();
  blur();
  resolve({ items: [{ id: 'secret-report' }] });
  await new Promise(r => setImmediate(r));
  assert.deepEqual(h.state[0], []);
});
test('duplicate actions send once and an older list cannot restore a resolved report', async () => {
  let oldRead, write; let reads = 0, writes = 0;
  const h = harness(op => {
    if (op === 'operator_reports') return ++reads === 1
      ? new Promise(r => { oldRead = r; }) : Promise.resolve({ items: [] });
    writes++; return new Promise(r => { write = r; });
  });
  const before = h.hook.load();
  const action = h.hook.act('operator_report_resolve', 'r1', 'handled');
  await h.hook.act('operator_report_resolve', 'r1', 'handled');
  assert.equal(writes, 1);
  write({ resolved: true }); await action;
  oldRead({ items: [{ id: 'r1' }] }); await before;
  assert.deepEqual(h.state[0], []);
  assert.equal(h.notifications(), 1);
  assert.equal(h.state[2], false);
});
test('a lost response refreshes the list without claiming success', async () => {
  const calls = [];
  const h = harness(async op => {
    calls.push(op);
    if (op === 'operator_report_resolve') throw Error('lost response');
    return { items: [] };
  });
  await h.hook.act('operator_report_resolve', 'r1', 'handled');
  assert.deepEqual(calls, ['operator_report_resolve', 'operator_reports']);
  assert.match(h.state[1], /操作結果/);
  assert.equal(h.state[2], false);
});
