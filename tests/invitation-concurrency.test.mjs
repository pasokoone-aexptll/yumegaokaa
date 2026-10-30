import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
const connectionString =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
test("one invitation cannot enroll two concurrent recipients; issuance stops at five", async () => {
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  const users = Array.from({ length: 3 }, () => randomUUID()),
    sessions = users.map(() => randomUUID()),
    clients = [],
    pids = [];
  async function rpc(index, operation, payload = {}) {
    const client = clients[index];
    await client.query("begin");
    try {
      await client.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({
          sub: users[index],
          session_id: sessions[index],
          role: "authenticated",
        }),
      ]);
      await client.query("set local role authenticated");
      const result = (
        await client.query("select public.street_api($1,$2) result", [
          operation,
          payload,
        ])
      ).rows[0].result;
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
  try {
    for (let i = 0; i < 3; i++) {
      await admin.query("insert into auth.users(id) values($1)", [users[i]]);
      await admin.query("insert into auth.sessions(id,user_id) values($1,$2)", [
        sessions[i],
        users[i],
      ]);
      const client = new pg.Client({ connectionString });
      await client.connect();
      clients.push(client);
      await client.query("set statement_timeout='10s'");
      pids.push(
        (await client.query("select pg_backend_pid() pid")).rows[0].pid,
      );
    }
    await admin.query(
      "insert into app_private.members(account_id) values($1)",
      [users[0]],
    );
    const issue = async () => {
      const receipt = await rpc(0, "command_prepare", {
        kind: "invite_create",
      });
      return rpc(0, "command_execute", { id: receipt.id, body: {} });
    };
    const invitation = await issue();
    await admin.query("begin");
    await admin.query(
      "select id from app_private.invitations where id=$1 for update",
      [invitation.id],
    );
    const race = Promise.allSettled(
      [1, 2].map((i) => rpc(i, "invite_accept", { code: invitation.code })),
    );
    let waiting = 0;
    for (let i = 0; i < 100; i++) {
      waiting = Number(
        (
          await admin.query(
            "select count(*) n from pg_stat_activity where pid=any($1::int[]) and wait_event_type='Lock'",
            [pids.slice(1)],
          )
        ).rows[0].n,
      );
      if (waiting === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    await admin.query("commit");
    const outcomes = await race;
    assert.equal(waiting, 2, "both requests reached the locked invitation");
    assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
    assert.match(
      outcomes.find((x) => x.status === "rejected").reason.message,
      /invalid_input/,
    );
    assert.equal(
      Number(
        (
          await admin.query(
            "select count(*) n from app_private.members where account_id=any($1::uuid[])",
            [users.slice(1)],
          )
        ).rows[0].n,
      ),
      1,
    );
    for (let i = 0; i < 4; i++) await issue();
    await assert.rejects(issue, /rate_limited/);
    assert.equal((await rpc(0, "invite_list")).items.length, 5);
  } finally {
    await admin.query("rollback");
    await Promise.all(clients.map((c) => c.end()));
    await admin.query("delete from app_private.invitations where issuer=$1", [
      users[0],
    ]);
    await admin.query(
      "delete from app_private.commands where owner_id=any($1::uuid[])",
      [users],
    );
    await admin.query(
      "delete from app_private.request_limits where account_id=any($1::uuid[])",
      [users],
    );
    await admin.query(
      "delete from app_private.members where account_id=any($1::uuid[])",
      [users],
    );
    await admin.query(
      "delete from auth.sessions where user_id=any($1::uuid[])",
      [users],
    );
    await admin.query("delete from auth.users where id=any($1::uuid[])", [
      users,
    ]);
    await admin.end();
  }
});
