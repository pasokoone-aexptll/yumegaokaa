import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const source = ts.transpile(
  readFileSync("apps/mobile/src/lib/presence.ts", "utf8"),
  { module: ts.ModuleKind.ESNext },
);
const { splitCount, liveCells } = await import(
  "data:text/javascript;base64," + Buffer.from(source).toString("base64")
);
test("T08 画面の分割は同じ地点の合計を保存", () => {
  for (const [n, expected] of [
    [6, [6]],
    [7, [5, 2]],
    [8, [5, 3]],
    [11, [5, 6]],
    [12, [5, 5, 2]],
  ])
    assert.deepEqual(splitCount(n), expected);
});
test("T07 個々の失効時刻で2→1→0、他人の更新で延命なし", () => {
  const now = Date.now(),
    s = {
      cells: [
        {
          expiry_groups: [
            { expires_at: new Date(now + 1000).toISOString(), count: 1 },
            { expires_at: new Date(now + 10000).toISOString(), count: 1 },
          ],
        },
      ],
    };
  assert.equal(liveCells(s, now)[0].count, 2);
  assert.equal(liveCells(s, now + 1000)[0].count, 1);
  assert.deepEqual(liveCells(s, now + 10000), []);
});
test("T07 再取得と分割でも他人のアイコンの透明度を戻さない", () => {
  const now = Date.now();
  const s = {
    cells: [
      {
        expiry_groups: [
          { expires_at: new Date(now + 60000).toISOString(), count: 5 },
          { expires_at: new Date(now + 600000).toISOString(), count: 2 },
        ],
      },
    ],
  };
  const first = liveCells(s, now)[0];
  assert.deepEqual(
    first.clusters.map((c) => c.count),
    [5, 2],
  );
  assert.deepEqual(first.clusters[0].opacities, [0.1, 0.1, 0.1, 0.1, 0.1]);
  assert.deepEqual(first.clusters[1].opacities, [1, 1]);
  assert.equal(liveCells(s, now + 60000)[0].count, 2);
  assert.deepEqual(liveCells(s, now + 600000), []);
});
