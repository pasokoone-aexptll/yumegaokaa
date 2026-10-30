import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { simulateNotifications } from "../scripts/lib/notification-delivery.mjs";

test("通知ワーカー: 宛先・版・期限再確認、再試行、疑似配信と実配信の分離", async () => {
  const db = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await db.connect();
  await db.query("begin");
  try {
    // Isolate claim ordering without consuming existing local notifications.
    await db.query(
      "update app_private.notification_outbox set next_attempt_at=clock_timestamp()+interval '1 day'",
    );
    const uid = randomUUID(),
      sid = randomUUID(),
      street = randomUUID();
    await db.query("insert into auth.users(id) values($1)", [uid]);
    await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [
      sid,
      uid,
    ]);
    await db.query("insert into app_private.members(account_id) values($1)", [
      uid,
    ]);
    await db.query(
      "insert into app_private.streets(id,name) values($1,'delivery test')",
      [street],
    );
    async function call(role, endpoint, operation, payload = {}) {
      await db.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({ role, sub: uid, session_id: sid }),
      ]);
      await db.query(`set local role ${role}`);
      const result = (
        await db.query(`select public.${endpoint}($1,$2) result`, [
          operation,
          payload,
        ])
      ).rows[0].result;
      await db.query("reset role");
      return result;
    }
    const rpc = (op, data) =>
      call("service_role", "notification_delivery", op, data);
    const api = (op, data) => call("authenticated", "street_api", op, data);
    async function fixture() {
      const event = randomUUID(),
        notice = randomUUID();
      await db.query(
        "insert into app_private.events(id,host_id,street_id,title,longitude,latitude,starts_at,ends_at,revision) values($1,$2,$3,'notice',0,0,clock_timestamp()+interval '1 hour',clock_timestamp()+interval '2 hours',2)",
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
        "insert into app_private.notification_outbox(notification_id) values($1)",
        [notice],
      );
      return { event, notice };
    }
    const first = await fixture();
    const claimed = await rpc("claim");
    assert.equal(claimed.id, first.notice);
    assert.equal("title" in claimed, false);
    assert.equal("latitude" in claimed, false);
    assert.deepEqual(await rpc("claim"), {});
    await rpc("retry", claimed);
    assert.equal((await rpc("simulate", claimed)).active, false);
    await db.query(
      "update app_private.notification_outbox set next_attempt_at=clock_timestamp() where notification_id=$1",
      [first.notice],
    );
    const retried = await rpc("claim");
    assert.notEqual(retried.lease, claimed.lease);
    assert.equal((await rpc("simulate", claimed)).active, false);
    assert.equal((await rpc("simulate", retried)).simulated, true);
    const saved = (
      await db.query(
        "select simulated_at is not null simulated,delivered_at,attempts from app_private.notification_outbox where notification_id=$1",
        [first.notice],
      )
    ).rows[0];
    assert.deepEqual(saved, {
      simulated: true,
      delivered_at: null,
      attempts: 2,
    });

    const canceledParticipation = await fixture();
    const beforeCancel = await rpc("claim");
    await api("event_register", {
      id: canceledParticipation.event,
      joined: false,
      revision: 1,
    });
    assert.equal((await rpc("recheck", beforeCancel)).active, false);
    assert.equal((await rpc("simulate", beforeCancel)).active, false);

    const canceledEvent = await fixture();
    const oldChange = await rpc("claim");
    await api("event_cancel", { id: canceledEvent.event, revision: 2 });
    assert.equal((await rpc("simulate", oldChange)).active, false);
    const cancellation = await rpc("claim");
    assert.equal(cancellation.kind, "canceled");
    await db.query(
      "update app_private.events set canceled_at=clock_timestamp()-interval '24 hours' where id=$1",
      [canceledEvent.event],
    );
    assert.equal((await rpc("simulate", cancellation)).active, false);

    const outdated = await fixture();
    await db.query(
      "insert into app_private.notifications(event_id,event_revision,recipient,kind) values($1,3,$2,'changed')",
      [outdated.event, uid],
    );
    assert.deepEqual(await rpc("claim"), {});
    assert.equal(
      (
        await db.query(
          "select count(*) from app_private.notification_outbox where notification_id=$1",
          [outdated.notice],
        )
      ).rows[0].count,
      "0",
    );

    const finished = await fixture();
    const beforeFinish = await rpc("claim");
    await db.query(
      "update app_private.events set starts_at=clock_timestamp()-interval '2 hours',ends_at=clock_timestamp()-interval '1 hour' where id=$1",
      [finished.event],
    );
    assert.equal((await rpc("recheck", beforeFinish)).active, false);

    const last = await fixture();
    let failOnce = true;
    assert.equal(
      await simulateNotifications(async (op, body) => {
        if (op === "recheck" && failOnce) {
          failOnce = false;
          throw Error("transport interrupted");
        }
        return rpc(op, body);
      }),
      0,
    );
    await db.query(
      "update app_private.notification_outbox set next_attempt_at=clock_timestamp() where notification_id=$1",
      [last.notice],
    );
    assert.equal(await simulateNotifications(rpc), 1);
    assert.equal(await simulateNotifications(rpc), 0);

    const removed = await fixture();
    const beforeRemoval = await rpc("claim");
    await db.query(
      "delete from app_private.registrations where event_id=$1 and account_id=$2",
      [removed.event, uid],
    );
    assert.equal((await rpc("simulate", beforeRemoval)).active, false);

    const abandoned = await fixture();
    const expiredLease = await rpc("claim");
    await db.query(
      "update app_private.notification_outbox set lease_until=clock_timestamp()-interval '1 second' where notification_id=$1",
      [abandoned.notice],
    );
    const recoveredLease = await rpc("claim");
    assert.equal(recoveredLease.id, abandoned.notice);
    assert.notEqual(recoveredLease.lease, expiredLease.lease);
    assert.equal((await rpc("simulate", expiredLease)).active, false);
    assert.equal((await rpc("simulate", recoveredLease)).simulated, true);

    await fixture();
    const beforeSuspension = await rpc("claim");
    await db.query(
      "update app_private.members set active=false where account_id=$1",
      [uid],
    );
    assert.equal((await rpc("simulate", beforeSuspension)).active, false);
    assert.deepEqual(await rpc("claim"), {});

    await db.query("savepoint unauthorized");
    await assert.rejects(
      () => call("authenticated", "notification_delivery", "claim"),
      /permission denied/,
    );
    await db.query("rollback to savepoint unauthorized");
  } finally {
    await db.query("rollback");
    await db.end();
  }
});
