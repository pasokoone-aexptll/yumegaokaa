import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
const exports = {};
new Function('exports', ts.transpileModule(
  readFileSync('apps/mobile/src/lib/chatWindow.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText)(exports);
const row = n => ({ id: String(n).padStart(5, '0'), created_at: '2026-10-30T00:00:00Z', body: 'text' });
test('recover more than 50 missed messages without growing the older boundary', async () => {
  const data = Array.from({ length: 200 }, (_, i) => row(200-i));
  const cursors = [];
  const result = await exports.readChatWindow(async cursor => {
    cursors.push(cursor?.id);
    return data.filter(r => !cursor || r.id < cursor.id).slice(0, 50);
  }, row(75), () => false);
  assert.equal(cursors.length, 3);
  assert.equal(result.length, 126);
  assert.equal(result.at(-1).id, row(75).id);
});
test('fresh window replaces deleted text and excludes blocked or expired records', async () => {
  const data = [row(3), { ...row(2), body: null, deleted: true }];
  const result = await exports.readChatWindow(async () => data, row(1), () => false);
  assert.deepEqual(result, data);
  assert.equal(result.find(r => r.id === row(2).id).body, null);
  assert.equal(result.some(r => r.id === row(1).id), false);
});
test('cancelled response cannot replace current cache', async () => {
  let cancelled = false;
  assert.equal(await exports.readChatWindow(async () => {
    cancelled = true;
    return [row(1)];
  }, undefined, () => cancelled), null);
});
