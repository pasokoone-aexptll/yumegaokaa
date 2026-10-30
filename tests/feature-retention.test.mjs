import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";

test("清掃統合: イベント関連24h・チャット30日・通報180/30日・運営90日・下書き7日", async () => {
  const db = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await db.connect();
  await db.query("begin");
  try {
    const uid = randomUUID(),
      street = randomUUID();
    await db.query("insert into auth.users(id) values($1)", [uid]);
    await db.query("insert into app_private.members(account_id) values($1)", [
      uid,
    ]);
    await db.query(
      "insert into app_private.streets(id,name) values($1,'retention integration')",
      [street],
    );
    const expected = [];
    async function remember(table, id, keep) {
      expected.push({ table, id, keep });
    }
    for (const canceled of [false, true]) {
      for (const old of [false, true]) {
        const id = randomUUID(),
          notice = randomUUID();
        const hours = old ? 25 : 23;
        await db.query(
          `insert into app_private.events(id,host_id,street_id,title,longitude,latitude,starts_at,ends_at,canceled_at)
          values($1,$2,$3,'retention',0,0,
            clock_timestamp()+case when $4 then interval '1 hour' else -make_interval(hours=>$5::int+1) end,
            clock_timestamp()+case when $4 then interval '2 hours' else -make_interval(hours=>$5::int) end,
            case when $4 then clock_timestamp()-make_interval(hours=>$5::int) end)`,
          [id, uid, street, canceled, hours],
        );
        await db.query(
          "insert into app_private.registrations(event_id,account_id,joined) values($1,$2,true)",
          [id, uid],
        );
        await db.query(
          "insert into app_private.notifications(id,event_id,event_revision,recipient,kind) values($1,$2,1,$3,$4)",
          [notice, id, uid, canceled ? "canceled" : "changed"],
        );
        await db.query(
          "insert into app_private.notification_outbox(notification_id) values($1)",
          [notice],
        );
        expected.push({ table: "events", id, keep: !old });
        expected.push({
          table: "registrations",
          column: "event_id",
          id,
          keep: !old,
        });
        expected.push({ table: "notifications", id: notice, keep: !old });
        expected.push({
          table: "notification_outbox",
          column: "notification_id",
          id: notice,
          keep: !old,
        });
      }
    }
    for (const days of [29, 31]) {
      const id = randomUUID();
      await db.query(
        "insert into app_private.messages(id,street_id,author_id,body,created_at) values($1,$2,$3,'retention',clock_timestamp()-make_interval(days=>$4))",
        [id, street, uid, days],
      );
      await remember("messages", id, days < 30);
    }
    for (const { days, resolved } of [
      { days: 100, resolved: false },
      { days: 181, resolved: false },
      { days: 29, resolved: true },
      { days: 31, resolved: true },
    ]) {
      const id = randomUUID();
      await db.query(
        `insert into app_private.reports(id,reporter,target_kind,target_id,subject_id,reason,description,evidence,created_at,resolved_at)
        values($1,$2,'message',$3,$2,'spam','','{}',clock_timestamp()-make_interval(days=>$4),case when $5 then clock_timestamp()-make_interval(days=>$4) end)`,
        [id, uid, randomUUID(), days, resolved],
      );
      await remember("reports", id, resolved ? days < 30 : days < 180);
    }
    for (const days of [89, 91]) {
      const id = randomUUID();
      await db.query(
        "insert into app_private.operator_audit(id,actor,action,created_at) values($1,$2,'retention',clock_timestamp()-make_interval(days=>$3))",
        [id, uid, days],
      );
      await remember("operator_audit", id, days < 90);
    }
    for (const days of [6, 8]) {
      const id = randomUUID(),
        tag = randomUUID();
      await db.query(
        "insert into app_private.tags(id,street_id,active) values($1,$2,false)",
        [tag, street],
      );
      await db.query(
        "insert into app_private.sticker_drafts(id,tag_id,street_id,creator,title,longitude,latitude,tag_revision,updated_at) values($1,$2,$3,$4,'retention',0,0,1,clock_timestamp()-make_interval(days=>$5))",
        [id, tag, street, uid, days],
      );
      await remember("sticker_drafts", id, days < 7);
    }
    for (const hours of [23, 25]) {
      const id = randomUUID();
      await db.query(
        "insert into app_private.commands(id,owner_id,kind,accept_until) values($1,$2,'chat_send',clock_timestamp()-make_interval(hours=>$3))",
        [id, uid, hours],
      );
      await remember("commands", id, hours < 24);
    }
    for (const days of [6, 8]) {
      await db.query(
        "insert into app_private.request_limits(account_id,kind,at) values($1,$2,clock_timestamp()-make_interval(days=>$3))",
        [uid, `retention-${days}`, days],
      );
    }
    // Use the actual worker entry point, including its composed cleanup functions.
    await db.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ role: "service_role" }),
    ]);
    await db.query("set local role service_role");
    await db.query("select public.maintenance_jobs('cleanup')");
    await db.query("reset role");
    assert.deepEqual(
      (
        await db.query(
          "select kind from app_private.request_limits where account_id=$1 order by kind",
          [uid],
        )
      ).rows.map((r) => r.kind),
      ["retention-6"],
    );
    for (const row of expected) {
      const { rows } = await db.query(
        `select count(*)::int count from app_private.${row.table} where ${row.column ?? "id"}=$1`,
        [row.id],
      );
      assert.equal(
        rows[0].count,
        row.keep ? 1 : 0,
        `${row.table}: ${row.keep ? "retain" : "delete"}`,
      );
    }
  } finally {
    await db.query("rollback");
    await db.end();
  }
});
