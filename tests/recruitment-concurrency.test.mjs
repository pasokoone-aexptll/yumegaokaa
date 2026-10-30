import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { randomUUID } from "node:crypto";

const connectionString =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
test("two recruitment creates and exit serialize on the same visit", async () => {
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  const user = randomUUID(),
    session = randomUUID(),
    street = randomUUID(),
    visit = randomUUID();
  const clients = [];
  const pids = [];
  async function waitForBothRequests() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const { rows } = await admin.query(
        "select count(*) n from pg_stat_activity where pid=any($1::int[]) and wait_event_type='Lock'",
        [pids],
      );
      if (Number(rows[0].n) === 2) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error("both requests did not reach the held lock");
  }
  async function rpc(i, op, p) {
    const c = clients[i];
    await c.query("begin");
    try {
      await c.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({
          sub: user,
          session_id: session,
          role: "authenticated",
        }),
      ]);
      await c.query("set local role authenticated");
      const result = (
        await c.query("select public.street_api($1,$2) r", [op, p])
      ).rows[0].r;
      await c.query("commit");
      return result;
    } catch (e) {
      await c.query("rollback");
      throw e;
    }
  }
  try {
    await admin.query("insert into auth.users(id) values($1)", [user]);
    await admin.query("insert into auth.sessions(id,user_id) values($1,$2)", [
      session,
      user,
    ]);
    await admin.query(
      "insert into app_private.members(account_id) values($1)",
      [user],
    );
    await admin.query(
      "insert into app_private.streets(id,name) values($1,'recruitment race fixture')",
      [street],
    );
    await admin.query(
      "insert into app_private.areas values($1,1,extensions.st_buffer(extensions.st_transform(extensions.st_makepoint(139.7109,35.7295),'+proj=longlat +datum=WGS84 +no_defs','+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'),500))",
      [street],
    );
    await admin.query(
      "insert into app_private.visits(id,account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,$3,$4,clock_timestamp(),clock_timestamp()+interval '3 hours')",
      [visit, user, street, session],
    );
    for (let i = 0; i < 2; i++) {
      const c = new pg.Client({ connectionString });
      await c.connect();
      await c.query("set statement_timeout='10s'");
      clients.push(c);
      pids.push((await c.query("select pg_backend_pid() pid")).rows[0].pid);
    }
    const tickets = await Promise.all(
      [0, 1].map((i) =>
        rpc(i, "command_prepare", { kind: "recruitment_create" }),
      ),
    );
    const body = {
      visit_id: visit,
      title: "race",
      longitude: 139.7109,
      latitude: 35.7295,
      accuracy: 10,
      observed_at: new Date().toISOString(),
    };
    await admin.query("begin");
    await admin.query(
      "select id from app_private.visits where id=$1 for update",
      [visit],
    );
    const race = Promise.allSettled(
      tickets.map((t, i) => rpc(i, "command_execute", { id: t.id, body })),
    );
    await waitForBothRequests();
    await admin.query("commit");
    const result = await race;
    assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
    assert.match(
      result.find((r) => r.status === "rejected").reason.message,
      /conflict/,
    );
    const winner = result.find((r) => r.status === "fulfilled").value;
    assert.equal(
      (await rpc(0, "recruitment_list", { street_id: street })).items.length,
      1,
    );
    await rpc(0, "recruitment_end", { id: winner.id });
    const next = await rpc(0, "command_prepare", {
      kind: "recruitment_create",
    });
    await admin.query("begin");
    await admin.query(
      "select id from app_private.visits where id=$1 for update",
      [visit],
    );
    const exiting = Promise.allSettled([
      rpc(0, "command_execute", { id: next.id, body }),
      rpc(1, "end_visit", { visit_id: visit, reason: "manual" }),
    ]);
    await waitForBothRequests();
    await admin.query("commit");
    const exited = await exiting;
    assert.equal(exited[1].status, "fulfilled");
    if (exited[0].status === "rejected")
      assert.match(exited[0].reason.message, /inactive_visit/);
    assert.equal(
      (await rpc(0, "recruitment_list", { street_id: street })).items.length,
      0,
    );
    try {
      await rpc(0, "command_execute", { id: next.id, body });
    } catch (e) {
      assert.match(e.message, /inactive_visit/);
    }
    assert.equal(
      (await rpc(0, "recruitment_list", { street_id: street })).items.length,
      0,
    );
  } finally {
    await admin.query("rollback");
    await Promise.all(clients.map((c) => c.end()));
    await admin.query(
      "delete from app_private.recruitments where visit_id=$1",
      [visit],
    );
    await admin.query("delete from app_private.visits where id=$1", [visit]);
    await admin.query("delete from app_private.areas where street_id=$1", [
      street,
    ]);
    await admin.query("delete from app_private.streets where id=$1", [street]);
    await admin.query(
      "delete from app_private.request_limits where account_id=$1",
      [user],
    );
    await admin.query("delete from app_private.commands where owner_id=$1", [
      user,
    ]);
    await admin.query("delete from app_private.members where account_id=$1", [
      user,
    ]);
    await admin.query("delete from auth.sessions where user_id=$1", [user]);
    await admin.query("delete from auth.users where id=$1", [user]);
    await admin.end();
  }
});
