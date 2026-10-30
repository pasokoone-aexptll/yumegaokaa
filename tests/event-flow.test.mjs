import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
test("統合: 作成→参加→Home→取消/再送→変更通知→名簿権限→中止", async () => {
  const c = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await c.connect();
  await c.query("begin");
  try {
    const users = [randomUUID(), randomUUID(), randomUUID()],
      sessions = users.map(() => randomUUID()),
      street = randomUUID();
    for (let i = 0; i < 3; i++) {
      await c.query("insert into auth.users(id) values($1)", [users[i]]);
      await c.query("insert into auth.sessions(id,user_id) values($1,$2)", [
        sessions[i],
        users[i],
      ]);
      await c.query("insert into app_private.members(account_id) values($1)", [
        users[i],
      ]);
    }
    await c.query(
      "insert into app_private.streets(id,name) values($1,'event integration')",
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
    async function denied(i, op, p, re) {
      await c.query("savepoint denied");
      await assert.rejects(() => rpc(i, op, p), re);
      await c.query("rollback to savepoint denied");
    }
    const start = new Date(Date.now() + 3600000).toISOString(),
      end = new Date(Date.now() + 7200000).toISOString();
    const ticket = await rpc(0, "command_prepare", { kind: "event_create" }),
      body = {
        street_id: street,
        title: "集まろう",
        description: "駅前",
        longitude: 139.7109,
        latitude: 35.7295,
        starts_at: start,
        ends_at: end,
        capacity: 1,
      };
    for (const patch of [
      { title: "" },
      { title: "x".repeat(51) },
      { description: "x".repeat(1001) },
      { capacity: 0 },
      { capacity: 101 },
      { longitude: 140, latitude: 36 },
      { starts_at: new Date(Date.now() - 1000).toISOString() },
      {
        starts_at: new Date(Date.now() + 91 * 86400000).toISOString(),
        ends_at: new Date(Date.now() + 91 * 86400000 + 3600000).toISOString(),
      },
      { ends_at: start },
      { ends_at: new Date(Date.parse(start) + 86400001).toISOString() },
    ])
      await denied(
        0,
        "command_execute",
        { id: ticket.id, body: { ...body, ...patch } },
        /invalid_input/,
      );
    await c.query("savepoint maximum_duration");
    const maxEvent = await rpc(0, "command_execute", {
      id: ticket.id,
      body: {
        ...body,
        capacity: 100,
        ends_at: new Date(Date.parse(start) + 86400000).toISOString(),
      },
    });
    assert.equal(
      (await rpc(0, "event_get", { id: maxEvent.id })).capacity,
      100,
    );
    await c.query("rollback to savepoint maximum_duration");
    const created = await rpc(0, "command_execute", { id: ticket.id, body });
    const id = created.id;
    assert.equal(
      (await rpc(0, "command_execute", { id: ticket.id, body })).id,
      id,
    );
    await c.query("savepoint active_limit");
    for (let i = 0; i < 2; i++) {
      const receipt = await rpc(0, "command_prepare", { kind: "event_create" });
      await rpc(0, "command_execute", {
        id: receipt.id,
        body: { ...body, title: "extra " + i },
      });
    }
    // Clear the minute-rate fixture so rejection proves the separate 3-active limit.
    await c.query(
      "delete from app_private.request_limits where account_id=$1 and kind='pin_create'",
      [users[0]],
    );
    const fourth = await rpc(0, "command_prepare", { kind: "event_create" });
    await denied(0, "command_execute", { id: fourth.id, body }, /rate_limited/);
    assert.equal(
      (
        await c.query(
          "select count(*) n from app_private.events where host_id=$1",
          [users[0]],
        )
      ).rows[0].n,
      "3",
    );
    await c.query("rollback to savepoint active_limit");
    assert.equal(
      (await rpc(1, "event_register", { id, joined: true, revision: 0 })).count,
      1,
    );
    assert.equal(
      (await rpc(1, "event_list", { street_id: street, mine_only: true })).items
        .length,
      1,
    );
    await denied(
      2,
      "event_register",
      { id, joined: true, revision: 0 },
      /conflict/,
    );
    await rpc(1, "event_register", { id, joined: false, revision: 1 });
    await denied(
      1,
      "event_register",
      { id, joined: true, revision: 0 },
      /conflict/,
    );
    await rpc(1, "event_register", { id, joined: true, revision: 2 });
    let e = await rpc(0, "event_get", { id });
    await rpc(0, "event_edit", {
      ...e,
      ends_at: new Date(Date.now() + 9000000).toISOString(),
    });
    assert.equal((await rpc(1, "notification_list")).items[0].kind, "changed");
    assert.equal((await rpc(2, "notification_list")).items.length, 0);
    assert.equal((await rpc(0, "event_roster", { id })).items.length, 1);
    await denied(1, "event_roster", { id }, /membership_required/);
    // Finish the host edit contract: capacity cannot undercut registrations,
    // stale revisions and non-host edits do not overwrite the current event.
    e = await rpc(0, "event_get", { id });
    await rpc(0, "event_edit", { ...e, capacity: 2 });
    await denied(0, "event_edit", { ...e, title: "古い編集" }, /conflict/);
    await rpc(2, "event_register", { id, joined: true, revision: 0 });
    e = await rpc(0, "event_get", { id });
    await denied(0, "event_edit", { ...e, capacity: 1 }, /invalid_input/);
    await denied(
      1,
      "event_edit",
      { ...e, title: "他人の編集" },
      /membership_required/,
    );
    assert.equal((await rpc(0, "event_get", { id })).capacity, 2);
    e = await rpc(0, "event_get", { id });
    await rpc(0, "event_cancel", { id, revision: e.revision });
    await rpc(0, "event_cancel", { id, revision: e.revision });
    assert.equal(
      (await rpc(1, "event_list", { street_id: street, mine_only: true })).items
        .length,
      0,
    );
    assert.equal((await rpc(1, "notification_list")).items[0].kind, "canceled");
    await denied(1, "event_get", { id }, /not_found/);
    await denied(0, "event_edit", { ...e, title: "中止後の再開" }, /not_found/);
    // Model an elapsed event inside this rolled-back fixture; no wall-clock wait.
    await c.query(
      "update app_private.events set canceled_at=null,starts_at=clock_timestamp()-interval '2 hours',ends_at=clock_timestamp()-interval '1 hour' where id=$1",
      [id],
    );
    await denied(
      1,
      "event_register",
      { id, joined: true, revision: 3 },
      /not_found/,
    );
    await denied(
      0,
      "event_edit",
      { ...e, ends_at: new Date(Date.now() + 3600000).toISOString() },
      /not_found/,
    );
  } finally {
    await c.query("rollback");
    await c.end();
  }
});
