import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = readFileSync(new URL("../apps/mobile/src/lib/observationTime.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { observationTime } = await import("data:text/javascript," + encodeURIComponent(js));
const server = "2026-11-05T00:00:00.000Z";

test("maps a fix from elapsed time onto server UTC, including network uncertainty", () => {
  assert.equal(observationTime(10000, 20000, 21000, server), "2026-11-04T23:59:49.500Z");
  assert.doesNotThrow(() => observationTime(1000, 119500, 120500, server));
  assert.throws(() => observationTime(999, 119500, 120500, server), /stale_observation/);
});
test("rejects missing timestamps, impossible clock order and slow synchronization", () => {
  for (const args of [[undefined,100,110], [0,100,110], [101,100,110], [90,100,99], [90,100,2101]])
    assert.throws(() => observationTime(...args, server), /stale_observation/);
});
