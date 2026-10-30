import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
const connectionString =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
test("two delivery workers cannot claim or finalize the same notification; canceled recipient cannot retry", async () => {
  const clients = Array.from(
    { length: 3 },
    () => new pg.Client({ connectionString }),
  );
  await Promise.all(clients.map((c) => c.connect()));
  const [db, a, b] = clients,
    uid = randomUUID(),
    street = randomUUID(),
    event = randomUUID(),
    notice = randomUUID();
  async function rpc(c, op, p = {}) {
    return (
      await c.query("select public.notification_delivery($1,$2) r", [op, p])
    ).rows[0].r;
  }
  try {
    await db.query("insert into auth.users(id) values($1)", [uid]);
    await db.query("insert into app_private.members(account_id) values($1)", [
      uid,
    ]);
    await db.query(
      "insert into app_private.streets(id,name) values($1,'concurrency fixture')",
      [street],
    );
    await db.query(
      "insert into app_private.events(id,host_id,street_id,title,longitude,latitude,starts_at,ends_at,revision) values($1,$2,$3,'fixture',0,0,clock_timestamp()+interval '1 hour',clock_timestamp()+interval '2 hours',2)",
      [event, uid, street],
    );
    await db.query(
      "insert into app_private.registrations(event_id,account_id,joined) values($1,$2,true)",
      [event, uid],
    );
    await db.query(
      "insert into app_private.notifications(id,event_id,event_revision,recipient,kind) values($1,$2,2,$3,'changed')",
      [notice, event, uid],
    );
    await db.query(
      "insert into app_private.notification_outbox(notification_id,next_attempt_at) values($1,'1900-01-01')",
      [notice],
    );
    for (const c of [a, b])
      await c.query(
        "select set_config('request.jwt.claims','{\"role\":\"service_role\"}',false)",
      );
    await a.query("begin");
    const lease = await rpc(a, "claim");
    assert.equal(lease.id, notice);
    // A holds the row lock: B must skip it. Any unrelated claim is rolled back.
    await b.query("begin");
    await b.query("set local statement_timeout='3s'");
    assert.notEqual((await rpc(b, "claim")).id, notice);
    await b.query("rollback");
    await a.query("commit");
    const outcomes = await Promise.all([
      rpc(a, "simulate", lease),
      rpc(b, "simulate", lease),
    ]);
    assert.equal(outcomes.filter((x) => x.simulated).length, 1);
    assert.equal(outcomes.filter((x) => x.active === false).length, 1);
    // Recheck succeeded, then participation is canceled before finalization/retry.
    await db.query(
      "update app_private.notification_outbox set simulated_at=null,lease=$2,lease_until=clock_timestamp()+interval '1 minute' where notification_id=$1",
      [notice, lease.lease],
    );
    assert.equal((await rpc(a, "recheck", lease)).active, true);
    await db.query(
      "update app_private.registrations set joined=false where event_id=$1",
      [event],
    );
    assert.equal((await rpc(a, "simulate", lease)).active, false);
    assert.equal((await rpc(b, "retry", lease)).active, false);
    assert.equal(
      (
        await db.query(
          "select count(*) n from app_private.notification_outbox where notification_id=$1",
          [notice],
        )
      ).rows[0].n,
      "0",
    );
  } finally {
    await a.query("rollback");
    await b.query("rollback");
    await db.query(
      "delete from app_private.notification_outbox where notification_id=$1",
      [notice],
    );
    await db.query("delete from app_private.notifications where id=$1", [
      notice,
    ]);
    await db.query("delete from app_private.registrations where event_id=$1", [
      event,
    ]);
    await db.query("delete from app_private.events where id=$1", [event]);
    await db.query("delete from app_private.streets where id=$1", [street]);
    await db.query("delete from app_private.members where account_id=$1", [
      uid,
    ]);
    await db.query("delete from auth.users where id=$1", [uid]);
    await Promise.all(clients.map((c) => c.end()));
  }
});
