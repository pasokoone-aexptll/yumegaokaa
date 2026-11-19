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

test("checked-in header keeps all live visits and expires independently of observations", () => {
  const now = Date.parse("2026-11-20T00:00:00Z");
  const groups = [
    { expires_at: "2026-11-20T00:01:00Z", icons: ["pool-a", null] },
    { expires_at: "2026-11-20T00:00:00Z", icons: ["expired"] },
    { expires_at: "2026-11-20T02:00:00Z", icons: ["pool-b"] },
  ];
  assert.deepEqual(exports.liveHeaderIcons(groups, now), ["pool-a", null, "pool-b"]);
  assert.deepEqual(exports.liveHeaderIcons(undefined, now), []);
  assert.deepEqual(exports.liveHeaderIcons(groups, now + 3 * 3600000), []);
});
