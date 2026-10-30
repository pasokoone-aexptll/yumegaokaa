import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useStreetMap.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
function harness(checkin) {
  const slots = [];
  let index = 0,
    calls = 0;
  const native = {
    checkin: async () => {
      calls++;
      return checkin();
    },
    stop: async () => ({
      visit: {},
      pending_exit: true,
      status: "退出を再送します",
      observing: false,
    }),
    monotonicTime: () => 0,
    rpc: async (op) =>
      op === "get_street_config"
        ? { name: "街" }
        : { items: [], checked_in_count: 0 },
  };
  const exp = {};
  new Function("require", "exports", source)((id) => {
    if (id === "react")
      return {
        useState: (v) => {
          const i = index++;
          if (!(i in slots)) slots[i] = v;
          return [
            slots[i],
            (v) => (slots[i] = typeof v === "function" ? v(slots[i]) : v),
          ];
        },
        useRef: (v) => {
          const i = index++;
          if (!(i in slots)) slots[i] = { current: v };
          return slots[i];
        },
        useCallback: (v) => v,
        useEffect() {},
      };
    if (id.includes("development"))
      return { localEntry: true, nfcDisabled: true };
    if (id.includes("nfc-manager"))
      return {
        __esModule: true,
        default: { cancelTechnologyRequest: async () => {} },
        Ndef: {},
      };
    if (id.includes("/native"))
      return {
        native,
        url: "local",
        key: "key",
        streetID: "street",
        displayClock: async () => ({ server: 0, local: 0 }),
      };
    if (id.includes("localBlocks"))
      return { localBlocks: { hidden: () => false } };
    return {};
  }, exp);
  return {
    render() {
      index = 0;
      return exp.useStreetMap();
    },
    get calls() {
      return calls;
    },
  };
}
const active = {
  visit: { state: "active", can_update: true },
  pending_exit: false,
  observing: true,
  status: "気配を観測中",
};
test("entry succeeds only after confirmed native result; cancellation ignores delayed success and duplicate start", async () => {
  let resolve;
  const h = harness(() => new Promise((r) => (resolve = r)));
  const first = h.render().scan();
  assert.equal(h.render().sheet, "checking");
  await h.render().exit();
  assert.equal(h.render().sheet, null);
  assert.equal(h.render().state.pending_exit, true);
  const duplicate = h.render().scan();
  assert.equal(h.calls, 1);
  resolve(active);
  await first;
  await duplicate;
  assert.equal(h.render().sheet, null);
  assert.equal(h.render().active, false);
});
test("permission and writer rejection never show success and explain how to recover", async () => {
  for (const [code, text] of [
    ["location_permission_required", "位置情報を許可"],
    ["wrong_writer", "別の端末"],
    ["network_error", "確認できません"],
  ]) {
    const h = harness(async () => {
      throw Error(code);
    });
    await h.render().scan();
    assert.equal(h.render().sheet, null);
    assert.match(h.render().error, new RegExp(text));
    assert.equal(h.render().active, false);
  }
});
test("successful entry exposes success and active state", async () => {
  const h = harness(async () => active);
  await h.render().scan();
  assert.equal(h.render().sheet, "success");
  assert.equal(h.render().active, true);
});
