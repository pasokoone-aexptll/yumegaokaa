import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useAutoVerifyCode.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function harness() {
  const refs = [];
  let index = 0,
    last = [],
    effect;
  const exports = {};
  new Function("require", "exports", source)(
    () => ({
      useRef(value) {
        const i = index++;
        return (refs[i] ??= { current: value });
      },
      useEffect(fn, deps) {
        if (deps.some((v, i) => v !== last[i])) {
          effect = fn;
          last = deps;
        }
      },
    }),
    exports,
  );
  return (props) => {
    index = 0;
    effect = undefined;
    exports.useAutoVerifyCode(props);
    effect?.();
  };
}
test("six digits submits once despite busy and ordinary rerenders", () => {
  const render = harness(),
    calls = [];
  const props = {
    address: "new@example.test",
    code: "12345",
    enabled: true,
    busy: false,
    verify: async (...args) => calls.push(args),
  };
  render(props);
  assert.equal(calls.length, 0);
  render({ ...props, code: "123456" });
  render({ ...props, code: "123456", busy: true });
  render({ ...props, code: "123456" });
  assert.deepEqual(calls, [["new@example.test", "123456"]]);
});
test("correcting a failed code allows retry; changing address is a distinct verification", () => {
  const render = harness(),
    calls = [];
  const props = {
    address: "old@example.test",
    code: "123456",
    enabled: true,
    busy: false,
    verify: async (...args) => calls.push(args),
  };
  render(props);
  render({ ...props, code: "12345" });
  render(props);
  render({ ...props, address: "new@example.test" });
  assert.equal(calls.length, 3);
  assert.equal(calls[2][0], "new@example.test");
});
test("unready, completed, busy and invalid input cannot submit", () => {
  const render = harness(),
    calls = [];
  const props = {
    address: "new@example.test",
    code: "123456",
    enabled: false,
    busy: false,
    verify: async (...args) => calls.push(args),
  };
  render(props);
  render({ ...props, enabled: true, busy: true });
  render({ ...props, enabled: true, code: "12a456" });
  assert.equal(calls.length, 0);
  render({ ...props, enabled: true });
  assert.equal(calls.length, 1);
});
