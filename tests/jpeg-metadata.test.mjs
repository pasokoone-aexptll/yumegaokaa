import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const exports = {};
new Function(
  "exports",
  ts.transpileModule(
    readFileSync("apps/mobile/src/lib/jpegMetadata.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(exports);
const strip = (bytes) =>
  new Uint8Array(exports.stripJpegMetadata(Uint8Array.from(bytes).buffer));
test("removes private metadata and keeps ICC/color and compressed pixels intact", () => {
  const input = [
    255, 216, 255, 225, 0, 4, 1, 2, 255, 237, 0, 3, 3, 255, 254, 0, 3, 4, 255,
    226, 0, 3, 5, 255, 218, 0, 2, 9, 8, 255, 217,
  ];
  assert.deepEqual(
    [...strip(input)],
    [255, 216, 255, 226, 0, 3, 5, 255, 218, 0, 2, 9, 8, 255, 217],
  );
});
test("rejects malformed segment lengths instead of publishing partial data", () => {
  for (const bytes of [
    [],
    [0, 1],
    [255, 216, 255, 225, 0, 1],
    [255, 216, 255, 225, 0, 9, 1],
  ])
    assert.throws(() => strip(bytes), /image_conversion_failed/);
});
