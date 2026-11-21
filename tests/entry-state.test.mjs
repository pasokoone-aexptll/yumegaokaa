import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useStreetMap.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const retryExports = {};
new Function(
  "exports",
  ts.transpileModule(readFileSync("apps/mobile/src/lib/readRetry.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(retryExports);
function harness(checkin, stop, simulator = false, fieldTrial = false) {
  const slots = [];
  let index = 0,
    calls = 0;
  const native = {
    isSimulator: () => simulator,
    checkin: async (tagId) => {
      calls++;
      return checkin(tagId);
    },
    stop:
      stop ??
      (async () => ({
        visit: {},
        pending_exit: true,
        status: "退出を再送します",
        observing: false,
      })),
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
    if (id.includes("readRetry")) return retryExports;
    if (id.includes("development"))
      return { localEntry: !fieldTrial, nfcDisabled: !fieldTrial, fieldTrial };
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
    assert.equal(h.render().sheet, "explain");
    assert.match(h.render().entryError, new RegExp(text));
    await h.render().scan(); // the same sheet accepts a retry after rejection
    assert.equal(h.calls, 2);
    assert.match(h.render().entryError, new RegExp(text));
    assert.equal(h.render().active, false);
  }
});
test("successful entry exposes success and active state", async () => {
  const h = harness(async () => active);
  await h.render().scan();
  assert.equal(h.render().sheet, "success");
  assert.equal(h.render().active, true);
});

test("OFF immediately stays off while exit is pending and when transport fails", async () => {
  let reject;
  const h = harness(
    async () => active,
    () =>
      new Promise((_, r) => {
        reject = r;
      }),
  );
  await h.render().scan();
  assert.equal(h.render().active, true);
  const exiting = h.render().exit();
  assert.equal(h.render().active, false);
  assert.equal(h.render().state.pending_exit, true);
  assert.equal(h.render().state.observing, false);
  reject(Error("network_error"));
  await exiting;
  assert.equal(h.render().active, false);
  assert.match(h.render().error, /通信回復後/);
});

test("Simulator NFC wait neither attempts checkin nor displays a connection error", async () => {
  const h = harness(async () => active, undefined, true);
  await h.render().scan("tag");
  assert.equal(h.render().sheet, "explain");
  assert.equal(h.render().entryError, "");
  assert.equal(h.render().active, false);
  assert.equal(h.calls, 0);
});

test("Simulator ring uses the account-bound trial tag and waits for server acceptance", async () => {
  let resolve;
  const h = harness(
    (tagId) => {
      assert.equal(tagId, "14fdc906-3ff4-4576-a212-35c42642dd49");
      return new Promise((r) => (resolve = r));
    },
    undefined,
    true,
    true,
  );
  await h.render().scan("tag");
  assert.equal(h.calls, 0);
  const entering = h.render().scan("default");
  assert.equal(h.render().sheet, "checking");
  assert.equal(h.render().active, false);
  await h.render().scan("default");
  assert.equal(h.calls, 1);
  resolve(active);
  await entering;
  assert.equal(h.render().sheet, "success");
  assert.equal(h.render().active, true);
});

test("Simulator ring preserves the trial grant check instead of fabricating success", async () => {
  const h = harness(
    async () => {
      throw Error("inactive_tag");
    },
    undefined,
    true,
    true,
  );
  await h.render().scan("default");
  assert.equal(h.render().active, false);
  assert.equal(h.render().sheet, "explain");
  assert.match(h.render().entryError, /入街許可がありません/);
});

test("Physical field trial checks in through server without an NFC reader", async () => {
  const h = harness(
    async (tag) => {
      assert.equal(tag, "14fdc906-3ff4-4576-a212-35c42642dd49");
      return active;
    },
    undefined,
    false,
    true,
  );
  await h.render().scan("default");
  assert.equal(h.calls, 1);
  assert.equal(h.render().active, true);
  assert.equal(h.render().sheet, "success");
});
