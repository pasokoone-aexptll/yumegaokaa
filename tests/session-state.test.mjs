import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';

test('identity changes discard screen state, same-account reauthentication preserves it', () => {
  let cleared = 0, blocksCleared = 0;
  const exports = {};
  const source = ts.transpileModule(readFileSync('apps/mobile/src/lib/sessionState.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'exports', source)(id => id.includes("localBlocks") ? { localBlocks: { clear: () => blocksCleared++ } } : ({ clearDraft: () => cleared++ }), exports);
  const store = exports.sessionState;
  let changes = 0;
  const unsubscribe = store.subscribe(() => changes++);
  store.publish({ signed_in: false, email: '' });
  assert.equal(store.get().ready, true);
  store.publish({ signed_in: true, email: 'one@example.test' });
  const signed = store.get();
  store.publish({ signed_in: true, email: 'one@example.test' });
  assert.equal(store.get(), signed, 'Same identity keeps the current withdrawal operation mounted');
  assert.equal(cleared, 1);
  store.publish({ signed_in: false, email: 'one@example.test' });
  assert.equal(store.get().email, '');
  assert.equal(store.get().revision, signed.revision + 1);
  store.publish({ signed_in: true, email: 'two@example.test' });
  assert.equal(cleared, 3, 'Other account cannot inherit a pin draft');
  assert.equal(blocksCleared, 3, 'Other account cannot inherit local block masks');
  assert.equal(changes, 4);
  unsubscribe();
  store.publish({ signed_in: false, email: '' });
  assert.equal(changes, 4);
});
