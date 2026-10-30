import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import pg from "pg";
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
  let uid;
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
    await db.query("begin");
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
    await db.query("rollback");
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
