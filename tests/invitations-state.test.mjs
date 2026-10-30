import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useInvitations.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
function harness(rpc, submit = async () => ({})) {
  const state = [];
  let i = 0,
    focus;
  const e = {};
  new Function("require", "exports", "setInterval", "clearInterval", source)(
    (id) => {
      if (id === "react")
        return {
          useCallback: (x) => x,
          useContext: () => ({ status: "active", retry() {} }),
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
      if (id.includes("commands"))
        return { pendingCommand: async () => null, submitCommand: submit };
      return { native: { rpc } };
    },
    e,
    () => 1,
    () => {},
  );
  return { hook: e.useInvitations(), state, focus: () => focus() };
}
const tick = () => new Promise((r) => setImmediate(r));
test("late invitation lists cannot replace a returned screen", async () => {
  const reads = [];
  const h = harness(() => new Promise((r) => reads.push(r)));
  const blur = h.focus();
  await tick();
  blur();
  h.focus();
  await tick();
  reads[1]({ items: [{ id: "current", expires_at: "2099-01-01" }] });
  await tick();
  reads[0]({ items: [{ id: "old" }] });
  await tick();
  assert.equal(h.state[1][0].id, "current");
  assert.equal(h.state[6], false);
});
test("duplicate invite taps issue once and blurred results do not reveal codes", async () => {
  let finish,
    count = 0;
  const h = harness(
    async () => ({ items: [] }),
    () => {
      count++;
      return new Promise((r) => (finish = r));
    },
  );
  const blur = h.focus();
  await tick();
  const pending = h.hook.act("invite_create");
  await h.hook.act("invite_create");
  assert.equal(count, 1);
  blur();
  finish({ id: "secret", code: "private-code" });
  await pending;
  assert.equal(h.state[3], null);
  assert.equal(h.state[5], false);
});
test("failed list clears shared codes and can be retried", async () => {
  let fail = false;
  const h = harness(
    async () => {
      if (fail) throw Error("offline");
      return { items: [{ id: "new", expires_at: "2099-01-01" }] };
    },
    async () => ({ id: "new", code: "secret" }),
  );
  h.focus();
  await tick();
  await h.hook.act("invite_create");
  assert.equal(h.state[3].code, "secret");
  fail = true;
  await h.hook.refresh();
  assert.equal(h.state[3], null);
  assert.deepEqual(h.state[1], []);
  fail = false;
  await h.hook.refresh();
  assert.equal(h.state[1][0].id, "new");
  assert.equal(h.state[4], "");
});
