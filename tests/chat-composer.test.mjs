import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useChatComposer.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function harness(commands) {
  const slots = [];
  let index = 0,
    sent = 0;
  const exports = {};
  new Function("require", "exports", source)((id) => {
    if (id === "react")
      return {
        useState(v) {
          const i = index++;
          if (!(i in slots)) slots[i] = v;
          return [
            slots[i],
            (x) => {
              slots[i] = typeof x === "function" ? x(slots[i]) : x;
            },
          ];
        },
        useRef(v) {
          const i = index++;
          if (!(i in slots)) slots[i] = { current: v };
          return slots[i];
        },
        useCallback: (v) => v,
        useEffect() {},
      };
    if (id.includes("commands")) return commands;
    return { streetID: "street" };
  }, exports);
  return {
    render() {
      index = 0;
      return exports.useChatComposer(() => sent++, false);
    },
    sent: () => sent,
  };
}
test("restart restores the exact uncertain message and successful confirmation clears it", async () => {
  const calls = [];
  const h = harness({
    pendingCommand: async () => ({ body: { body: "saved message" } }),
    submitCommand: async (kind, body) => {
      calls.push({ kind, body });
      return { id: "m1" };
    },
  });
  await h.render().restore();
  assert.equal(h.render().text, "saved message");
  assert.equal(h.render().pending, true);
  await h.render().send();
  assert.deepEqual(calls, [
    { kind: "chat_send", body: { street_id: "street", body: "saved message" } },
  ]);
  assert.equal(h.render().text, "");
  assert.equal(h.render().pending, false);
  assert.equal(h.sent(), 1);
});
test("canceling an uncertain operation preserves editable input only when it was not committed", async () => {
  for (const completed of [null, { id: "m1" }]) {
    const h = harness({
      pendingCommand: async () => ({ body: { body: "draft" } }),
      cancelPendingCommand: async () => completed,
    });
    await h.render().restore();
    await h.render().revise();
    assert.equal(h.render().pending, false);
    assert.equal(h.render().text, completed ? "" : "draft");
    assert.equal(h.sent(), completed ? 1 : 0);
  }
});
test("unreadable pending storage blocks new submissions until recovery", async () => {
  let submissions = 0;
  const h = harness({
    pendingCommand: async () => {
      throw Error("storage");
    },
    submitCommand: async () => {
      submissions++;
    },
  });
  await h.render().restore();
  h.render().setText("new text");
  await h.render().send();
  assert.equal(h.render().restoreFailed, true);
  assert.equal(submissions, 0);
});

test("local echo remains pending until acknowledgement and reconciles by server id, not body", async () => {
  let finish;
  const h = harness({
    pendingCommand: async () => null,
    submitCommand: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  await h.render().restore();
  h.render().setText("hello");
  const sending = h.render().send();
  assert.equal(h.render().pendingText, "hello");
  assert.equal(h.render().busy, true);
  assert.deepEqual(h.render().confirmedEchoes, []);
  finish({ id: "server-1" });
  await sending;
  assert.equal(h.render().pendingText, null);
  assert.equal(h.render().busy, false);
  assert.deepEqual(h.render().confirmedEchoes, [
    { id: "server-1", body: "hello" },
  ]);
  h.render().reconcileEchoes(["another-id"]);
  assert.equal(h.render().confirmedEchoes.length, 1);
  h.render().reconcileEchoes(["server-1"]);
  assert.deepEqual(h.render().confirmedEchoes, []);
});
test("response loss keeps the echo unconfirmed and retry acknowledges exactly once", async () => {
  let attempt = 0;
  const h = harness({
    pendingCommand: async () => null,
    submitCommand: async () => {
      if (!attempt++) throw Error("lost");
      return { id: "same-id" };
    },
  });
  await h.render().restore();
  h.render().setText("uncertain");
  await h.render().send();
  assert.equal(h.render().pendingText, "uncertain");
  assert.deepEqual(h.render().confirmedEchoes, []);
  assert.equal(h.sent(), 0);
  await h.render().send();
  assert.equal(h.render().confirmedEchoes.length, 1);
  assert.equal(h.render().pendingText, null);
  assert.equal(h.sent(), 1);
});
