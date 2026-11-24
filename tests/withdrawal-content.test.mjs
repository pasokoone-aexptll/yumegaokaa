import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";

test("退会: 再認証・本人限定の本文消去・再送・PIN閉鎖（全変更ROLLBACK）", async () => {
  const db = new pg.Client({ connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" });
  await db.connect();
  try {
    await db.query("begin");
    const migration = await readFile(new URL("../supabase/migrations/202611250057_withdrawal_content_deletion.sql", import.meta.url), "utf8");
    await db.query(migration.replace(/^begin;/, "").replace(/commit;\s*$/, ""));
    const owner = randomUUID(), other = randomUUID(), session = randomUUID(), street = randomUUID();
    await db.query("insert into auth.users(id) values($1),($2)", [owner, other]);
    await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [session, owner]);
    await db.query("insert into app_private.members(account_id) values($1),($2)", [owner, other]);
    await db.query("insert into app_private.streets(id,name) values($1,'退会削除検証')", [street]);
    await db.query("insert into app_private.messages(street_id,author_id,body) values($1,$2,'本人本文'),($1,$3,'他人本文')", [street, owner, other]);
    await db.query("insert into app_private.denshin_pins(owner_id,street_id,body,longitude,latitude,created_at,expires_at) values($1,$2,'本人PIN',139,35,now(),now()+interval '24 hours'),($3,$2,'他人PIN',139,35,now(),now()+interval '24 hours')", [owner, street, other]);
    const claims = { sub: owner, session_id: session, role: "authenticated" };
    const setClaims = (value) => db.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify(value)]);
    const rpc = async (operation, payload = {}) => {
      await db.query("set local role authenticated");
      const result = await db.query("select public.street_api($1,$2) result", [operation, payload]);
      await db.query("reset role");
      return result.rows[0].result;
    };
    await setClaims(claims);
    const ticket = await rpc("withdraw_prepare");
    await db.query("savepoint unauthorized_attempt");
    await assert.rejects(rpc("withdraw_confirm", { id: ticket.id }), /unauthorized/);
    await db.query("rollback to savepoint unauthorized_attempt");
    await db.query("reset role");
    assert.equal((await db.query("select body from app_private.messages where author_id=$1", [owner])).rows[0].body, "本人本文");
    await setClaims({ ...claims, amr: [{ method: "otp", timestamp: Math.ceil(Date.now() / 1000) }] });
    assert.equal((await rpc("withdraw_confirm", { id: ticket.id })).withdrawn, true);
    const messages = (await db.query("select author_id,body,deleted_at from app_private.messages where street_id=$1", [street])).rows;
    assert.equal(messages.length, 2);
    const erased = messages.find(row => row.author_id === null);
    assert.equal(erased.body, null);
    assert.ok(erased.deleted_at);
    assert.equal(messages.find(row => row.author_id === other).body, "他人本文");
    const pins = (await db.query("select owner_id,body,deleted_at from app_private.denshin_pins where street_id=$1", [street])).rows;
    assert.equal(pins.find(row => row.owner_id === owner).body, "削除済み");
    assert.ok(pins.find(row => row.owner_id === owner).deleted_at);
    assert.equal(pins.find(row => row.owner_id === other).body, "他人PIN");
    assert.equal(pins.find(row => row.owner_id === other).deleted_at, null);
    assert.equal((await rpc("withdraw_confirm", { id: ticket.id })).withdrawn, true);
  } finally {
    await db.query("rollback");
    await db.end();
  }
});
