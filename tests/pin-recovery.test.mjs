import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
test("restore uncertain event and resend the identical body after a restart", async () => {
  const original = {
    street_id: "street",
    title: "event",
    description: "description",
    starts_at: new Date(Date.now() + 3600000).toISOString(),
    ends_at: new Date(Date.now() + 7200000).toISOString(),
    longitude: 139,
    latitude: 35,
    capacity: 20,
  };
  let draft = {
    kind: "recruitment",
    title: "",
    description: "",
    starts: "",
    ends: "",
    capacity: "20",
  };
  let index = 0,
    first = true;
  const slots = [],
    effects = [],
    sent = [],
    routes = [];
  const react = {
    useState: (initial) => {
      const i = index++;
      if (!(i in slots)) slots[i] = initial;
      return [
        slots[i],
        (value) => {
          slots[i] = value;
        },
      ];
    },
    useEffect: (callback) => {
      if (first) effects.push(callback);
    },
  };
  const commands = {
    pendingCommand: async (kind) =>
      kind === "event_create" ? { id: "receipt", body: original } : null,
    submitCommand: async (kind, body) => {
      sent.push({ kind, body });
      return { id: "created" };
    },
    cancelPendingCommand: async () => null,
  };
  const exports = {};
  new Function(
    "require",
    "exports",
    ts.transpileModule(
      readFileSync("apps/mobile/src/hooks/usePinCreation.ts", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
  )((id) => {
    if (id.includes("eventInput")) {
      const e = {};
      new Function(
        "exports",
        ts.transpileModule(
          readFileSync("apps/mobile/src/lib/eventInput.ts", "utf8"),
          { compilerOptions: { module: ts.ModuleKind.CommonJS } },
        ).outputText,
      )(e);
      return e;
    }
    if (id === "react") return react;
    if (id === "expo-router")
      return { router: { replace: (r) => routes.push(r) } };
    if (id.includes("pinDraft"))
      return {
        usePinDraft: () => draft,
        updateDraft: (p) => {
          draft = { ...draft, ...p };
        },
        clearDraft: () => {},
      };
    if (id.includes("commands")) return commands;
    return { native: {}, streetID: "street" };
  }, exports);
  const render = () => {
    index = 0;
    return exports.usePinCreation();
  };
  render();
  first = false;
  effects.forEach((effect) => effect());
  await new Promise((resolve) => setImmediate(resolve));
  const recovered = render();
  assert.equal(recovered.draft.kind, "event");
  assert.deepEqual(recovered.draft.location, [139, 35]);
  assert.equal(recovered.locked, true);
  await recovered.publish();
  assert.deepEqual(sent, [{ kind: "event_create", body: original }]);
  assert.equal(routes[0].params.id, "created");
});

for (const scenario of ["empty", "completed", "offline"]) {
  test(`discard ${scenario}: reconcile before clearing the draft`, async () => {
    let index = 0,
      first = true,
      cleared = false;
    const slots = [],
      effects = [],
      routes = [];
    const exports = {};
    new Function(
      "require",
      "exports",
      ts.transpileModule(
        readFileSync("apps/mobile/src/hooks/usePinCreation.ts", "utf8"),
        { compilerOptions: { module: ts.ModuleKind.CommonJS } },
      ).outputText,
    )((id) => {
      if (id === "react")
        return {
          useState: (initial) => {
            const i = index++;
            if (!(i in slots)) slots[i] = initial;
            return [
              slots[i],
              (v) => {
                slots[i] = v;
              },
            ];
          },
          useEffect: (f) => {
            if (first) effects.push(f);
          },
        };
      if (id === "expo-router")
        return {
          router: {
            back: () => routes.push("back"),
            replace: (r) => routes.push(r),
          },
        };
      if (id.includes("pinDraft"))
        return {
          usePinDraft: () => ({ kind: "event", title: "draft" }),
          clearDraft: () => {
            cleared = true;
          },
          updateDraft: () => {},
        };
      if (id.includes("commands"))
        return {
          pendingCommand: async () => null,
          cancelPendingCommand: async () => {
            if (scenario === "offline") throw Error("offline");
            return scenario === "completed" ? { id: "existing" } : null;
          },
        };
      return {};
    }, exports);
    const render = () => {
      index = 0;
      return exports.usePinCreation();
    };
    render();
    first = false;
    effects.forEach((f) => f());
    await new Promise((r) => setImmediate(r));
    await render().discard();
    assert.equal(cleared, scenario !== "offline");
    if (scenario === "offline") {
      assert.equal(routes.length, 0);
      assert.match(render().error, /下書きを保持/);
    } else if (scenario === "completed")
      assert.equal(routes[0].params.id, "existing");
    else assert.deepEqual(routes, ["back"]);
  });
}
