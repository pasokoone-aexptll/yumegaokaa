import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
test("統合: 入街→募集→別人一覧→編集→退出→再送で復活しない", async () => {
  const c = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await c.connect();
  await c.query("begin");
  try {
    const users = [randomUUID(), randomUUID()],
      sessions = users.map(() => randomUUID()),
      street = randomUUID(),
      tag = randomUUID();
    for (let i = 0; i < 2; i++) {
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
      "insert into app_private.streets(id,name) values($1,'recruitment integration')",
      [street],
    );
    await c.query(
      "insert into app_private.areas values($1,1,extensions.st_buffer(extensions.st_transform(extensions.st_makepoint(139.7109,35.7295),'+proj=longlat +datum=WGS84 +no_defs','+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'),500))",
      [street],
    );
    await c.query(
      "insert into app_private.tags(id,street_id,active) values($1,$2,true)",
      [tag, street],
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
    async function denied(i, op, p, pattern) {
      await c.query("savepoint refusal");
      await assert.rejects(() => rpc(i, op, p), pattern);
      await c.query("rollback to savepoint refusal");
    }
    const attempt = await rpc(0, "prepare_checkin", {
      tag_id: tag,
      payload_version: 1,
    });
    const visit = await rpc(0, "commit_checkin", {
      attempt_id: attempt.attempt_id,
    });
    const ticket = await rpc(0, "command_prepare", {
        kind: "recruitment_create",
      }),
      body = {
        visit_id: visit.visit.visit_id,
        title: "駅前で休憩",
        longitude: 139.7109,
        latitude: 35.7295,
        accuracy: 10,
        observed_at: new Date().toISOString(),
      };
    const invalidTicket = await rpc(0, "command_prepare", {
      kind: "recruitment_create",
    });
    for (const patch of [
      { accuracy: 51 },
      { observed_at: new Date(Date.now() - 121000).toISOString() },
      { longitude: 140, latitude: 36 },
      { title: " " },
      { title: "x".repeat(51) },
    ])
      await denied(
        0,
        "command_execute",
        { id: invalidTicket.id, body: { ...body, ...patch } },
        /invalid_input/,
      );
    await denied(
      1,
      "command_execute",
      { id: invalidTicket.id, body },
      /not_found|unauthorized|membership_required/,
    );
    const pin = await rpc(0, "command_execute", { id: ticket.id, body });
    const before = (await rpc(1, "recruitment_list", { street_id: street }))
      .items;
    assert.equal(before.length, 1);
    const countBefore = (
      await rpc(1, "get_presence_snapshot", { street_id: street })
    ).checked_in_count;
    await rpc(1, "block_set", { account_id: users[0], blocked: true });
    assert.equal(
      (await rpc(1, "recruitment_list", { street_id: street })).items.length,
      0,
    );
    await denied(1, "recruitment_get", { id: pin.id }, /not_found/);
    assert.equal(
      (await rpc(1, "get_presence_snapshot", { street_id: street }))
        .checked_in_count,
      countBefore,
    );
    await rpc(1, "block_set", { account_id: users[0], blocked: false });
    assert.equal((await rpc(1, "recruitment_get", { id: pin.id })).id, pin.id);
    assert.equal(
      (await rpc(1, "recruitment_list", { street_id: street })).items.length,
      1,
    );

    assert.equal(
      Date.parse(before[0].expires_at) -
        (
          await c.query(
            "select created_at from app_private.recruitments where id=$1",
            [pin.id],
          )
        ).rows[0].created_at.getTime(),
      1200000,
    );
    const duplicate = await rpc(0, "command_prepare", {
      kind: "recruitment_create",
    });
    await denied(0, "command_execute", { id: duplicate.id, body }, /conflict/);
    await denied(
      1,
      "recruitment_edit",
      { id: pin.id, revision: before[0].revision, title: "other" },
      /membership_required/,
    );
    await denied(1, "recruitment_end", { id: pin.id }, /membership_required/);
    await rpc(0, "recruitment_edit", {
      id: pin.id,
      revision: before[0].revision,
      title: "少し話したい",
    });
    const after = await rpc(0, "recruitment_get", { id: pin.id });
    assert.equal(after.expires_at, before[0].expires_at);
    assert.equal(after.longitude, body.longitude);
    assert.equal(after.latitude, body.latitude);
    await denied(
      0,
      "recruitment_edit",
      { id: pin.id, revision: before[0].revision, title: "stale" },
      /conflict/,
    );
    await c.query("savepoint expiry");
    await c.query(
      "update app_private.recruitments set expires_at=clock_timestamp()-interval '1 second' where id=$1",
      [pin.id],
    );
    assert.equal(
      (await rpc(1, "recruitment_list", { street_id: street })).items.length,
      0,
    );
    await denied(
      0,
      "recruitment_edit",
      { id: pin.id, revision: after.revision, title: "expired" },
      /inactive_visit/,
    );
    await c.query("rollback to savepoint expiry");
    await c.query("savepoint manual");
    await rpc(0, "recruitment_end", { id: pin.id });
    assert.equal(
      (await rpc(1, "recruitment_list", { street_id: street })).items.length,
      0,
    );
    await rpc(0, "command_execute", { id: ticket.id, body });
    assert.equal(
      (await rpc(1, "recruitment_list", { street_id: street })).items.length,
      0,
    );
    await c.query("rollback to savepoint manual");
    await c.query("savepoint rate");
    await rpc(0, "recruitment_end", { id: pin.id });
    await c.query(
      "insert into app_private.request_limits values($1,'pin_create',clock_timestamp()),($1,'pin_create',clock_timestamp())",
      [users[0]],
    );
    await denied(
      0,
      "command_execute",
      { id: duplicate.id, body },
      /rate_limited/,
    );
    await c.query("rollback to savepoint rate");
    await rpc(0, "end_visit", {
      visit_id: visit.visit.visit_id,
      reason: "manual",
    });
    await rpc(0, "command_execute", { id: ticket.id, body });
    assert.equal(
      (await rpc(1, "recruitment_list", { street_id: street })).items.length,
      0,
    );
  } finally {
    await c.query("rollback");
    await c.end();
  }
});
