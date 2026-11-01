import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, generateKeyPairSync, verify } from "node:crypto";
import { createServer, connect } from "node:http2";
import pg from "pg";
import {
  providerToken,
  apnsSender,
  classifyAPNs,
} from "../scripts/lib/apns.mjs";
import { deliverPush } from "../scripts/lib/push-delivery.mjs";

test("APNs ES256署名・更新・HTTP2 payload（Appleには接続しない）", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });
  let now = Date.now();
  const token = providerToken({
    keyId: "ABCDEFGHIJ",
    teamId: "0123456789",
    privateKey: privateKey.export({ format: "pem", type: "pkcs8" }),
    now: () => now,
  });
  const first = token(),
    parts = first.split(".");
  assert(
    verify(
      "sha256",
      Buffer.from(parts.slice(0, 2).join(".")),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(parts[2], "base64url"),
    ),
  );
  assert.equal(token(), first);
  now += 3000_000;
  assert.notEqual(token(), first);
  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  let captured;
  server.on("stream", (stream, headers) => {
    let body = "";
    stream.on("data", (c) => (body += c));
    stream.on("end", () => {
      captured = { headers, body: JSON.parse(body) };
      stream.respond({ ":status": 200 });
      stream.end();
    });
  });
  const sender = apnsSender({
    environment: "sandbox",
    topic: "jp.yumegaoka.development",
    token,
    transport: () => connect(`http://127.0.0.1:${server.address().port}`),
  });
  try {
    const id = randomUUID();
    assert.deepEqual(
      await sender.send({
        id,
        token: "ab".repeat(32),
        environment: "sandbox",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      }),
      { kind: "accepted" },
    );
    assert.equal(captured.headers["apns-id"], id);
    assert.equal(captured.headers["apns-collapse-id"], id);
    assert.equal(captured.headers["apns-push-type"], "alert");
    assert.deepEqual(Object.keys(captured.body).sort(), [
      "aps",
      "notification_id",
    ]);
    assert.equal(captured.body.notification_id, id);
    assert.deepEqual(classifyAPNs(429), { kind: "retry" });
    assert.deepEqual(classifyAPNs(503), { kind: "retry" });
    assert.deepEqual(classifyAPNs(403), { kind: "configuration_error" });
    assert.equal(
      classifyAPNs(410, { timestamp: Date.now() }).kind,
      "invalid_token",
    );
    assert.equal(
      classifyAPNs(400, { reason: "BadDeviceToken" }).kind,
      "invalid_token",
    );
  } finally {
    sender.close();
    await new Promise((r) => server.close(r));
  }
});

