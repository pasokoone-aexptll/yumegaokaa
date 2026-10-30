import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
test("招待: 発行→単回受領→資格→停止ユーザー再登録不可", async () => {
  const c = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await c.connect();
  await c.query("begin");
  try {
    const users = [randomUUID(), randomUUID(), randomUUID()],
      sessions = users.map(() => randomUUID());
    for (let i = 0; i < 3; i++) {
      await c.query("insert into auth.users(id) values($1)", [users[i]]);
      await c.query("insert into auth.sessions(id,user_id) values($1,$2)", [
        sessions[i],
        users[i],
      ]);
    }
    await c.query("insert into app_private.members(account_id) values($1)", [
      users[0],
    ]);
    async function call(i, op, p = {}) {
      await c.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({
          sub: users[i],
          session_id: sessions[i],
          role: "authenticated",
        }),
      ]);
      await c.query("set local role authenticated");
      const r = await c.query("select public.street_api($1,$2) result", [
        op,
        p,
      ]);
      await c.query("reset role");
      return r.rows[0].result;
    }
    const receipt = await call(0, "command_prepare", { kind: "invite_create" });
    const invite = await call(0, "command_execute", {
      id: receipt.id,
      body: {},
    });
    assert.ok(invite.code);
    assert.deepEqual(
      await call(0, "command_execute", { id: receipt.id, body: {} }),
      invite,
    );
    assert.deepEqual(
      (await call(0, "command_status", { id: receipt.id })).result,
      invite,
    );
    assert.equal((await call(0, "invite_list")).items.length, 1);
    await call(0, "invite_revoke", { id: invite.id });
    assert.deepEqual(
      await call(0, "command_execute", { id: receipt.id, body: {} }),
      invite,
    );
    assert.equal((await call(0, "invite_list")).items[0].revoked, true);
    // A separate receipt represents an intentional new invitation.
    const second = await call(0, "command_prepare", { kind: "invite_create" });
    const acceptedInvite = await call(0, "command_execute", {
      id: second.id,
      body: {},
    });
    const lifetime = (
      await c.query(
        "select extract(epoch from (expires_at-created_at)) seconds from app_private.invitations where id=$1",
        [acceptedInvite.id],
      )
    ).rows[0];
    assert.ok(Math.abs(Number(lifetime.seconds) - 604800) < 1);
    await c.query("savepoint expired");
    await c.query(
      "update app_private.invitations set expires_at=clock_timestamp()-interval '1 second' where id=$1",
      [acceptedInvite.id],
    );
    await assert.rejects(
      () => call(1, "invite_accept", { code: acceptedInvite.code }),
      /invalid_input/,
    );
    await c.query("rollback to savepoint expired");
    assert.equal(
      (
        await c.query(
          "select count(*) n from app_private.members where account_id=$1",
          [users[1]],
        )
      ).rows[0].n,
      "0",
    );
    invite.code = acceptedInvite.code;

    assert.equal(
      (await call(1, "invite_accept", { code: invite.code })).accepted,
      true,
    );
    assert.ok((await call(1, "time")).server_time);
    await c.query("savepoint rejected");
    await assert.rejects(
      () => call(2, "invite_accept", { code: invite.code }),
      /invalid_input/,
    );
    await c.query("rollback to savepoint rejected");
    assert.ok((await call(0, "invite_list")).items.some((x) => x.used));
    await c.query(
      "update app_private.members set active=false where account_id=$1",
      [users[1]],
    );
    await c.query("savepoint banned");
    await assert.rejects(
      () => call(1, "invite_accept", { code: invite.code }),
      /membership_required/,
    );
    await c.query("rollback to savepoint banned");
  } finally {
    await c.query("rollback");
    await c.end();
  }
});
