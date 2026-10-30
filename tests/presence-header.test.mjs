import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const exports = {};
new Function(
  "exports",
  ts.transpileModule(
    readFileSync("apps/mobile/src/lib/presenceHeader.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(exports);
const count = exports.visiblePresenceIcons;
test("header follows available width and reserves overflow text without a seven-icon cap", () => {
  assert.equal(count(20, 300, 30), 7);
  assert.equal(count(20, 220, 30), 5);
  assert.equal(count(20, 600, 30), 15);
  assert.equal(count(8, 300, 50), 8);
  assert.equal(count(20, 300, 70), 6);
  assert.equal(count(20, 0, 30), 0);
  for (const width of [80, 180, 300, 600]) {
    const n = count(50, width, 45);
    assert.ok(n * 38 + 45 <= width);
    assert.equal(n + (50 - n), 50);
  }
});
