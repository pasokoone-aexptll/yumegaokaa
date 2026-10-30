import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
const connectionString =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
test("two concurrent reads cannot both consume the fifth slot", async () => {
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  const uid = randomUUID(),
    sid = randomUUID(),
    street = randomUUID(),
    clients = [],
    pids = [];
  try {
    await admin.query("insert into auth.users(id) values($1)", [uid]);
    await admin.query("insert into auth.sessions(id,user_id) values($1,$2)", [
      sid,
      uid,
    ]);
    await admin.query(
      "insert into app_private.members(account_id) values($1)",
      [uid],
    );
    await admin.query(
      "insert into app_private.streets(id,name) values($1,'read concurrency')",
      [street],
    );
    for (let i = 0; i < 2; i++) {
      const c = new pg.Client({ connectionString });
      await c.connect();
      clients.push(c);
      await c.query("set statement_timeout='5s'");
      await c.query("select set_config('request.jwt.claims',$1,false)", [
        JSON.stringify({ sub: uid, session_id: sid, role: "authenticated" }),
      ]);
      pids.push((await c.query("select pg_backend_pid() pid")).rows[0].pid);
      await c.query("set role authenticated");
    }
    await admin.query(
      "insert into app_private.request_limits select $1,'chat_read',clock_timestamp() from generate_series(1,4)",
      [uid],
    );
    await admin.query("begin");
    await admin.query(
      "select account_id from app_private.members where account_id=$1 for update",
      [uid],
    );
    const race = Promise.allSettled(
      clients.map((c) =>
        c.query("select public.street_api($1,$2)", [
          "chat_list",
          { street_id: street },
        ]),
      ),
    );
    let waiting = 0;
    for (let i = 0; i < 100; i++) {
      waiting = Number(
        (
          await admin.query(
            "select count(*) n from pg_stat_activity where pid=any($1::int[]) and wait_event_type='Lock'",
            [pids],
          )
        ).rows[0].n,
      );
      if (waiting === 2) break;
      await new Promise((r) => setTimeout(r, 20));
    }
    await admin.query("commit");
    const results = await race;
    assert.equal(
      waiting,
      2,
      "both requests actually contended on the member lock",
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const failure = results.find((r) => r.status === "rejected");
    assert.match(failure.reason.message, /rate_limited/);
    assert.equal(
      (
        await admin.query(
          "select count(*) from app_private.request_limits where account_id=$1 and kind='chat_read'",
          [uid],
        )
      ).rows[0].count,
      "5",
    );
  } finally {
    await admin.query("rollback");
    await Promise.all(clients.map((c) => c.end()));
    await admin.query(
      "delete from app_private.request_limits where account_id=$1",
      [uid],
    );
    await admin.query("delete from app_private.members where account_id=$1", [
      uid,
    ]);
    await admin.query("delete from auth.users where id=$1", [uid]);
    await admin.query("delete from app_private.streets where id=$1", [street]);
    await admin.end();
  }
});
