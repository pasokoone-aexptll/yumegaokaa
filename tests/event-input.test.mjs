import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpileModule(
  readFileSync("apps/mobile/src/lib/eventInput.ts", "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  },
).outputText;
const exports = {};
new Function("exports", source)(exports);
const check = exports.eventInputError;
const start = "2026-10-30T10:00:00+09:00";
test("dates require a positive duration of at most 24 hours", () => {
  assert.ok(check("", start, "20"));
  assert.ok(check(start, start, "20"));
  assert.ok(check(start, "2026-10-30T00:59:59Z", "20"));
  assert.equal(check(start, "2026-10-31T01:00:00Z", "20"), null);
  assert.ok(check(start, "2026-10-31T01:00:01Z", "20"));
});
test("capacity is a required integer between 1 and 100", () => {
  const end = "2026-10-30T11:00:00+09:00";
  for (const capacity of ["", " ", "0", "101", "1.5", "NaN"])
    assert.ok(check(start, end, capacity), capacity);
  for (const capacity of ["1", "20", "100"])
    assert.equal(check(start, end, capacity), null);
});
