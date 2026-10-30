import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";

test("chat length, write/read windows and idempotent retry enforce the published limits", async () => {
  const c = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await c.connect();
  await c.query("begin");
  try {
    const uid = randomUUID(),
      sid = randomUUID(),
      street = randomUUID();
    await c.query("insert into auth.users(id) values($1)", [uid]);
    await c.query("insert into auth.sessions(id,user_id) values($1,$2)", [
      sid,
      uid,
    ]);
    await c.query("insert into app_private.members(account_id) values($1)", [
      uid,
    ]);
    await c.query(
      "insert into app_private.streets(id,name) values($1,'limits fixture')",
      [street],
    );
    await c.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: uid, session_id: sid, role: "authenticated" }),
    ]);
    const rpc = async (op, payload = {}) => {
      await c.query("set local role authenticated");
      const result = (
        await c.query("select public.street_api($1,$2) r", [op, payload])
      ).rows[0].r;
      await c.query("reset role");
      return result;
    };
    const reject = async (fn, pattern) => {
      await c.query("savepoint rejection");
      await assert.rejects(fn, pattern);
      await c.query("rollback to savepoint rejection");
    };
    const prepare = () => rpc("command_prepare", { kind: "chat_send" });
    const send = (id, body) =>
      rpc("command_execute", { id, body: { street_id: street, body } });
    await rpc("profile_save", { display_name: "limits fixture" });
    const first = await prepare();
    await reject(() => send(first.id, "あ".repeat(501)), /invalid_input/);
    const created = await send(first.id, "あ".repeat(500));
    for (let i = 0; i < 4; i++) await send((await prepare()).id, "hello");
    const sixth = await prepare();
    await reject(() => send(sixth.id, "sixth"), /rate_limited/);
    assert.equal((await send(first.id, "あ".repeat(500))).id, created.id);
    assert.equal(
      (
        await c.query(
          "select count(*) from app_private.request_limits where account_id=$1 and kind='chat_write'",
          [uid],
        )
      ).rows[0].count,
      "5",
    );
    // Move completed batches outside 10s but keep them inside the minute window.
    for (let batch = 0; batch < 3; batch++) {
      await c.query(
        "update app_private.request_limits set at=clock_timestamp()-interval '15 seconds' where account_id=$1 and kind='chat_write'",
        [uid],
      );
      for (let i = 0; i < 5; i++) await send((await prepare()).id, "next");
    }
    await c.query(
      "update app_private.request_limits set at=clock_timestamp()-interval '15 seconds' where account_id=$1 and kind='chat_write'",
      [uid],
    );
    const next = await prepare();
    await reject(() => send(next.id, "twenty first"), /rate_limited/);
    assert.equal(
      (
        await c.query(
          "select count(*) from app_private.messages where street_id=$1",
          [street],
        )
      ).rows[0].count,
      "20",
    );
    for (let i = 0; i < 5; i++) await rpc("chat_list", { street_id: street });
    await reject(() => rpc("chat_list", { street_id: street }), /rate_limited/);
  } finally {
    await c.query("rollback");
    await c.end();
  }
});
