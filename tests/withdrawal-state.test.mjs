import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useWithdrawal.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
function harness(native) {
  const state = [],
    refs = [];
  let i = 0,
    j = 0,
    navigated = 0;
  const exports = {};
  new Function("require", "exports", source)((id) => {
    if (id === "react")
      return {
        useState(value) {
          const k = i++;
          if (!(k in state)) state[k] = value;
          return [
            state[k],
            (v) => {
              state[k] = v;
            },
          ];
        },
        useRef(value) {
          const k = j++;
          return refs[k] ?? (refs[k] = { current: value });
        },
      };
    if (id === "expo-router")
      return {
        router: {
          replace() {
            navigated++;
          },
        },
      };
    return { native };
  }, exports);
  return {
    state,
    render() {
      i = 0;
      j = 0;
      return exports.useWithdrawal();
    },
    navigated: () => navigated,
  };
}
function native(overrides = {}) {
  return {
    accountDetails: async () => ({ email: "fixture@example.test" }),
    rpc: async () => ({ id: "ticket" }),
    sendOTP: async () => {},
    verifyOTP: async () => {},
    logout: async () => {},
    ...overrides,
  };
}
test("expired withdrawal clears the old ticket and requires a new confirmation", async () => {
  const h = harness(
    native({
      rpc: async (op) => {
        if (op === "withdraw_confirm") throw Error("attempt_expired");
        return { id: "ticket" };
      },
    }),
  );
  await h.render().begin();
  h.render().setCode("123456");
  await h.render().finish();
  assert.equal(h.state[0], undefined);
  assert.equal(h.state[1], "");
  assert.match(h.state[3], /有効期限/);
  assert.equal(h.navigated(), 0);
});
test("lost confirm response retries the same ticket without reusing the consumed OTP", async () => {
  let verifies = 0,
    confirms = 0;
  const ids = [];
  const h = harness(
    native({
      verifyOTP: async () => {
        verifies++;
      },
      rpc: async (op, payload) => {
        if (op === "withdraw_prepare") return { id: "ticket" };
        ids.push(payload.id);
        if (++confirms === 1) throw Error("offline");
        return { withdrawn: true };
      },
    }),
  );
  await h.render().begin();
  await h.render().finish();
  await h.render().finish();
  assert.equal(verifies, 1);
  assert.deepEqual(ids, ["ticket", "ticket"]);
  assert.equal(h.navigated(), 1);
});
test("logout retry does not repeat an already confirmed withdrawal", async () => {
  let confirms = 0,
    logouts = 0;
  const h = harness(
    native({
      rpc: async (op) => {
        if (op === "withdraw_confirm") confirms++;
        return { id: "ticket" };
      },
      logout: async () => {
        if (++logouts === 1) throw Error("offline");
      },
    }),
  );
  await h.render().begin();
  await h.render().finish();
  await h.render().finish();
  assert.equal(confirms, 1);
  assert.equal(logouts, 2);
  assert.equal(h.navigated(), 1);
});
