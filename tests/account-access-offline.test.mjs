import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";

const source = ts.transpileModule(readFileSync("apps/mobile/src/hooks/useAccountAccess.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

test("failed access lookup exposes offline navigation without granting access or carrying it to another session", async () => {
  const values = [];
  let cursor = 0, response = "offline";
  const exports = {};
  new Function("require", "exports", source)((name) => {
    if (name === "react") return {
      createContext: (value) => value,
      useCallback: (fn) => fn,
      useEffect: () => {},
      useRef: (initial) => { const index = cursor++; return values[index] ??= { current: initial }; },
      useState: (initial) => {
        const index = cursor++;
        if (!(index in values)) values[index] = initial;
        return [values[index], (value) => { values[index] = value; }];
      },
    };
    if (name === "react-native") return { AppState: {} };
    return { streetID: "street", native: {
      rpc: async (operation) => {
        if (response === "offline") throw new Error("network unavailable");
        if (operation === "account_access") return { status: response };
        if (operation === "profile_get") return { display_name: "test" };
        return { contributed: true };
      },
      stop: async () => {},
    } };
  }, exports);
  const render = (signed = true, revision = 1) => {
    cursor = 0;
    return exports.useAccountAccess(signed, revision);
  };
  let hook = render();
  assert.equal(hook.unavailable, false);
  hook.retry();
  await new Promise(setImmediate);
  hook = render();
  assert.equal(hook.status, "unknown");
  assert.equal(hook.unavailable, true);
  assert.equal(render(false).unavailable, false);
  assert.equal(render(true, 2).unavailable, false);
  response = "active";
  render().retry();
  await new Promise(setImmediate);
  hook = render();
  assert.equal(hook.status, "active");
  assert.equal(hook.unavailable, false);
  response = "suspended";
  hook.retry();
  await new Promise(setImmediate);
  assert.equal(render().status, "suspended");
  response = "offline";
  render().retry();
  await new Promise(setImmediate);
  assert.equal(render().status, "suspended");
});
