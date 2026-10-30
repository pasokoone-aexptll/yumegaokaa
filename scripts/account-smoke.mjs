import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import pg from "pg";
const env = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
assert.equal(new URL(env.API_URL).hostname, "127.0.0.1");
const db = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
await db.connect();
let uid;
const street = randomUUID(),
  oldEmail = "account-" + randomUUID() + "@example.test",
  newEmail = "changed-" + randomUUID() + "@example.test",
  password = randomUUID() + randomUUID();
async function request(path, method, body, token = env.SERVICE_ROLE_KEY) {
  return fetch(env.API_URL + path, {
    method,
    headers: {
      apikey: env.PUBLISHABLE_KEY,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function auth(path, method, body, token) {
  const r = await request("/auth/v1/" + path, method, body, token);
  assert.ok(r.ok, "Auth " + path.split("/")[0] + " HTTP " + r.status);
  return r.json();
}
async function rpc(token, operation, payload = {}) {
  return request(
    "/rest/v1/rpc/street_api",
    "POST",
    { operation, payload },
    token,
  );
}
async function mailCode(email) {
  for (let i = 0; i < 20; i++) {
    const list = await (
        await fetch("http://127.0.0.1:54324/api/v1/messages")
      ).json(),
      m = list.messages.find((m) => m.To.some((t) => t.Address === email));
    if (m) {
      const body = await (
        await fetch("http://127.0.0.1:54324/api/v1/message/" + m.ID)
      ).json();
      const code = (body.Text + " " + body.HTML).match(/\b\d{6}\b/)?.[0];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw Error("mail code not received");
}
try {
  const user = await auth("admin/users", "POST", {
    email: oldEmail,
    password,
    email_confirm: true,
  });
  uid = user.id;
  let session = await auth("token?grant_type=password", "POST", {
    email: oldEmail,
    password,
  });
  await db.query("insert into app_private.members(account_id) values($1)", [
    uid,
  ]);
  assert.ok(
    (
      await rpc(session.access_token, "profile_save", {
        display_name: "退会試験",
      })
    ).ok,
  );
  await auth("user", "PUT", { email: newEmail }, session.access_token);
  const oldCode = await mailCode(oldEmail),
    newCode = await mailCode(newEmail);
  const first = await auth("verify", "POST", {
    email: oldEmail,
    token: oldCode,
    type: "email_change",
  });
  assert.ok(
    !first.access_token,
    "One email confirmation cannot change identity",
  );
  assert.equal(
    (await auth("user", "GET", undefined, session.access_token)).email,
    oldEmail,
  );
  session = await auth("verify", "POST", {
    email: newEmail,
    token: newCode,
    type: "email_change",
  });
  assert.equal(session.user.email, newEmail);
  await db.query(
    "insert into app_private.streets(id,name) values($1,'退会試験')",
    [street],
  );
  await db.query(
    "insert into app_private.messages(street_id,author_id,body) values($1,$2,'匿名化対象')",
    [street, uid],
  );
  const prepared = await rpc(session.access_token, "withdraw_prepare");
  assert.ok(prepared.ok);
  const ticket = await prepared.json();
  assert.equal(
    (await rpc(session.access_token, "withdraw_confirm", { id: ticket.id }))
      .status,
    401,
    "Prior OTP is not reauthentication after request",
  );
  await new Promise((r) => setTimeout(r, 1100));
  await auth("otp", "POST", { email: newEmail, create_user: false });
  session = await auth("verify", "POST", {
    email: newEmail,
    token: await mailCode(newEmail),
    type: "email",
  });
  const withdrawn = await rpc(session.access_token, "withdraw_confirm", {
    id: ticket.id,
  });
  assert.equal(withdrawn.status, 200, "Reauthenticated withdrawal");
  assert.equal((await rpc(session.access_token, "profile_get")).status, 403);
  assert.equal(
    (
      await db.query(
        "select author_id from app_private.messages where street_id=$1",
        [street],
      )
    ).rows[0].author_id,
    null,
  );
  assert.equal(
    (
      await db.query(
        "select account_id from app_private.profiles where account_id=$1",
        [uid],
      )
    ).rowCount,
    0,
  );
  execFileSync(process.execPath, ["scripts/maintenance-worker.mjs", "--once"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.ok(
    (await db.query("select deleted_at from auth.users where id=$1", [uid]))
      .rows[0].deleted_at,
    "Auth soft deletion completed",
  );
  assert.equal(
    (
      await db.query(
        "select id from app_private.account_cleanup_jobs where account_id=$1",
        [uid],
      )
    ).rowCount,
    0,
  );
  console.log(
    "アカウント統合成功: 新旧メール確認→変更→再認証前の退会拒否→OTP再認証→資格停止/匿名化→Auth清掃。",
  );
} finally {
  if (uid) {
    await db.query(
      "delete from app_private.account_cleanup_jobs where account_id=$1",
      [uid],
    );
    await db.query(
      "delete from app_private.withdrawal_requests where account_id=$1",
      [uid],
    );
    await db.query("delete from app_private.profiles where account_id=$1", [
      uid,
    ]);
    await db.query("delete from app_private.messages where street_id=$1", [
      street,
    ]);
    await db.query("delete from app_private.streets where id=$1", [street]);
    await db.query("delete from app_private.members where account_id=$1", [
      uid,
    ]);
    await request("/auth/v1/admin/users/" + uid, "DELETE");
  }
  await db.end();
}
