import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
function module(file, require) {
  const e = {};
  new Function(
    "require",
    "exports",
    ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  )(require, e);
  return e;
}
test("電信PINの地図往復は本文・募集設定・編集revisionを維持し、取消時は位置を確定しない", () => {
  let current;
  const drafts = module("apps/mobile/src/lib/denshinDraft.ts", () => ({
    useState: () => {},
    useEffect: () => {},
  }));
  let legacyWrites = 0;
  const placement = module("apps/mobile/src/lib/pinPlacement.ts", (id) =>
    id === "react"
      ? { useSyncExternalStore: (_, get) => get() }
      : id.includes("denshinDraft")
        ? {
            updateDenshinDraft: (p) => {
              current = { ...current, ...p };
              drafts.updateDenshinDraft(p);
            },
          }
        : id.includes("eventEditDraft")
          ? {
              setEventEditLocation: () => {
                throw Error("wrong draft");
              },
            }
          : { updateDraft: () => legacyWrites++ },
  );
  current = {
    id: "p",
    revision: 8,
    body: "明日います",
    recruiting: false,
    limited: true,
    capacity: 12,
    location: [139, 35],
  };
  drafts.updateDenshinDraft(current);
  placement.beginDenshinPlacement(current.location);
  placement.placePin([139.1, 35.1]);
  placement.cancelPinPlacement();
  assert.deepEqual(current.location, [139, 35]);
  assert.equal(placement.finishPinPlacement(), undefined);
  placement.beginDenshinPlacement(current.location);
  placement.placePin([139.2, 35.2]);
  assert.deepEqual(placement.finishPinPlacement(), { kind: "denshin" });
  assert.deepEqual(current, {
    id: "p",
    revision: 8,
    body: "明日います",
    recruiting: false,
    limited: true,
    capacity: 12,
    location: [139.2, 35.2],
  });
  assert.equal(legacyWrites, 0);
});
function editorHarness({
  saved = null,
  submit = async () => ({ id: "pin" }),
  cancel = async () => null,
} = {}) {
  let draft = {
      body: "本文",
      recruiting: false,
      limited: false,
      capacity: 12,
      location: [139, 35],
    },
    idx = 0,
    first = true,
    revision = 1,
    cleared = 0;
  const slots = [],
    effects = [],
    routes = [],
    sent = [];
  const e = module("apps/mobile/src/hooks/useDenshinEditor.ts", (id) => {
    if (id === "react")
      return {
        useState: (x) => {
          const n = idx++;
          if (!(n in slots)) slots[n] = x;
          return [
            slots[n],
            (x) => {
              slots[n] = x;
            },
          ];
        },
        useRef: (x) => {
          const n = idx++;
          if (!(n in slots)) slots[n] = { current: x };
          return slots[n];
        },
        useEffect: (f) => {
          if (first) effects.push(f);
        },
      };
    if (id === "expo-router")
      return { useRouter: () => ({ replace: (r) => routes.push(r), dismissTo: (r) => routes.push(r) }) };
    if (id.includes("denshinDraft"))
      return {
        useDenshinDraft: () => draft,
        updateDenshinDraft: (p) => {
          draft = { ...draft, ...p };
        },
        clearDenshinDraft: () => cleared++,
      };
    if (id.includes("commands"))
      return {
        pendingCommand: async (k) => (saved?.kind === k ? saved : null),
        submitCommand: async (k, b) => {
          sent.push({ kind: k, body: b });
          return submit(k, b);
        },
        cancelPendingCommand: cancel,
      };
    if (id.includes("sessionState"))
      return { sessionState: { get: () => ({ revision }) } };
    if (id.includes("streetChanges")) return { streetChanges: { notify() {} } };
    if (id.includes("denshin")) return { denshinError: String };
    return { streetID: "street" };
  });
  function render() {
    idx = 0;
    const h = e.useDenshinEditor();
    first = false;
    return h;
  }
  const ready = async () => {
    render();
    effects.forEach((f) => f());
    await new Promise((r) => setImmediate(r));
    return render();
  };
  return {
    ready,
    render,
    sent,
    routes,
    cleared: () => cleared,
    session: () => revision++,
    edit: (p) => {
      draft = { ...draft, ...p };
    },
  };
}
test("未確定作成を復元して同じ本文・位置・募集設定で再送する", async () => {
  const body = {
    street_id: "street",
    body: "保存済み",
    longitude: 139.1,
    latitude: 35.1,
    recruiting: true,
    capacity: 12,
    confirm_close: false,
  };
  const h = editorHarness({
    saved: { kind: "denshin_create", id: "receipt", body },
  });
  const hook = await h.ready();
  assert.equal(hook.locked, true);
  assert.equal(hook.draft.body, body.body);
  await hook.save();
  assert.deepEqual(h.sent, [{ kind: "denshin_create", body }]);
  assert.equal(h.cleared(), 1);
  assert.equal(h.routes[0].params.id, "pin");
});
test("二重保存を止め、送信中にアカウントが変わったら新セッションの下書き/画面を変更しない", async () => {
  let resolve;
  const h = editorHarness({
    submit: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  const hook = await h.ready();
  const sending = hook.save();
  await hook.save();
  assert.equal(h.sent.length, 1);
  h.session();
  resolve({ id: "old-account-pin" });
  await sending;
  assert.equal(h.cleared(), 0);
  assert.equal(h.routes.length, 0);
});
test("送信結果の取消確認が失敗したら本文を残し、保存済みなら既存PINを開く", async () => {
  const saved = {
    kind: "denshin_edit",
    body: {
      id: "existing",
      revision: 7,
      body: "保持",
      recruiting: false,
      capacity: null,
      longitude: 139,
      latitude: 35,
    },
  };
  const offline = editorHarness({
    saved,
    cancel: async () => {
      throw Error("offline");
    },
  });
  const hook = await offline.ready();
  await hook.revise();
  assert.equal(offline.cleared(), 0);
  assert.equal(offline.render().locked, true);
  const complete = editorHarness({
    saved,
    cancel: async () => ({ id: "existing" }),
  });
  await (await complete.ready()).revise();
  assert.equal(complete.routes[0].params.id, "existing");
});

test("主催者の旧到着フラグが残っていても現地列には参加者だけ表示する", () => {
  const { onsitePeople, pinCount } = module("apps/mobile/src/lib/denshin.ts", () => ({}));
  const pin = { author_id: "host", host_arrived: true, count: 2, capacity: 10,
    people: [{ account_id: "host", state: "arrived" },
      { account_id: "guest", state: "arrived" }, { account_id: "planned", state: "planned" }] };
  assert.deepEqual(onsitePeople(pin).map(p => p.account_id), ["guest"]);
  assert.equal(pinCount(pin), "2/10人");
  assert.deepEqual(onsitePeople({ ...pin, people: [] }), []);
});

test("編集画面の削除は元PINのrevisionで送信し、成功後にMapへ戻る", async () => {
  const h = editorHarness();
  await h.ready();
  h.edit({ id: "existing", original: { revision: 7 } });
  await h.render().remove();
  assert.deepEqual(h.sent, [{ kind: "denshin_delete", body: { id: "existing", revision: 7 } }]);
  assert.equal(h.cleared(), 1);
  assert.deepEqual(h.routes, ["/(tabs)"]);
});
