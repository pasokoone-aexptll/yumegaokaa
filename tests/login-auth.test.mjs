import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/lib/native.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function harness({ reject = false } = {}) {
  const calls = [];
  const bridge = {
    sendOTP: async (...args) => {
      calls.push(["send", ...args]);
    },
    verifyOTP: async () => {
      calls.push(["verify"]);
      if (reject) throw Error("otp_expired");
    },
    session: async () => ({ signed_in: true, email: "member@example.test" }),
  };
  const exports = {};
  new Function("require", "exports", source)(
    (id) =>
      id.includes("expo-modules-core")
        ? { requireNativeModule: () => bridge }
        : id.includes("sessionState")
          ? {
              sessionState: {
                publish: (s) => calls.push(["publish", s.signed_in]),
              },
            }
          : { platformAuth: undefined },
    exports,
  );
  return { calls, ...exports };
}
test("existing login cannot create an account; registration explicitly can", async () => {
  const h = harness();
  await h.native.sendOTP("member@example.test", false);
  await h.native.sendOTP("new@example.test", true);
  assert.deepEqual(h.calls, [
    ["send", "member@example.test", false],
    ["send", "new@example.test", true],
  ]);
});
test("routing receives the real session only after the verified success presentation", async () => {
  const h = harness();
  let finish;
  const waiting = new Promise((r) => (finish = r));
  const task = h.verifyLoginOTP("member@example.test", "123456", async () => {
    h.calls.push(["success"]);
    await waiting;
  });
  await Promise.resolve();
  assert.deepEqual(h.calls, [["verify"], ["success"]]);
  finish();
  await task;
  assert.deepEqual(h.calls, [["verify"], ["success"], ["publish", true]]);
});
test("a rejected OTP never shows success or publishes a session", async () => {
  const h = harness({ reject: true });
  await assert.rejects(
    h.verifyLoginOTP("member@example.test", "123456", async () =>
      h.calls.push(["success"]),
    ),
    /otp_expired/,
  );
  assert.deepEqual(h.calls, [["verify"]]);
});
