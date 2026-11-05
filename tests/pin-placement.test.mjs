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

test('event edit Map round trip preserves input and revision without touching creation draft', () => {
  function load(file, require) {
    const exports = {};
    new Function('require','exports',ts.transpileModule(readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(require,exports);
    return exports;
  }
  const handoff=load('apps/mobile/src/lib/eventEditDraft.ts',()=>{});
  let creationWrites=0;
  const placement=load('apps/mobile/src/lib/pinPlacement.ts',id => id==='react' ? {useSyncExternalStore:(_,get)=>get()} : id.includes('eventEditDraft') ? handoff : {updateDraft:()=>creationWrites++});
  const draft={id:'event-1',event:{id:'event-1',revision:7},title:'edited title',description:'unsaved',start:'start',end:'end',capacity:'42',point:[139,35],ongoing:false};
  handoff.preserveEventEdit(draft);
  placement.beginPinPlacement(draft.point,draft.id);
  placement.placePin([139.1,35.1]);
  assert.deepEqual(handoff.readEventEdit(draft.id).point,[139,35]);
  assert.deepEqual(placement.finishPinPlacement(),{kind:'edit',id:draft.id});
  assert.deepEqual(handoff.takeEventEdit(draft.id),{...draft,point:[139.1,35.1]});
  assert.equal(handoff.takeEventEdit(draft.id),undefined);
  assert.equal(creationWrites,0);
  handoff.preserveEventEdit(draft);
  placement.beginPinPlacement(draft.point,draft.id);
  handoff.clearEventEdit();
  assert.equal(placement.finishPinPlacement(),undefined);
  assert.equal(creationWrites,0);
});
