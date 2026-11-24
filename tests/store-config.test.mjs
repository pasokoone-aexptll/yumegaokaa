import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";

const source = ts.transpileModule(
  readFileSync("apps/mobile/app.config.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const valid = {
  YUMEGAOKA_STORE_BUILD: "1",
  EXPO_PUBLIC_REGISTRATION_DECLARATION: "1",
  YUMEGAOKA_STORE_API_ORIGIN: "https://example.supabase.co",
  EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  EXPO_PUBLIC_STREET_ID: "11111111-1111-4111-8111-111111111111",
  YUMEGAOKA_APNS_ENVIRONMENT: "production",
  APPLE_TEAM_ID: "ABCDEFGHIJ",
};
function config(env) {
  const exports = {};
  new Function("exports", "process", source)(exports, { env });
  return exports.default({
    config: {
      plugins: ["react-native-nfc-manager"],
      ios: {
        infoPlist: {
          NSLocalNetworkUsageDescription: "development only",
          NSAppTransportSecurity: { NSAllowsLocalNetworking: true },
          NSLocationWhenInUseUsageDescription: "location",
        },
      },
    },
  });
}
test("store configuration rejects every development entry mode", () => {
  for (const flag of [
    "YUMEGAOKA_LOCAL_ENTRY",
    "YUMEGAOKA_VALIDATION_RELEASE",
    "EXPO_PUBLIC_FIELD_TRIAL",
    "EXPO_PUBLIC_UI_REVIEW",
    "YUMEGAOKA_SIMULATE_READ_OUTAGE",
  ]) {
    assert.throws(() => config({ ...valid, [flag]: "1" }), new RegExp(flag));
  }
});
test("store configuration fails closed for missing deployment and signing inputs", () => {
  for (const key of Object.keys(valid).filter(
    (key) => key !== "YUMEGAOKA_STORE_BUILD",
  )) {
    assert.throws(() => config({ ...valid, [key]: "" }), key);
  }
  for (const url of [
    "http://localhost:54321",
    "https://127.0.0.1",
    "https://example.supabase.co/path",
    "https://user:password@example.supabase.co",
    "https://example.supabase.co?key=secret",
    "https://example.supabase.co.attacker.test",
  ]) {
    assert.throws(() =>
      config({
        ...valid,
        EXPO_PUBLIC_SUPABASE_URL: url,
        YUMEGAOKA_STORE_API_ORIGIN: url,
      }),
    );
  }
  assert.throws(() =>
    config({ ...valid, EXPO_PUBLIC_SUPABASE_URL: "https://other.supabase.co" }),
  );
  assert.throws(() =>
    config({ ...valid, YUMEGAOKA_APNS_ENVIRONMENT: "sandbox" }),
  );
  for (const key of [
    "sb_secret_do_not_ship",
    "invalid",
    "header." +
      Buffer.from(JSON.stringify({ role: "service_role" })).toString(
        "base64url",
      ) +
      ".signature",
  ]) {
    assert.throws(() =>
      config({ ...valid, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }),
    );
  }
  for (const gateway of [
    "ws://localhost:54325",
    "wss://user:password@example.com",
    "wss://example.com?token=secret",
  ]) {
    assert.throws(() => config({ ...valid, EXPO_PUBLIC_GATEWAY_URL: gateway }));
  }
});
test("store mode preserves required capabilities but removes local network exceptions", () => {
  const output = config({
    ...valid,
    EXPO_PUBLIC_GATEWAY_URL: "wss://example.com/socket",
  });
  assert.equal(output.extra.storeBuild, true);
  assert.equal(output.ios.entitlements["aps-environment"], "production");
  assert.ok(output.plugins.includes("react-native-nfc-manager"));
  assert.equal(output.ios.infoPlist.NSLocalNetworkUsageDescription, undefined);
  assert.equal(output.ios.infoPlist.NSAppTransportSecurity, undefined);
  assert.equal(
    output.ios.infoPlist.NSLocationWhenInUseUsageDescription,
    "location",
  );
  const development = config({});
  assert.equal(
    development.ios.infoPlist.NSAppTransportSecurity.NSAllowsLocalNetworking,
    true,
  );
});
