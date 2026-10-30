import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const clientModule = {};
new Function(
  "exports",
  ts.transpileModule(
    readFileSync("apps/mobile/src/lib/gatewayConnection.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(clientModule);
async function until(condition) {
  const deadline = Date.now() + 4000;
  while (!condition()) {
    if (Date.now() > deadline) throw Error("gateway client timed out");
    await new Promise((r) => setTimeout(r, 20));
  }
}
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import pg from "pg";
import WebSocket from "ws";
import { once } from "node:events";
import { startGateway } from "../scripts/lib/gateway-runtime.mjs";
import { gatewayAuthorizer } from "../scripts/lib/gateway-authorize.mjs";

test("gateway uses real Auth signature and active DB membership/session", async () => {
  const env = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  assert.equal(new URL(env.API_URL).hostname, "127.0.0.1");
  const db = new pg.Client({ connectionString: env.DB_URL });
  await db.connect();
  const street = randomUUID();
  let uid, runtime, socket, client;
  const headers = {
    apikey: env.PUBLISHABLE_KEY,
    Authorization: `Bearer ${env.SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
  async function post(path, body) {
    const r = await fetch(env.API_URL + "/auth/v1/" + path, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    assert.ok(r.ok, `Auth request failed: ${r.status}`);
    return r.json();
  }
  try {
    const email = `gateway-${randomUUID()}@example.test`;
    const user = await post("admin/users", { email, email_confirm: true });
    uid = user.id;
    const link = await post("admin/generate_link", {
      type: "magiclink",
      email,
    });
    const session = await post("verify", {
      type: "magiclink",
      token_hash: link.hashed_token,
    });
    const token = session.access_token;

    await db.query(
      "insert into app_private.streets(id,name) values($1,'gateway auth fixture')",
      [street],
    );
    const authorize = gatewayAuthorizer({
      apiURL: env.API_URL,
      publishableKey: env.PUBLISHABLE_KEY,
      db,
      streetId: street,
    });
    assert.equal(await authorize(token), null);
    await db.query("insert into app_private.members(account_id) values($1)", [
      uid,
    ]);
    const identity = await authorize(token);
    assert.equal(identity.accountId, uid);
    const config = {
      dbURL: env.DB_URL,
      apiURL: env.API_URL,
      publishableKey: env.PUBLISHABLE_KEY,
      streetId: street,
      port: 0,
    };
    runtime = await startGateway(config);
    await assert.rejects(() => startGateway(config), /already owns/);
    socket = new WebSocket(`ws://127.0.0.1:${runtime.address.port}/street`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(JSON.parse((await once(socket, "message"))[0]).type, "ready");
    const changed = once(socket, "message", {
      signal: AbortSignal.timeout(3000),
    });
    await db.query("update app_private.streets set name=name where id=$1", [
      street,
    ]);
    assert.equal(JSON.parse((await changed)[0]).type, "changed");
    // The exact transport used by the mobile hook runs against real Auth/DB.
    let deliveries = 0,
      tokenReads = 0,
      mobileSocket;
    client = clientModule.gatewayConnection({
      token: async () => {
        tokenReads++;
        return token;
      },
      connect: (token) => {
        mobileSocket = new WebSocket(
          `ws://127.0.0.1:${runtime.address.port}/street`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        return mobileSocket;
      },
      changed: () => deliveries++,
      retryMs: 10,
    });
    client.setActive(true);
    await until(() => deliveries >= 1);
    const before = deliveries;
    mobileSocket.terminate();
    await until(() => tokenReads >= 2 && deliveries > before);
    const afterReconnect = deliveries;
    await db.query("update app_private.streets set name=name where id=$1", [
      street,
    ]);
    await until(() => deliveries > afterReconnect);
    client.setActive(false);
    // Direct Supabase WebSocket handshake must fail, not merely topic access.
    const directURL = new URL(env.API_URL);
    directURL.protocol = "ws:";
    directURL.pathname = "/realtime/v1/websocket";
    directURL.searchParams.set("apikey", env.PUBLISHABLE_KEY);
    await new Promise((resolve, reject) => {
      const direct = new WebSocket(directURL, {
        headers: { Authorization: `Bearer ${token}` },
        handshakeTimeout: 2000,
      });
      direct.once("open", () => {
        direct.terminate();
        reject(Error("direct realtime bypass remains open"));
      });
      direct.once("error", () => resolve());
    });
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from pg_policies where schemaname='realtime' and policyname='street_broadcast_read'",
        )
      ).rows[0].n,
      0,
    );
    const disconnected = once(socket, "close", {
      signal: AbortSignal.timeout(3000),
    });

    const parts = token.split(".");
    const payload = JSON.parse(Buffer.from(parts[1], "base64url"));
    payload.sub = randomUUID();
    parts[1] = Buffer.from(JSON.stringify(payload)).toString("base64url");
    assert.equal(await authorize(parts.join(".")), null);
    await db.query(
      "update app_private.members set active=false where account_id=$1",
      [uid],
    );
    assert.equal(await authorize(token), null);
    await disconnected;
    await db.query(
      "update app_private.members set active=true,withdrawn_at=clock_timestamp() where account_id=$1",
      [uid],
    );
    assert.equal(await authorize(token), null);
    await db.query(
      "update app_private.members set withdrawn_at=null where account_id=$1",
      [uid],
    );
    await db.query("delete from auth.sessions where id=$1", [
      identity.sessionId,
    ]);
    assert.equal(await authorize(token), null);
  } finally {
    client?.setActive(false);
    socket?.terminate();
    await runtime?.close();
    if (uid)
      await db.query("delete from app_private.members where account_id=$1", [
        uid,
      ]);
    await db.query("delete from app_private.streets where id=$1", [street]);
    await db.end();
    if (uid) {
      const r = await fetch(env.API_URL + "/auth/v1/admin/users/" + uid, {
        method: "DELETE",
        headers,
      });
      assert.ok(r.ok, "test Auth user cleanup failed");
    }
  }
});
