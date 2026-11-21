const ts = require(process.cwd() + "/apps/mobile/node_modules/typescript");
const fs = require("fs"),
  vm = require("vm"),
  assert = require("assert/strict");
let cleanup,
  active = false,
  cleared = 0;
const mocks = {
  react: {
    useEffect: (f) => {
      cleanup = f();
    },
    useRef: (v) => ({ current: v }),
    useState: (v) => [v, () => {}],
  },
  "expo-router": { useRouter: () => ({}) },
  "../lib/pinPlacement": { isDenshinPlacementActive: () => active },
  "../lib/denshinDraft": {
    useDenshinDraft: () => ({}),
    clearDenshinDraft: () => cleared++,
    updateDenshinDraft: () => {},
  },
  "../lib/commands": { pendingCommand: async () => undefined },
  "../lib/streetChanges": {},
  "../lib/denshin": {},
  "../lib/native": {},
  "../lib/sessionState": {},
};
const output = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("apps/mobile/src/hooks/useDenshinEditor.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  {
    exports: output,
    require: (n) => {
      assert.ok(n in mocks, n);
      return mocks[n];
    },
  },
);
output.useDenshinEditor();
cleanup();
assert.equal(cleared, 1, "native dismissal clears draft");
active = true;
output.useDenshinEditor();
cleanup();
assert.equal(cleared, 1, "map picker retains draft");
active = false;
output.useDenshinEditor();
cleanup();
assert.equal(cleared, 2, "dismissal after returning from picker clears draft");
console.log("3 dismissal lifecycle assertions passed");
