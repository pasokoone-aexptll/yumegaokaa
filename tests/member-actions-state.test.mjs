import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useMemberActions.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
function harness(rpc, onSaved = async () => {}) {
  const slots = [];
  let cursor = 0;
  const exports = {};
  new Function("require", "exports", source)((id) => {
    if (id === "react")
      return {
        useState(v) {
          const n = cursor++;
          if (!(n in slots)) slots[n] = v;
          return [
            slots[n],
            (v) => {
              slots[n] = v;
            },
          ];
        },
        useRef(v) {
          const n = cursor++;
          return slots[n] ?? (slots[n] = { current: v });
        },
      };
    if (id === "../lib/native") return { native: { rpc } };
    throw Error(id);
  }, exports);
  return () => {
    cursor = 0;
    return exports.useMemberActions(
      {
        account_id: "member",
        active: true,
        weekly_limit: 5,
        invite_paused: false,
      },
      onSaved,
    );
  };
}
test("replacement UI uses actions without duplicate writes; failed reload does not escape", async () => {
  let calls = 0,
    release;
  const render = harness(
    async () => {
      calls++;
      await new Promise((r) => {
        release = r;
      });
    },
    async () => {
      throw Error("offline");
    },
  );
  render().setReason("reason");
  const first = render().toggleActive();
  await render().toggleActive();
  assert.equal(calls, 1);
  assert.equal(render().busy, true);
  release();
  await first;
  assert.equal(render().busy, false);
  assert.ok(render().error);
});
test("invalid restriction time/invite amount never reaches API; valid action preserves target and reason", async () => {
  const calls = [];
  const render = harness(async (op, p) => calls.push([op, p]));
  render().setReason("reason");
  render().setUntil("invalid");
  await render().restrict();
  render().setLimit("-1");
  await render().saveLimit();
  assert.equal(calls.length, 0);
  render().setLimit("8");
  await render().saveLimit();
  assert.deepEqual(calls, [
    [
      "operator_invite_policy",
      {
        account_id: "member",
        reason: "reason",
        weekly_limit: 8,
        paused: false,
      },
    ],
  ]);
});
