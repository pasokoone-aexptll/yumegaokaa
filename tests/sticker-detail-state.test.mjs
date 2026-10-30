import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useStickerDetail.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const initial = {
  id: "draft",
  tag_id: "tag",
  phase: "draft",
  revision: 1,
  title: "test",
};
const tick = () => new Promise((r) => setImmediate(r));
function harness(rpc, touch = async () => ({ v: 1, tag_id: "tag" })) {
  const state = [],
    refs = [],
    routes = [];
  let i = 0,
    j = 0,
    focus;
  const exports = {};
  new Function("require", "exports", source)((id) => {
    if (id === "react")
      return {
        useCallback: (x) => x,
        useRef: (x) => (refs[j++] ??= { current: x }),
        useState: (x) => {
          const n = i++;
          if (!(n in state)) state[n] = x;
          return [
            state[n],
            (v) => (state[n] = typeof v === "function" ? v(state[n]) : v),
          ];
        },
      };
    if (id === "expo-router")
      return {
        useFocusEffect: (fn) => (focus = fn),
        router: { replace: (x) => routes.push(x) },
      };
    if (id.includes("stickers")) return { stickerTouch: touch };
    return { native: { rpc } };
  }, exports);
  const render = () => {
    i = 0;
    j = 0;
    return exports.useStickerDetail("draft");
  };
  return { render, focus: () => focus(), routes };
}
test("NFC failure never advances the draft and retry can proceed", async () => {
  let fail = true,
    writes = 0;
  const h = harness(
    async (op) => {
      if (op === "sticker_get") return initial;
      writes++;
      return { ...initial, phase: "written", revision: 2 };
    },
    async () => {
      if (fail) throw Error("capacity");
      return { v: 1, tag_id: "tag" };
    },
  );
  h.render();
  h.focus();
  await tick();
  await h.render().step();
  assert.equal(writes, 0);
  assert.equal(h.render().draft.phase, "draft");
  assert.ok(h.render().error);
  fail = false;
  await h.render().step();
  assert.equal(writes, 1);
  assert.equal(h.render().draft.phase, "written");
});
test("leaving during a touch prevents a late phase update", async () => {
  let finish,
    writes = 0;
  const h = harness(
    async (op) => {
      if (op === "sticker_get") return initial;
      writes++;
    },
    () => new Promise((r) => (finish = r)),
  );
  h.render();
  const blur = h.focus();
  await tick();
  const work = h.render().step();
  blur();
  finish({ v: 1, tag_id: "tag" });
  await work;
  assert.equal(writes, 0);
  assert.equal(h.render().busy, false);
});
test("double taps share one operation and lost response recovers from server", async () => {
  let finish,
    writes = 0,
    server = initial;
  const h = harness(
    async (op) => {
      if (op === "sticker_get") return server;
      writes++;
      server = { ...initial, phase: "written", revision: 2 };
      throw Error("offline");
    },
    () => new Promise((r) => (finish = r)),
  );
  h.render();
  h.focus();
  await tick();
  const first = h.render().step();
  await h.render().step();
  finish({ v: 1, tag_id: "tag" });
  await first;
  assert.equal(writes, 1);
  assert.equal(h.render().draft.phase, "draft");
  await h.render().load();
  assert.equal(h.render().draft.phase, "written");
  assert.equal(h.render().error, "");
});
test("cancel response after leaving cannot navigate another screen", async () => {
  let finish;
  const h = harness((op) =>
    op === "sticker_get"
      ? Promise.resolve(initial)
      : new Promise((r) => (finish = r)),
  );
  h.render();
  const blur = h.focus();
  await tick();
  const work = h.render().cancel();
  blur();
  finish({});
  await work;
  assert.deepEqual(h.routes, []);
});
