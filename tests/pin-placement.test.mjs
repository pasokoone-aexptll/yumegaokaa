import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
test("placement preserves form fields and commits only the final dragged coordinate", () => {
  const draft = { title: "event", starts: "start", capacity: "20" };
  const e = {};
  new Function(
    "require",
    "exports",
    ts.transpileModule(
      readFileSync("apps/mobile/src/lib/pinPlacement.ts", "utf8"),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
  )(
    (id) =>
      id === "react"
        ? { useSyncExternalStore: (_, get) => get() }
        : { updateDraft: (p) => Object.assign(draft, p) },
    e,
  );
  e.beginPinPlacement();
  e.finishPinPlacement();
  assert.equal(e.usePinPlacement().active, true);
  e.placePin([139, 35]);
  e.placePin([139.1, 35.1]);
  assert.equal(draft.location, undefined);
  e.finishPinPlacement();
  assert.deepEqual(draft, {
    title: "event",
    starts: "start",
    capacity: "20",
    location: [139.1, 35.1],
  });
  assert.equal(e.usePinPlacement().active, false);
  e.beginPinPlacement(draft.location);
  assert.deepEqual(e.usePinPlacement().point, [139.1, 35.1]);
});
