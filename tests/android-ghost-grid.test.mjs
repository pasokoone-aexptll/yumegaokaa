import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";

const source = readFileSync(new URL("../apps/mobile/src/lib/streetGrid.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { projectStreetPoint, insideCell } = await import("data:text/javascript," + encodeURIComponent(outputText));

test("Android uses the iOS projection vectors for publication", () => {
  const vectors = JSON.parse(readFileSync(new URL("./native/vectors.json", import.meta.url)));
  for (const { lon, lat, expected } of vectors) {
    projectStreetPoint(lon, lat).forEach((v, i) => assert.ok(Math.abs(v - expected[i]) <= 0.01));
  }
});

test("only an accurate inside fix can supply a public cell", () => {
  const area = [[[-400,-400],[400,-400],[400,400],[-400,400]], [[0,0],[100,0],[100,100],[0,100]]];
  assert.equal(insideCell([-115,170], area, 50), "-2:1");
  for (const [p, a] of [[[395,100],5], [[40,40],2], [[-4,20],5], [[490,40],2], [[-115,170],51]])
    assert.equal(insideCell(p, area, a), undefined);
});
