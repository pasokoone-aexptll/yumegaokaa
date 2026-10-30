import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import WebSocket from "ws";
import pg from "pg";
test("two real authenticated viewers receive chat changes and reconnect to messages sent offline", async () => {
  const env = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  const db = new pg.Client({ connectionString: env.DB_URL });
  await db.connect();
  const users = [],
    sockets = [];
  const street = "11111111-1111-4111-8111-111111111111";
  const admin = {
    apikey: env.PUBLISHABLE_KEY,
    Authorization: `Bearer ${env.SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
  async function auth(path, body) {
    const r = await fetch(env.API_URL + "/auth/v1/" + path, {
      method: "POST",
      headers: admin,
      body: JSON.stringify(body),
    });
    assert.ok(r.ok, "auth " + r.status);
    return r.json();
  }
  async function rpc(u, operation, payload = {}) {
    const r = await fetch(env.API_URL + "/rest/v1/rpc/street_api", {
      method: "POST",
      headers: { ...admin, Authorization: `Bearer ${u.token}` },
      body: JSON.stringify({ operation, payload }),
    });
    assert.ok(r.ok, operation + " " + r.status);
    return r.json();
  }
  async function connect(u) {
    const ws = new WebSocket("ws://127.0.0.1:54325/street", {
      headers: { Authorization: `Bearer ${u.token}` },
    });
    sockets.push(ws);
    assert.equal(
      JSON.parse(
        (await once(ws, "message", { signal: AbortSignal.timeout(5000) }))[0],
      ).type,
      "ready",
    );
    return ws;
  }
  const changed = (ws) =>
    once(ws, "message", { signal: AbortSignal.timeout(5000) });
  try {
    for (let i = 0; i < 2; i++) {
      const email = `chat-live-${randomUUID()}@example.test`;
      const created = await auth("admin/users", { email, email_confirm: true });
      const u = { id: created.id };
      users.push(u);
      const link = await auth("admin/generate_link", {
        type: "magiclink",
        email,
      });
      u.token = (
        await auth("verify", {
          type: "magiclink",
          token_hash: link.hashed_token,
        })
      ).access_token;
      await db.query("insert into app_private.members(account_id) values($1)", [
        u.id,
      ]);
      await rpc(u, "profile_save", { display_name: "Live fixture " + i });
    }
    const a = await connect(users[0]),
      b = await connect(users[1]);
    async function send(body) {
      const receipt = await rpc(users[0], "command_prepare", {
        kind: "chat_send",
      });
      return rpc(users[0], "command_execute", {
        id: receipt.id,
        body: { street_id: street, body },
      });
    }
    const notifications = [changed(a), changed(b)];
    const first = await send("live integration " + randomUUID());
    await Promise.all(notifications);
    for (const u of users)
      assert.ok(
        (await rpc(u, "chat_list", { street_id: street })).items.some(
          (m) => m.id === first.id,
        ),
      );
    const closed = once(b, "close");
    b.close();
    await closed;
    const second = await send("offline integration " + randomUUID());
    await connect(users[1]);
    const recovered = (await rpc(users[1], "chat_list", { street_id: street }))
      .items;
    assert.ok(recovered.some((m) => m.id === second.id));
    assert.ok(recovered.some((m) => m.id === first.id));
  } finally {
    for (const s of sockets) s.terminate();
    const ids = users.map((u) => u.id);
    for (const [table, column] of [
      ["messages", "author_id"],
      ["commands", "owner_id"],
      ["request_limits", "account_id"],
      ["profiles", "account_id"],
      ["members", "account_id"],
    ])
      await db.query(
        `delete from app_private.${table} where ${column}=any($1::uuid[])`,
        [ids],
      );
    for (const u of users) {
      const r = await fetch(env.API_URL + "/auth/v1/admin/users/" + u.id, {
        method: "DELETE",
        headers: admin,
      });
      assert.ok(r.ok);
    }
    await db.end();
  }
});
