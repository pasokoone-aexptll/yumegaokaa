import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(readFileSync("apps/mobile/src/hooks/useMembers.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
function harness(rpc) {
  const state = [];
  let index = 0, focus;
  const exports = {};
  new Function("require", "exports", source)((name) => {
    if (name === "react") return {
      useCallback: (fn) => fn,
      useRef: (value) => ({ current: value }),
      useState: (value) => {
        const slot = index++;
        state[slot] = value;
        return [value, (next) => { state[slot] = typeof next === "function" ? next(state[slot]) : next; }];
      },
    };
    if (name === "expo-router") return { useFocusEffect: (fn) => { focus = fn; } };
    return { native: { rpc } };
  }, exports);
  return { hook: exports.useMembers(), state, focus: () => focus() };
}
test("editing a later-page member refreshes all loaded pages", async () => {
  const rows = Array.from({ length: 101 }, (_, i) => ({ account_id: String(i).padStart(3, "0"), active: true }));
  const h = harness(async (_op, { after }) => ({ items: rows.filter((r) => !after || r.account_id > after).slice(0, 100) }));
  await h.hook.refresh();
  await h.hook.loadMore();
  rows[100].active = false;
  await h.hook.refresh();
  assert.equal(h.state[0].length, 101);
  assert.equal(h.state[0][100].active, false);
  assert.equal(h.state[3], false);
});
test("leaving the screen rejects a late private member response", async () => {
  let resolve;
  const h = harness(() => new Promise((r) => { resolve = r; }));
  const blur = h.focus();
  blur();
  resolve({ items: [{ account_id: "private" }] });
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(h.state[0], []);
});
