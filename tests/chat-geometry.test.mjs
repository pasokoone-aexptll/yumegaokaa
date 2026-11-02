import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const exports = {};
new Function(
  "exports",
  ts.transpileModule(
    readFileSync("apps/mobile/src/lib/chatGeometry.ts", "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText,
)(exports);
const { chatGeometry } = exports;

test("keyboard opening does not move the latest row backwards in content coordinates", () => {
  const before = chatGeometry(844, 700, 66, 0);
  for (const keyboard of [260, 340, 490]) {
    const after = chatGeometry(844, 700, 66, keyboard);
    assert.equal(after.viewport, before.viewport);
    assert.equal(after.topPadding, before.topPadding);
    // Content height and viewport are unchanged, so scrollToEnd and the visible
    // bottom row retain the same offset. Only the screen translation changes.
    const contentHeight = 1800 + before.topPadding;
    assert.equal(
      contentHeight - after.viewport,
      contentHeight - before.viewport,
    );
    assert.ok(after.expanded <= 700 - keyboard);
    assert.ok(after.collapsed <= after.expanded);
  }
});

test("rotation and a changed notice height still recompute the actual scroll geometry", () => {
  const portrait = chatGeometry(844, 700, 66, 0);
  const landscape = chatGeometry(390, 300, 66, 0);
  assert.ok(landscape.viewport < portrait.viewport);
  assert.equal(chatGeometry(844, 700, 100, 0).viewport, portrait.viewport - 34);
  assert.ok(chatGeometry(300, 100, 120, 0).viewport >= 0);
});
