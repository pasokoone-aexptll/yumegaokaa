import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useNotifications.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
function harness(rpc) {
  const state = [];
  let i = 0,
    focus;
  const e = {};
  new Function("require", "exports", "setInterval", "clearInterval", source)(
    (id) => {
      if (id === "react")
        return {
          useCallback: (x) => x,
          useRef: (x) => ({ current: x }),
          useState: (x) => {
            const n = i++;
            state[n] = x;
            return [
              x,
              (v) => {
                state[n] = typeof v === "function" ? v(state[n]) : v;
              },
            ];
          },
        };
      if (id === "expo-router")
        return {
          useFocusEffect(fn) {
            focus = fn;
          },
        };
      if (id === "react-native")
        return {
          AppState: {
            currentState: "active",
            addEventListener: () => ({ remove() {} }),
          },
        };
      if (id.includes("streetChanges"))
        return { streetChanges: { subscribe: () => () => {} } };
      return { native: { rpc } };
    },
    e,
    () => 1,
    () => {},
  );
  return { hook: e.useNotifications(), state, focus: () => focus() };
}
const tick = () => new Promise((r) => setImmediate(r));
test("returning to notifications starts a fresh read without waiting for an old request", async () => {
  const resolvers = [];
  const h = harness(() => new Promise((r) => resolvers.push(r)));
  const blur = h.focus();
  blur();
  const again = h.focus();
  assert.equal(resolvers.length, 2);
  resolvers[1]({ items: [{ id: "current" }] });
  await tick();
  resolvers[0]({ items: [{ id: "old" }] });
  await tick();
  assert.equal(h.state[0][0].id, "current");
  assert.equal(h.state[2], false);
  again();
});
test("double tap acknowledges once and a late unread list cannot undo success", async () => {
  let read,
    write,
    writes = 0,
    reads = 0;
  const notice = { id: "notice", read: false };
  const h = harness((op) => {
    if (op === "notification_read") {
      writes++;
      return new Promise((r) => (write = r));
    }
    if (++reads === 1) return Promise.resolve({ items: [notice] });
    return new Promise((r) => (read = r));
  });
  const blur = h.focus();
  await tick();
  const pending = h.hook.load();
  const acknowledge = h.hook.markRead(notice);
  assert.equal(await h.hook.markRead(notice), false);
  assert.equal(writes, 1);
  write({});
  assert.equal(await acknowledge, true);
  read({ items: [notice] });
  await pending;
  assert.equal(h.state[0][0].read, true);
  assert.equal(h.state[3], null);
  blur();
});
