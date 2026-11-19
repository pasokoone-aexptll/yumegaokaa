import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
const connectionString =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
test("電信PIN: 最後の1枠・日次3個・募集OFFと参加の競合を実接続で直列化", async () => {
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  const users = Array.from({ length: 3 }, () => randomUUID()),
    sessions = users.map(() => randomUUID()),
    street = randomUUID(),
    pin = randomUUID(),
    clients = [];
  async function rpc(client, i, op, p) {
    await client.query("begin");
    try {
      await client.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({
          sub: users[i],
          session_id: sessions[i],
          role: "authenticated",
        }),
      ]);
      await client.query("set local role authenticated");
      const r = (
        await client.query("select public.street_api($1,$2) r", [op, p])
      ).rows[0].r;
      await client.query("commit");
      return r;
    } catch (e) {
      await client.query("rollback");
      throw e;
    }
  }
  async function cmd(client, i, kind, body) {
    const ticket = await rpc(client, i, "command_prepare", { kind });
    return rpc(client, i, "command_execute", { id: ticket.id, body });
  }
  try {
    for (let i = 0; i < 3; i++) {
      await admin.query("insert into auth.users(id) values($1)", [users[i]]);
      await admin.query("insert into auth.sessions(id,user_id) values($1,$2)", [
        sessions[i],
        users[i],
      ]);
      await admin.query(
        "insert into app_private.members(account_id) values($1)",
        [users[i]],
      );
      const c = new pg.Client({ connectionString });
      await c.connect();
      await c.query("set statement_timeout='10s'");
      clients.push(c);
    }
    await admin.query(
      "insert into app_private.streets(id,name) values($1,'denshin concurrency')",
      [street],
    );
    await admin.query(
      "insert into app_private.areas values($1,1,extensions.st_buffer(extensions.st_transform(extensions.st_setsrid(extensions.st_makepoint(139.7109,35.7295),4326),'+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'),500))",
      [street],
    );
    await admin.query(
      "insert into app_private.denshin_pins(id,owner_id,street_id,body,longitude,latitude,recruiting,capacity,created_at,expires_at) values($1,$2,$3,'race',139.7109,35.7295,true,1,now(),now()+interval '24 hours')",
      [pin, users[0], street],
    );
    const tickets = await Promise.all(
      [1, 2].map((i) =>
        rpc(clients[i], i, "command_prepare", { kind: "denshin_attend" }),
      ),
    );
    await admin.query("begin");
    await admin.query(
      "select id from app_private.denshin_pins where id=$1 for update",
      [pin],
    );
    const race = Promise.allSettled(
      [1, 2].map((i, j) =>
        rpc(clients[i], i, "command_execute", {
          id: tickets[j].id,
          body: {
            id: pin,
            revision: 1,
            attendance_revision: 0,
            state: "planned",
          },
        }),
      ),
    );
    await admin.query("commit");
    const outcomes = await race;
    assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
    assert.match(
      outcomes.find((x) => x.status === "rejected").reason.message,
      /full/,
    );
    const winner = outcomes[0].status === "fulfilled" ? 1 : 2,
      loser = winner === 1 ? 2 : 1;
    await cmd(clients[winner], winner, "denshin_attend", {
      id: pin,
      revision: 1,
      attendance_revision: 1,
      state: "left",
    });
    await admin.query("begin");
    await admin.query(
      "select id from app_private.denshin_pins where id=$1 for update",
      [pin],
    );
    // prepare before holding a row lock to avoid unrelated member-lock deadlocks.
    await admin.query("commit");
    const closeTicket = await rpc(clients[0], 0, "command_prepare", {
        kind: "denshin_mode",
      }),
      joinTicket = await rpc(clients[loser], loser, "command_prepare", {
        kind: "denshin_attend",
      });
    await admin.query("begin");
    await admin.query(
      "select id from app_private.denshin_pins where id=$1 for update",
      [pin],
    );
    const closeRace = Promise.allSettled([
      rpc(clients[0], 0, "command_execute", {
        id: closeTicket.id,
        body: { id: pin, revision: 1, recruiting: false, confirm_close: true },
      }),
      rpc(clients[loser], loser, "command_execute", {
        id: joinTicket.id,
        body: {
          id: pin,
          revision: 1,
          attendance_revision: 0,
          state: "planned",
        },
      }),
    ]);
    await admin.query("commit");
    const closed = await closeRace;
    assert.equal(closed[0].status, "fulfilled");
    const final = await rpc(clients[0], 0, "denshin_get", { id: pin });
    assert.equal(final.count, 0);
    assert.equal(final.recruiting, false);
    // Four requests by the same account from independent sessions share one daily budget.
    const extra = new pg.Client({ connectionString });
    await extra.connect();
    clients.push(extra);
    const bodies = {
      street_id: street,
      body: "daily",
      longitude: 139.7109,
      latitude: 35.7295,
      recruiting: false,
      capacity: null,
    };
    // Remove the seeded active PIN from this count; preserve the quota test's fixture.
    await cmd(clients[0], 0, "denshin_delete", { id: pin, revision: 2 });
    for (let i = 0; i < 2; i++)
      await cmd(clients[0], 0, "denshin_create", bodies);
    const a = await rpc(clients[0], 0, "command_prepare", {
        kind: "denshin_create",
      }),
      b = await rpc(extra, 0, "command_prepare", { kind: "denshin_create" });
    const quota = await Promise.allSettled([
      rpc(clients[0], 0, "command_execute", { id: a.id, body: bodies }),
      rpc(extra, 0, "command_execute", { id: b.id, body: bodies }),
    ]);
    assert.equal(quota.filter((x) => x.status === "fulfilled").length, 1);
    assert.match(
      quota.find((x) => x.status === "rejected").reason.message,
      /daily_limit/,
    );
  } finally {
    await admin.query("rollback");
    await Promise.all(clients.map((c) => c.end()));
    await admin.query(
      "delete from app_private.denshin_pins where street_id=$1",
      [street],
    );
    await admin.query(
      "delete from app_private.denshin_daily_usage where account_id=any($1::uuid[])",
      [users],
    );
    await admin.query(
      "delete from app_private.commands where owner_id=any($1::uuid[])",
      [users],
    );
    await admin.query("delete from app_private.areas where street_id=$1", [
      street,
    ]);
    await admin.query("delete from app_private.streets where id=$1", [street]);
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
