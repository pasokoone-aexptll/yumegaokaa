import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
const connectionString =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
test("電信PIN: 街外作成、参加/到着、定員、OFF解除、通知、ブロック、日次枠、期限と認可", async () => {
  const c = new pg.Client({ connectionString });
  await c.connect();
  await c.query("begin");
  try {
    const users = Array.from({ length: 4 }, () => randomUUID()),
      sessions = users.map(() => randomUUID()),
      street = randomUUID();
    for (let i = 0; i < 4; i++) {
      await c.query("insert into auth.users(id) values($1)", [users[i]]);
      await c.query("insert into auth.sessions(id,user_id) values($1,$2)", [
        sessions[i],
        users[i],
      ]);
      await c.query("insert into app_private.members(account_id) values($1)", [
        users[i],
      ]);
      await c.query(
        "insert into app_private.profiles(account_id,display_name) values($1,$2)",
        [users[i], `person-${i}`],
      );
    }
    await c.query(
      "insert into app_private.streets(id,name) values($1,'denshin test')",
      [street],
    );
    await c.query(
      "insert into app_private.areas values($1,1,extensions.st_buffer(extensions.st_transform(extensions.st_setsrid(extensions.st_makepoint(139.7109,35.7295),4326),'+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'),500))",
      [street],
    );
    async function rpc(i, op, p = {}) {
      await c.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({
          sub: users[i],
          session_id: sessions[i],
          role: "authenticated",
        }),
      ]);
      await c.query("set local role authenticated");
      const r = (await c.query("select public.street_api($1,$2) r", [op, p]))
        .rows[0].r;
      await c.query("reset role");
      return r;
    }
    async function cmd(i, kind, body) {
      const ticket = await rpc(i, "command_prepare", { kind });
      return rpc(i, "command_execute", { id: ticket.id, body });
    }
    async function denied(fn, re) {
      await c.query("savepoint denial");
      await assert.rejects(fn, re);
      await c.query("rollback to savepoint denial");
    }
    const body = {
      street_id: street,
      body: "明日このあたりにいます",
      longitude: 139.7109,
      latitude: 35.7295,
      recruiting: false,
      capacity: null,
    };
    const ticket = await rpc(0, "command_prepare", { kind: "denshin_create" });
    for (const patch of [
      { body: "" },
      { body: "x".repeat(501) },
      { longitude: 140 },
      { capacity: 101 },
      { capacity: 0 },
    ])
      await denied(
        () =>
          rpc(0, "command_execute", {
            id: ticket.id,
            body: { ...body, ...patch },
          }),
        /invalid_input/,
      );
    const { id } = await rpc(0, "command_execute", { id: ticket.id, body });
    assert.equal(
      (await rpc(0, "command_execute", { id: ticket.id, body })).id,
      id,
    );
    let p = await rpc(0, "denshin_get", { id });
    assert.equal(Date.parse(p.expires_at) - Date.parse(p.created_at), 86400000);
    assert.equal(p.recruiting, false);
    assert.equal(p.count, 0);
    assert.equal(p.mine, true);
    assert.equal(
      (
        await c.query(
          "select count(*) n from app_private.visits where account_id=any($1::uuid[])",
          [users],
        )
      ).rows[0].n,
      "0",
    );
    await denied(
      () =>
        cmd(1, "denshin_attend", {
          id,
          revision: 1,
          attendance_revision: 0,
          state: "planned",
        }),
      /not_recruiting/,
    );
    await denied(
      () => cmd(1, "denshin_edit", { ...body, id, revision: 1 }),
      /membership_required/,
    );
    await cmd(0, "denshin_edit", {
      ...body,
      id,
      revision: 1,
      recruiting: true,
      capacity: 1,
    });
    await denied(
      () =>
        cmd(0, "denshin_attend", {
          id,
          revision: 2,
          attendance_revision: 0,
          state: "planned",
        }),
      /invalid_input/,
    );
    await denied(
      () =>
        cmd(1, "denshin_attend", {
          id,
          revision: 2,
          attendance_revision: 0,
          state: "arrived",
        }),
      /invalid_transition/,
    );
    await cmd(1, "denshin_attend", {
      id,
      revision: 2,
      attendance_revision: 0,
      state: "planned",
    });
    await denied(
      () =>
        cmd(2, "denshin_attend", {
          id,
          revision: 2,
          attendance_revision: 0,
          state: "planned",
        }),
      /full/,
    );
    await cmd(1, "denshin_attend", {
      id,
      revision: 2,
      attendance_revision: 1,
      state: "arrived",
    });
    p = await rpc(2, "denshin_get", { id });
    assert.equal(p.people[0].display_name, "person-1");
    assert.equal(p.people[0].state, "arrived");
    assert.equal(p.count, 1);
    await denied(
      () =>
        cmd(0, "denshin_edit", {
          ...body,
          id,
          revision: 2,
          recruiting: true,
          longitude: 139.711,
        }),
      /participants_present/,
    );
    await cmd(0, "denshin_edit", {
      ...body,
      id,
      revision: 2,
      recruiting: true,
      capacity: 1,
      body: "更新しました",
    });
    assert.equal(
      (await rpc(1, "notification_list")).items[0].kind,
      "pin_changed",
    );
    await denied(
      () => cmd(0, "denshin_mode", { id, revision: 3, recruiting: false }),
      /confirmation_required/,
    );
    await cmd(0, "denshin_mode", {
      id,
      revision: 3,
      recruiting: false,
      confirm_close: true,
    });
    p = await rpc(1, "denshin_get", { id });
    assert.equal(p.attendance, "left");
    assert.equal(p.count, 0);
    assert.equal(p.people.length, 0);
    const notices = await rpc(1, "notification_list");
    assert.equal(notices.items[0].kind, "pin_closed");
    assert.equal(
      (
        await c.query(
          "select app_private.notification_sendable($1,clock_timestamp()) ok",
          [notices.items[0].id],
        )
      ).rows[0].ok,
      true,
    );
    await rpc(1, "notification_read", { id: notices.items[0].id });
    await cmd(0, "denshin_mode", { id, revision: 4, recruiting: true });
    assert.equal((await rpc(1, "denshin_get", { id })).attendance, "left");
    await denied(
      () =>
        cmd(1, "denshin_attend", {
          id,
          revision: 2,
          attendance_revision: 0,
          state: "planned",
        }),
      /conflict/,
    );
    await cmd(1, "denshin_attend", {
      id,
      revision: 5,
      attendance_revision: 3,
      state: "planned",
    });
    await rpc(2, "block_set", { account_id: users[1], blocked: true });
    p = await rpc(2, "denshin_get", { id });
    assert.equal(p.count, 1);
    assert.equal(p.people.length, 0);
    await rpc(1, "block_set", { account_id: users[0], blocked: true });
    const list = await rpc(1, "denshin_list", { street_id: street });
    assert.equal(list.items.length, 0);
    assert.equal(list.hidden_attendance.length, 1);
    assert.equal(list.hidden_attendance[0].body, undefined);
    await denied(() => rpc(1, "denshin_get", { id }), /not_found/);
    await cmd(1, "denshin_attend", {
      id,
      revision: 5,
      attendance_revision: 4,
      state: "left",
    });
    assert.equal(
      (await rpc(1, "denshin_list", { street_id: street })).hidden_attendance
        .length,
      0,
    );
    await cmd(0, "denshin_host", { id, revision: 5, arrived: true });
    p = await rpc(0, "denshin_get", { id });
    assert.equal(p.host_arrived, true);
    assert.equal(p.count, 0);
    const report = await rpc(2, "report_create", {
      target_kind: "denshin",
      target_id: id,
      reason: "other",
    });
    assert.ok(report.id);
    assert.equal(
      (
        await c.query("select evidence from app_private.reports where id=$1", [
          report.id,
        ])
      ).rows[0].evidence.longitude,
      undefined,
    );
    // Deleted pins consume today's quota and do not revive through old receipts.
    const remove = await rpc(0, "command_prepare", { kind: "denshin_delete" });
    const removeBody = { id, revision: 6 };
    await rpc(0, "command_execute", { id: remove.id, body: removeBody });
    await rpc(0, "command_execute", { id: remove.id, body: removeBody });
    await denied(() => rpc(0, "denshin_get", { id }), /not_found/);
    for (let i = 0; i < 2; i++) await cmd(0, "denshin_create", body);
    await denied(() => cmd(0, "denshin_create", body), /daily_limit/);
    assert.equal(
      (
        await c.query(
          "select used from app_private.denshin_daily_usage where account_id=$1",
          [users[0]],
        )
      ).rows[0].used,
      3,
    );
    // A stopped author loses publication; releasing the stop does not restore it.
    await c.query(
      "update app_private.members set active=false where account_id=$1",
      [users[0]],
    );
    await c.query(
      "update app_private.members set active=true where account_id=$1",
      [users[0]],
    );
    assert.equal(
      (await rpc(0, "denshin_list", { street_id: street })).items.length,
      0,
    );
    await c.query(
      "insert into app_private.chat_restrictions values($1,clock_timestamp()+interval '1 hour')",
      [users[3]],
    );
    await denied(() => cmd(3, "denshin_create", body), /posting_restricted/);
    await c.query(
      "delete from app_private.chat_restrictions where account_id=$1",
      [users[3]],
    );
    const expired = (await cmd(3, "denshin_create", body)).id;
    await c.query(
      "update app_private.denshin_pins set created_at=created_at-interval '25 hours',expires_at=expires_at-interval '25 hours' where id=$1",
      [expired],
    );
    await denied(() => rpc(3, "denshin_get", { id: expired }), /not_found/);
    await denied(
      () =>
        cmd(3, "denshin_mode", { id: expired, revision: 1, recruiting: true }),
      /not_found/,
    );
    await c.query("savepoint cleanup");
    await c.query(
      "update app_private.denshin_pins set created_at=created_at-interval '24 hours',expires_at=expires_at-interval '24 hours' where id=$1",
      [expired],
    );
    await c.query("select app_private.cleanup()");
    assert.equal(
      (
        await c.query(
          "select count(*) n from app_private.denshin_pins where id=$1",
          [expired],
        )
      ).rows[0].n,
      "0",
    );
    await c.query("rollback to savepoint cleanup");
    await c.query("delete from auth.sessions where id=$1", [sessions[2]]);
    await denied(
      () => rpc(2, "denshin_list", { street_id: street }),
      /unauthorized/,
    );
  } finally {
    await c.query("rollback");
    await c.end();
  }
});