test("実DB: 端末別送信・再送・認可・取消・利用停止・古い410・session削除", async () => {
  const db = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await db.connect();
  await db.query("begin");
  try {
    // All fixtures and isolation changes are rolled back.
    await db.query("delete from app_private.push_devices");
    const uid = randomUUID(),
      sid = randomUUID(),
      sid2 = randomUUID(),
      street = randomUUID(),
      event = randomUUID(),
      notice = randomUUID();
    await db.query("insert into auth.users(id) values($1)", [uid]);
    await db.query(
      "insert into auth.sessions(id,user_id) values($1,$3),($2,$3)",
      [sid, sid2, uid],
    );
    await db.query("insert into app_private.members(account_id) values($1)", [
      uid,
    ]);
    await db.query(
      "insert into app_private.streets(id,name) values($1,'push test')",
      [street],
    );
    await db.query(
      "insert into app_private.events(id,host_id,street_id,title,longitude,latitude,starts_at,ends_at,revision) values($1,$2,$3,'private title',0,0,clock_timestamp()+interval '1 hour',clock_timestamp()+interval '2 hours',2)",
      [event, uid, street],
    );
    await db.query(
      "insert into app_private.registrations(event_id,account_id,joined) values($1,$2,true)",
      [event, uid],
    );
    await db.query(
      "insert into app_private.notifications(id,event_id,event_revision,recipient,kind) values($1,$2,2,$3,'changed')",
      [notice, event, uid],
    );
    async function call(
      role,
      endpoint,
      operation,
      payload = {},
      session = sid,
    ) {
      await db.query("savepoint request");
      try {
        await db.query("select set_config('request.jwt.claims',$1,true)", [
          JSON.stringify({ role, sub: uid, session_id: session }),
        ]);
        await db.query(`set local role ${role}`);
        const result = (
          await db.query(`select public.${endpoint}($1,$2) result`, [
            operation,
            payload,
          ])
        ).rows[0].result;
        await db.query("reset role");
        await db.query("release savepoint request");
        return result;
      } catch (error) {
        await db.query("rollback to savepoint request");
        throw error;
      }
    }
    const rpc = (op, p) => call("service_role", "push_delivery", op, p);
    const register = (token, session = sid) =>
      call(
        "authenticated",
        "push_registration",
        "register",
        { token, environment: "sandbox" },
        session,
      );
    await assert.rejects(
      call("authenticated", "push_delivery", "claim", {
        environment: "sandbox",
      }),
      /permission denied/,
    );
    await assert.rejects(register("nothex"), /invalid_input/);
    await register("aa");
    await register("bb", sid2);
    await register("aa");
    assert.equal(
      (await db.query("select count(*)::int n from app_private.push_devices"))
        .rows[0].n,
      2,
    );
    const seen = [];
    const server = createServer();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    server.on("stream", (stream, headers) => {
      let body = "";
      stream.on("data", (chunk) => (body += chunk));
      stream.on("end", () => {
        seen.push(JSON.parse(body));
        stream.respond({
          ":status": headers[":path"].endsWith("aa") ? 200 : 429,
        });
        stream.end();
      });
    });
    const sender = apnsSender({
      environment: "sandbox",
      topic: "jp.yumegaoka.development",
      token: () => "local-test",
      transport: () => connect(`http://127.0.0.1:${server.address().port}`),
    });
    try {
      const totals = await deliverPush(rpc, sender, { environment: "sandbox" });
      assert.equal(totals.accepted, 1);
      assert.equal(totals.retry, 1);
      assert.equal(seen.length, 2);
      assert(
        seen.every(
          (body) => body.notification_id === notice && !("title" in body),
        ),
      );
    } finally {
      sender.close();
      await new Promise((resolve) => server.close(resolve));
    }
    await db.query(
      "update app_private.push_attempts set next_attempt_at=clock_timestamp()",
    );
    const retry = await rpc("claim", { environment: "sandbox" });
    assert.equal(retry.token, "bb");
    await register("bb", sid2);
    await rpc("invalid_token", {
      ...retry,
      invalidated_at: new Date().toISOString(),
    });
    assert.equal(
      (await db.query("select count(*)::int n from app_private.push_devices"))
        .rows[0].n,
      2,
      "old registration response cannot delete fresh registration",
    );
    await db.query(
      "update app_private.push_attempts set next_attempt_at=clock_timestamp()",
    );
    const fresh = await rpc("claim", { environment: "sandbox" });
    await rpc("invalid_token", fresh);
    assert.equal(
      (await db.query("select count(*)::int n from app_private.push_devices"))
        .rows[0].n,
      1,
    );
    assert.deepEqual(
      await rpc("claim", { environment: "sandbox" }),
      {},
      "accepted device is not resent",
    );
    await register("cc", sid2);
    const cancel = await rpc("claim", { environment: "sandbox" });
    await db.query(
      "update app_private.registrations set joined=false where event_id=$1",
      [event],
    );
    assert.equal((await rpc("recheck", cancel)).active, false);
    await db.query(
      "update app_private.registrations set joined=true where event_id=$1",
      [event],
    );
    const suspended = await rpc("claim", { environment: "sandbox" });
    await db.query(
      "update app_private.members set active=false where account_id=$1",
      [uid],
    );
    assert.equal((await rpc("accepted", suspended)).active, false);
    assert.equal(
      (await db.query("select count(*)::int n from app_private.push_devices"))
        .rows[0].n,
      0,
    );
    await assert.rejects(register("aa"), /membership_required/);
    await db.query(
      "update app_private.members set active=true where account_id=$1",
      [uid],
    );
    await register("dd");
    await db.query("delete from auth.sessions where id=$1", [sid]);
    assert.equal(
      (await db.query("select count(*)::int n from app_private.push_devices"))
        .rows[0].n,
      0,
    );
    await assert.rejects(register("ee"), /unauthorized/);
  } finally {
    await db.query("rollback");
    await db.end();
  }
});
