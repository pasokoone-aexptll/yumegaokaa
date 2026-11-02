import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useKeyboardOverlap.ts", "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  },
).outputText;

test("keyboard overlap uses screen coordinates, excludes the tab bar, updates frame and resets on hide", () => {
  const listeners = new Map();
  const effects = [];
  let overlap = 0;
  let bottom = 760;
  const exports = {};
  new Function("require", "exports", source)((id) => {
    if (id === "react")
      return {
        useRef: (value) => ({ current: value }),
        useState: (initial) => [
          typeof initial === "function" ? initial() : initial,
          (next) => {
            overlap = next;
          },
        ],
        useCallback: (fn) => fn,
        useEffect: (fn) => effects.push(fn),
      };
    return {
      Platform: { OS: "ios" },
      Dimensions: { get: () => ({ height: 844 }) },
      Easing: { out: (x) => x, cubic: () => {} },
      Animated: {
        Value: class {
          stopAnimation() {}
        },
        timing: (_value, config) => {
          assert.equal(config.useNativeDriver, true);
          return { start() {} };
        },
      },
      Keyboard: {
        metrics: () => undefined,
        scheduleLayoutAnimation() {},
        addListener: (name, fn) => {
          listeners.set(name, fn);
          return { remove: () => listeners.delete(name) };
        },
      },
    };
  }, exports);
  const hook = exports.useKeyboardOverlap(84);
  hook.root.current = { measureInWindow: (fn) => fn(0, 60, 390, bottom - 60) };
  const cleanup = effects[0]();
  const frame = (screenY) =>
    listeners.get("keyboardWillChangeFrame")({ endCoordinates: { screenY } });
  frame(500);
  assert.equal(overlap, 260, "fallback works before native measurement");
  hook.measure();
  assert.equal(overlap, 260); // Screen bottom 844 is NOT the chat container bottom.
  frame(450);
  assert.equal(overlap, 310);
  bottom = 700;
  hook.measure();
  assert.equal(overlap, 250);
  frame(844);
  assert.equal(overlap, 0);
  frame(500);
  listeners.get("keyboardWillHide")({});
  assert.equal(overlap, 0);
  hook.measure();
  assert.equal(
    overlap,
    0,
    "layout after hide must not restore stale keyboard overlap",
  );
  frame(500);
  listeners.get("keyboardDidHide")({ duration: 0 });
  assert.equal(overlap, 0);
  cleanup();
  assert.equal(listeners.size, 0);
});
