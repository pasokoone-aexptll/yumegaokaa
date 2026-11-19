import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useAccountAccess.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function harness() {
  const values = [],
    refs = [];
  let index = 0,
    refIndex = 0;
  let member = "active",
    name = "",
    avatar = "",
    pool = false;
  const native = {
    rpc: async (op) =>
      op === "account_access"
        ? { status: member }
        : op === "profile_get"
          ? { display_name: name, avatar_path: avatar }
          : { contributed: pool },
    stop: async () => {},
    session: async () => {},
  };
  const exports = {};
  new Function("require", "exports", source)(
    (id) =>
      id === "react"
        ? {
            createContext: (v) => v,
            useCallback: (f) => f,
            useEffect: () => {},
            useState: (v) => {
              const i = index++;
              if (!(i in values)) values[i] = v;
              return [values[i], (v) => (values[i] = v)];
            },
            useRef: (v) =>
              refs[refIndex++] ?? (refs[refIndex - 1] = { current: v }),
          }
        : id === "react-native"
          ? { AppState: {} }
          : { native, streetID: "test" },
    exports,
  );
  const render = () => {
    index = refIndex = 0;
    return exports.useAccountAccess(true, 1);
  };
  const settle = async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };
  return {
    render,
    settle,
    setName: (v) => (name = v),
    setAvatar: (v) => (avatar = v),
    setMember: (v) => (member = v),
    setPool: (v) => (pool = v),
  };
}
test("saving a name cannot let polling skip the profile photo step", async () => {
  const h = harness();
  h.render().retry();
  await h.settle();
  assert.equal(h.render().status, "profile_required");
  h.setName("new member");
  h.render().retry();
  await h.settle();
  assert.equal(h.render().status, "profile_required");
  h.setAvatar("avatar.jpg");
  h.render().retry();
  await h.settle();
  assert.equal(h.render().status, "pool_required");
  h.setPool(true);
  h.render().retry();
  await h.settle();
  assert.equal(h.render().status, "active");
});
test("profile setup never holds a suspended account active", async () => {
  const h = harness();
  h.render().retry();
  await h.settle();
  h.setMember("suspended");
  h.render().retry();
  await h.settle();
  assert.equal(h.render().status, "suspended");
});
test("existing named accounts keep their normal access path", async () => {
  const h = harness();
  h.setName("existing");
  h.setAvatar("avatar.jpg");
  h.setPool(true);
  h.render().retry();
  await h.settle();
  assert.equal(h.render().status, "active");
});
