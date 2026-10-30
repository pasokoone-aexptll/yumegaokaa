import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";
const url =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const pool = new pg.Pool({ connectionString: url });
async function sql(q, p = []) {
  return (await pool.query(q, p)).rows;
}
async function identity() {
  const u = randomUUID(),
    s = randomUUID();
  identities.push(u);
  await sql("insert into auth.users(id) values($1)", [u]);
  await sql("insert into auth.sessions(id,user_id) values($1,$2)", [s, u]);
  await sql("insert into app_private.members(account_id) values($1)", [u]);
  return { u, s };
}
async function rpc(w, op, p = {}) {
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: w.u, session_id: w.s, role: "authenticated" }),
    ]);
    await c.query("set local role authenticated");
    const r = await c.query("select public.street_api($1,$2) result", [op, p]);
    await c.query("commit");
    return r.rows[0].result;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}
const street = randomUUID(),
  tag = randomUUID(),
  identities = [];
async function begin(w) {
  const a = await rpc(w, "prepare_checkin", {
    tag_id: tag,
    payload_version: 1,
  });
  return {
    a,
    ...(await rpc(w, "commit_checkin", { attempt_id: a.attempt_id })),
  };
}
function obs(v, seq = 1, cell = "0:0", extra = {}) {
  return {
    visit_id: v.visit_id,
    seq: String(seq),
    area_version: "1",
    grid_version: "1",
    verdict: "inside",
    cell_id: cell,
    horizontal_accuracy_m: 10,
    observed_at: new Date(Date.now() - 1000).toISOString(),
    ...extra,
  };
}
test("実DB: 滞在の権限・競合・期限・集約", async (t) => {
  await sql("insert into app_private.streets(id,name) values($1,'test')", [
    street,
  ]);
  await sql(
    "insert into app_private.areas values($1,1,extensions.st_makeenvelope(-1000,-1000,1000,1000))",
    [street],
  );
  await sql(
    "insert into app_private.tags(id,street_id,active) values($1,$2,true)",
    [tag, street],
  );
  await t.test("T01 未会員を拒否し未入街会員は閲覧可", async () => {
    const w = await identity();
    assert.equal(
      (await rpc(w, "get_presence_snapshot", { street_id: street }))
        .checked_in_count,
      0,
    );
    await sql(
      "update app_private.members set active=false where account_id=$1",
      [w.u],
    );
    await assert.rejects(rpc(w, "time"), /membership_required/);
  });
  await t.test("T03 同時commitはvisitと入街ログを重複しない", async () => {
    const w = await identity();
    const a = await rpc(w, "prepare_checkin", {
      tag_id: tag,
      payload_version: 1,
    });
    const r = await Promise.all([
      rpc(w, "commit_checkin", { attempt_id: a.attempt_id }),
      rpc(w, "commit_checkin", { attempt_id: a.attempt_id }),
    ]);
    assert.equal(r[0].visit.visit_id, r[1].visit.visit_id);
    assert.equal(r[0].visit.expires_at, r[1].visit.expires_at);
    assert.equal(
      (
        await sql(
          "select count(*) from app_private.arrival_logs where account_id=$1",
          [w.u],
        )
      )[0].count,
      "1",
    );
  });
  await t.test("T04 取消の両順序と再利用取消", async () => {
    const w = await identity();
    const a = await rpc(w, "prepare_checkin", {
      tag_id: tag,
      payload_version: 1,
    });
    await rpc(w, "cancel_checkin", { attempt_id: a.attempt_id });
    assert.equal(
      (await rpc(w, "commit_checkin", { attempt_id: a.attempt_id })).visit,
      null,
    );
    const b = await begin(w);
    await rpc(w, "cancel_checkin", { attempt_id: b.a.attempt_id });
    assert.equal((await rpc(w, "get_my_visit")).visit, null);
    const c = await begin(w),
      d = await begin(w);
    assert.equal(d.result, "reused");
    await rpc(w, "cancel_checkin", { attempt_id: d.a.attempt_id });
    assert.equal(
      (await rpc(w, "get_my_visit")).visit.visit_id,
      c.visit.visit_id,
    );
  });
  await t.test("T05 旧区画置換、逆順再送は延長なし", async () => {
    const w = await identity(),
      { visit: v } = await begin(w);
    await rpc(
      w,
      "observe_visit",
      obs(v, 1, "0:0", {
        observed_at: new Date(Date.now() - 2000).toISOString(),
      }),
    );
    const b = await rpc(w, "observe_visit", obs(v, 2, "1:0"));
    const old = await rpc(w, "observe_visit", obs(v));
    assert.equal(old.result, "ignored");
    assert.equal(old.visit.expires_at, b.visit.expires_at);
    const rows = await sql(
      "select cell_id from app_private.presence where visit_id=$1",
      [v.visit_id],
    );
    assert.deepEqual(rows, [{ cell_id: "1:0" }]);
  });
  await t.test("T06 古い/未来/不正精度/期限切れを拒否", async () => {
    const w = await identity(),
      { visit: v } = await begin(w);
    for (const extra of [
      { horizontal_accuracy_m: 50.1 },
      { observed_at: new Date(Date.now() - 121000).toISOString() },
      { observed_at: new Date(Date.now() + 6000).toISOString() },
    ])
      await assert.rejects(rpc(w, "observe_visit", obs(v, 1, "0:0", extra)));
    await rpc(
      w,
      "observe_visit",
      obs(v, 1, "0:0", { horizontal_accuracy_m: 50 }),
    );
    await sql(
      "update app_private.visits set expires_at=now()-interval '1 second' where id=$1",
      [v.visit_id],
    );
    await assert.rejects(rpc(w, "observe_visit", obs(v, 2)), /inactive_visit/);
  });
  await t.test("T10 更新と退出の競合で気配復活なし", async () => {
    const w = await identity(),
      { visit: v } = await begin(w);
    await Promise.allSettled([
      rpc(w, "observe_visit", obs(v)),
      rpc(w, "end_visit", { visit_id: v.visit_id, reason: "manual" }),
    ]);
    assert.equal(
      (
        await sql(
          "select count(*) from app_private.presence where visit_id=$1",
          [v.visit_id],
        )
      )[0].count,
      "0",
    );
    await assert.rejects(rpc(w, "observe_visit", obs(v, 2)), /inactive_visit/);
  });
  await t.test("T12 別sessionは更新不可、NFCで置換", async () => {
    const w = await identity(),
      { visit: v } = await begin(w),
      other = { u: w.u, s: randomUUID() };
    await sql("insert into auth.sessions(id,user_id) values($1,$2)", [
      other.s,
      w.u,
    ]);
    assert.equal((await rpc(other, "get_my_visit")).visit.can_update, false);
    await assert.rejects(rpc(other, "observe_visit", obs(v)), /wrong_writer/);
    const n = await begin(other);
    assert.notEqual(n.visit.visit_id, v.visit_id);
    await assert.rejects(rpc(w, "observe_visit", obs(v)), /inactive_visit/);
  });
  await t.test("T14 範囲変更だけで退出せず旧版更新拒否", async () => {
    const w = await identity(),
      { visit: v } = await begin(w);
    await sql(
      "insert into app_private.areas values($1,2,extensions.st_makeenvelope(-1000,-1000,1000,1000))",
      [street],
    );
    await sql("update app_private.streets set area_version=2 where id=$1", [
      street,
    ]);
    await assert.rejects(rpc(w, "observe_visit", obs(v)), /area_changed/);
    assert.equal((await rpc(w, "get_my_visit")).visit.state, "active");
    const latest = await rpc(w, "get_street_config", { street_id: street });
    assert.equal(String(latest.area_version), "2");
    assert.equal(
      (
        await rpc(
          w,
          "observe_visit",
          obs(v, 1, "0:0", {
            area_version: String(latest.area_version),
          }),
        )
      ).result,
      "accepted",
    );
    await sql("update app_private.streets set area_version=1 where id=$1", [
      street,
    ]);
  });
  await t.test("T07/T08 公開集約は個人IDなし、有効期限別", async () => {
    const w = await identity();
    const r = await rpc(w, "get_presence_snapshot", { street_id: street });
    assert.ok(r.presence_count > 0);
    assert.ok(r.cells[0].expiry_groups);
    assert.equal(JSON.stringify(r).includes("visit_id"), false);
    assert.equal(JSON.stringify(r).includes("account_id"), false);
  });
  await t.test("T02 期限切れ試行・設置版変更・無効タグ", async () => {
    const w = await identity();
    const a = await rpc(w, "prepare_checkin", {
      tag_id: tag,
      payload_version: 1,
    });
    await sql(
      "update app_private.attempts set accept_until=now()-interval '1 second' where id=$1",
      [a.attempt_id],
    );
    await assert.rejects(
      rpc(w, "commit_checkin", { attempt_id: a.attempt_id }),
      /attempt_expired/,
    );
    const b = await rpc(w, "prepare_checkin", {
      tag_id: tag,
      payload_version: 1,
    });
    await sql("update app_private.tags set revision=revision+1 where id=$1", [
      tag,
    ]);
    await assert.rejects(
      rpc(w, "commit_checkin", { attempt_id: b.attempt_id }),
      /tag_changed/,
    );
    await assert.rejects(
      rpc(w, "prepare_checkin", { tag_id: tag }),
      /inactive_tag/,
    );
  });
  await t.test("T13 掃除後も新鮮な気配を保持、期限切れだけ削除", async () => {
    const w = await identity(),
      { visit: v } = await begin(w);
    await rpc(w, "observe_visit", obs(v));
    await sql("select app_private.cleanup()");
    assert.equal(
      (
        await sql(
          "select count(*) from app_private.presence where visit_id=$1",
          [v.visit_id],
        )
      )[0].count,
      "1",
    );
    await sql(
      "update app_private.presence set observed_at=now()-interval '11 minutes',expires_at=now()-interval '1 minute' where visit_id=$1",
      [v.visit_id],
    );
    await sql("select app_private.cleanup()");
    assert.equal(
      (
        await sql(
          "select count(*) from app_private.presence where visit_id=$1",
          [v.visit_id],
        )
      )[0].count,
      "0",
    );
    assert.equal((await rpc(w, "get_my_visit")).visit.state, "active");
  });
  await t.test("R18 利用停止後の解除で滞在は復活しない", async () => {
    const w = await identity();
    await begin(w);
    await sql(
      "update app_private.members set active=false where account_id=$1",
      [w.u],
    );
    await sql(
      "update app_private.members set active=true where account_id=$1",
      [w.u],
    );
    assert.equal((await rpc(w, "get_my_visit")).visit, null);
  });
  await t.test("T03 別試行の同時確定は一方のみ作成", async () => {
    const w = await identity();
    const a = await rpc(w, "prepare_checkin", {
      tag_id: tag,
      payload_version: 1,
    });
    const b = await rpc(w, "prepare_checkin", {
      tag_id: tag,
      payload_version: 1,
    });
    const results = await Promise.allSettled(
      [a, b].map((x) => rpc(w, "commit_checkin", { attempt_id: x.attempt_id })),
    );
    assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
    assert.match(
      String(results.find((x) => x.status === "rejected").reason),
      /conflict/,
    );
    assert.equal(
      (
        await sql(
          "select count(*) from app_private.visits where account_id=$1",
          [w.u],
        )
      )[0].count,
      "1",
    );
  });
  await t.test("T05 古い街外報告と終了再送は新状態を変更しない", async () => {
    const w = await identity(),
      { visit: v } = await begin(w);
    const fresh = await rpc(w, "observe_visit", obs(v, 2));
    const old = await rpc(
      w,
      "observe_visit",
      obs(v, 1, "0:0", { verdict: "outside" }),
    );
    assert.equal(old.result, "ignored");
    assert.equal(old.visit.expires_at, fresh.visit.expires_at);
    const ended = await rpc(w, "end_visit", {
      visit_id: v.visit_id,
      reason: "manual",
    });
    const again = await rpc(w, "end_visit", {
      visit_id: v.visit_id,
      reason: "manual",
    });
    assert.equal(again.visit.revision, ended.visit.revision);
  });
  await t.test("T13 清掃が親ロック待ちの間に更新された行を保持", async () => {
    const w = await identity(),
      { visit: v } = await begin(w);
    await rpc(
      w,
      "observe_visit",
      obs(v, 1, "0:0", {
        observed_at: new Date(Date.now() - 3000).toISOString(),
      }),
    );
    await sql(
      "update app_private.presence set observed_at=now()-interval '11 minutes',expires_at=now()-interval '1 minute' where visit_id=$1",
      [v.visit_id],
    );
    const c = await pool.connect();
    let cleanup;
    try {
      await c.query("begin");
      await c.query(
        "select 1 from app_private.members where account_id=$1 for update",
        [w.u],
      );
      cleanup = sql("select app_private.cleanup()");
      await c.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({ sub: w.u, session_id: w.s, role: "authenticated" }),
      ]);
      await c.query("select public.street_api('observe_visit',$1)", [
        obs(v, 2),
      ]);
      await c.query("commit");
      await cleanup;
      assert.equal(
        (
          await sql(
            "select count(*) from app_private.presence where visit_id=$1",
            [v.visit_id],
          )
        )[0].count,
        "1",
      );
    } finally {
      await c.query("rollback");
      c.release();
      if (cleanup) await cleanup;
    }
  });
  await t.test("T08 清掃前でも期限切れ気配は公開集約から外れる", async () => {
    const w = await identity(),
      { visit: v } = await begin(w);
    await rpc(w, "observe_visit", obs(v, 1, "-9:-9"));
    await sql(
      "update app_private.presence set observed_at=now()-interval '10 minutes',expires_at=now() where visit_id=$1",
      [v.visit_id],
    );
    const snapshot = await rpc(w, "get_presence_snapshot", {
      street_id: street,
    });
    assert.equal(
      snapshot.cells.some((c) => c.cell_id === "-9:-9"),
      false,
    );
    assert.equal((await rpc(w, "get_my_visit")).visit.state, "active");
  });
  await t.test("直接テーブルと内部関数は利用者から実行不可", async () => {
    const c = await pool.connect();
    try {
      await c.query("begin");
      await c.query("set local role authenticated");
      await assert.rejects(
        c.query("select * from app_private.presence"),
        /permission denied/,
      );
    } finally {
      await c.query("rollback");
      c.release();
    }
  });
});
test.after(async () => {
  await sql(
    "delete from app_private.presence where visit_id in(select id from app_private.visits where street_id=$1)",
    [street],
  );
  await sql("delete from app_private.attempts where street_id=$1", [street]);
  await sql("delete from app_private.arrival_logs where street_id=$1", [
    street,
  ]);
  await sql("delete from app_private.visits where street_id=$1", [street]);
  await sql("delete from app_private.tags where street_id=$1", [street]);
  await sql("delete from app_private.daily_street_icons where street_id=$1", [
    street,
  ]);
  await sql("delete from app_private.areas where street_id=$1", [street]);
  await sql("delete from app_private.streets where id=$1", [street]);
  for (const u of identities) {
    await sql("delete from app_private.members where account_id=$1", [u]);
    await sql("delete from auth.users where id=$1", [u]);
  }
  await pool.end();
});
