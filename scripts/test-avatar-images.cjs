const ts = require("../apps/mobile/node_modules/typescript");
const fs = require("fs");
const vm = require("vm");
const assert = require("assert/strict");
let revision = 1,
  tokens = 0,
  loads = 0,
  fail = false;
const result = {};
const mocks = {
  "expo-image": {
    Image: {
      loadAsync: async () => {
        loads++;
        if (fail) throw Error("offline");
        return { id: loads };
      },
    },
  },
  "./native": {
    native: {
      realtimeToken: async () => {
        tokens++;
        return "test";
      },
    },
    key: "test",
    url: "https://example.invalid",
  },
  "./sessionState": { sessionState: { get: () => ({ revision }) } },
};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("apps/mobile/src/lib/avatarImages.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  { exports: result, require: (n) => mocks[n] },
);
(async () => {
  const a = result.loadAvatar("avatars", "one", "1"),
    b = result.loadAvatar("avatars", "one", "1");
  assert.equal(a, b, "concurrent rows share loading");
  const image = await a;
  assert.equal(await result.loadAvatar("avatars", "one", "1"), image);
  assert.equal(loads, 1);
  assert.equal(tokens, 1);
  assert.equal(result.cachedAvatar("avatars", "one", "1"), image);
  await result.loadAvatar("avatars", "one", "2");
  assert.equal(loads, 2, "version refresh");
  revision++;
  assert.equal(result.cachedAvatar("avatars", "one", "1"), undefined);
  await result.loadAvatar("avatars", "one", "1");
  assert.equal(loads, 3, "account isolation");
  fail = true;
  await assert.rejects(result.loadAvatar("avatars", "bad"));
  assert.equal(loads, 5, "bounded retry");
  fail = false;
  await result.loadAvatar("avatars", "bad");
  assert.equal(loads, 6, "failure not cached forever");
  console.log("avatar sharing/version/session/retry checks passed");
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
