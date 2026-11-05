import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";

test("after restart an uncertain Android exit retries only the original visit", async () => {
  const source = readFileSync(new URL("../apps/mobile/src/lib/platformAuth.android.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const data = new Map();
  const storage = {
    getItemAsync: async k => data.get(k) ?? null,
    setItemAsync: async (k, v) => data.set(k, v),
    deleteItemAsync: async k => data.delete(k),
  };
  const sent = [];
  let offline = true;
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: "user" } } }, error: null }) },
    async rpc(_, { operation, payload }) {
      if (operation === "end_visit") sent.push(payload.visit_id);
      if (offline) throw Error("network");
      return { data: { visit: { visit_id: "new-visit", state: "active", can_update: true } }, error: null };
    },
  };
  async function boot() {
    const exports = {};
    new Function("exports", "require", outputText)(exports, name => ({
      "./visitObservation.android": { stopObservation: async () => {}, watchVisit: async () => false },
      "@supabase/supabase-js": { createClient: () => client },
      "expo-secure-store": storage,
      "expo-modules-core": { requireNativeModule: () => ({}) },
    })[name] ?? {});
    await exports.platformAuth.configure("https://example.test", "test");
    return exports.platformAuth;
  }
  const first = await boot();
  await assert.rejects(first.stop("original-visit"), /network/);
  const restarted = await boot();
  assert.equal((await restarted.resume()).pending_exit, true);
  offline = false;
  assert.equal((await restarted.resume()).visit.visit_id, "new-visit");
  assert.deepEqual(sent, ["original-visit", "original-visit", "original-visit"]);
  assert.equal([...data.keys()].some(k => k.endsWith(".exit")), false);
});
