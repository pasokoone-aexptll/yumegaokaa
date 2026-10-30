import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useHomePins.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
test("Home expires saved cards using monotonic server time even after network failure", async () => {
  const state = [],
    timers = new Map();
  let index = 0,
    focus,
    mono = 100,
    offline = true;
  const exports = {};
  new Function("require", "exports", "setInterval", "clearInterval", source)(
    (id) => {
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
      if (id === "react-native")
        return {
          AppState: {
            currentState: "active",
            addEventListener: () => ({ remove() {} }),
          },
        };
      if (id === "expo-router")
        return {
          useFocusEffect(fn) {
            focus = fn;
          },
        };
      if (id.includes("localBlocks"))
        return {
          localBlocks: { hidden: () => false, subscribe: () => () => {} },
        };
      if (id.includes("streetChanges"))
        return { streetChanges: { subscribe: () => () => {} } };
      return {
        streetID: "street",
        displayClock: async () => {
          if (offline) throw Error("offline");
          return { server: 1000, local: 100 };
        },
        native: {
          monotonicTime: () => mono,
          rpc: async (op) => ({
            items:
              op === "event_list"
                ? [{ id: "event", ends_at: new Date(3000).toISOString() }]
                : [{ id: "pin", expires_at: new Date(2000).toISOString() }],
          }),
        },
      };
    },
    exports,
    (fn, ms) => {
      timers.set(ms, fn);
      return ms;
    },
    (id) => timers.delete(id),
  );
  const hook = exports.useHomePins();
  const blur = focus();
  await new Promise((r) => setImmediate(r));
  assert.equal(state[0].length, 0);
  assert.equal(state[1].length, 0);
  assert.ok(state[2]);
  assert.equal(state[3], false);
  offline = false;
  await hook.load();
  assert.equal(state[2], "");
  assert.equal(state[0].length, 1);
  assert.equal(state[1].length, 1);
  offline = true;
  await hook.load();
  assert.ok(state[2]);
  mono = 1100;
  timers.get(1000)();
  assert.equal(state[1].length, 0);
  assert.equal(state[0].length, 1);
  mono = 2100;
  timers.get(1000)();
  assert.equal(state[0].length, 0);
  offline = false;
  await hook.load();
  assert.equal(state[0].length, 0);
  assert.equal(state[1].length, 0);
  blur();
  assert.equal(timers.size, 0);
});
