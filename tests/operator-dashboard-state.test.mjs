import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useOperatorDashboard.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
function harness(native) {
  const state = [];
  let index = 0,
    focus;
  const exports = {};
  new Function("require", "exports", source)((id) => {
    if (id === "react")
      return {
        useCallback: (x) => x,
        useRef: (x) => ({ current: x }),
        useState: (x) => {
          const i = index++;
          state[i] = x;
          return [
            x,
            (v) => {
              state[i] = typeof v === "function" ? v(state[i]) : v;
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
    return { native };
  }, exports);
  return { hook: exports.useOperatorDashboard(), state, focus: () => focus() };
}
const tick = () => new Promise((r) => setImmediate(r));
test("late dashboard response cannot restore private list after blur", async () => {
  let resolve;
  const h = harness({
    rpc: async (op) =>
      op === "operator_status"
        ? { operator: true }
        : op === "operator_dashboard"
          ? {}
          : new Promise((r) => {
              resolve = r;
            }),
    mfaFactors: async () => ({ factors: [] }),
  });
  const blur = h.focus();
  await tick();
  blur();
  resolve({ items: [{ id: "private" }] });
  await tick();
  assert.deepEqual(h.state[7], []);
  assert.equal(h.state[1], false);
  assert.equal(h.state[8], null);
});
test("late MFA enrollment cannot restore the setup secret after blur and double tap sends once", async () => {
  let resolve,
    calls = 0;
  const h = harness({
    rpc: async () => ({ operator: false }),
    mfaEnroll: () => {
      calls++;
      return new Promise((r) => {
        resolve = r;
      });
    },
  });
  const blur = h.focus();
  await tick();
  const pending = h.hook.enroll();
  await h.hook.enroll();
  assert.equal(calls, 1);
  blur();
  resolve({ id: "factor", totp: { secret: "sensitive" } });
  await pending;
  assert.equal(h.state[5], "");
  assert.equal(h.state[4], "");
});
test("lost revoke response still refreshes authoritative invitation state", async () => {
  const calls = [];
  const h = harness({
    rpc: async (op) => {
      calls.push(op);
      if (op === "operator_invite_revoke") throw Error("offline");
      return op === "operator_invites"
        ? { items: [{ id: "i", revoked_at: "now" }] }
        : {};
    },
  });
  await h.hook.revoke("i");
  assert.deepEqual(calls, [
    "operator_invite_revoke",
    "operator_dashboard",
    "operator_invites",
  ]);
  assert.equal(h.state[7][0].revoked_at, "now");
  assert.match(h.state[3], /offline/);
});
