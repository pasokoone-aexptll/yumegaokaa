import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";

const source = readFileSync(new URL("../apps/mobile/src/lib/modeDelivery.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { deliverMode } = await import("data:text/javascript," + encodeURIComponent(js));

test("lost response retains the same request for idempotent retry", async () => {
  const original = { request_id: "id", mode_revision: "1", ghost: true };
  let stored = JSON.stringify(original);
  const forget = async () => { stored = null; };
  const calls = [];
  const send = async p => { calls.push(p); if (calls.length === 1) throw Error("network"); };
  await assert.rejects(deliverMode(JSON.parse(stored), send, forget), /network/);
  await deliverMode(JSON.parse(stored), send, forget);
  assert.deepEqual(calls, [original, original]);
  assert.equal(stored, null);
});
test("a rejected old revision is discarded instead of rebasing a privacy change", async () => {
  let discarded = false;
  await assert.rejects(deliverMode({ mode_revision: "2" }, async () => { throw Error("conflict"); },
    async () => { discarded = true; }), /conflict/);
  assert.equal(discarded, true);
});
