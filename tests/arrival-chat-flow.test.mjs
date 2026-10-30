import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";

test("入街ログ: 入街・更新・再利用からチャット取得、現在名、ブロック、30日期限", async () => {
  const db = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await db.connect();
  await db.query("begin");
  try {
    const users = [randomUUID(), randomUUID()];
    const sessions = users.map(() => randomUUID());
    const street = randomUUID();
    const tag = randomUUID();
    for (let i = 0; i < users.length; i++) {
      await db.query("insert into auth.users(id) values($1)", [users[i]]);
      await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [
        sessions[i],
        users[i],
      ]);
      await db.query("insert into app_private.members(account_id) values($1)", [
        users[i],
      ]);
    }
    await db.query(
      "insert into app_private.streets(id,name) values($1,'arrival test')",
      [street],
    );
    await db.query(
      "insert into app_private.areas values($1,1,extensions.st_makeenvelope(-1000,-1000,1000,1000))",
      [street],
    );
    await db.query(
      "insert into app_private.tags(id,street_id,active) values($1,$2,true)",
      [tag, street],
    );
    async function rpc(index, operation, payload = {}) {
      await db.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({
          sub: users[index],
          session_id: sessions[index],
          role: "authenticated",
        }),
      ]);
      await db.query("set local role authenticated");
      const result = (
        await db.query("select public.street_api($1,$2) result", [
          operation,
          payload,
        ])
      ).rows[0].result;
      await db.query("reset role");
      return result;
    }
    await rpc(0, "profile_save", { display_name: "入街した人" });
    const attempt = await rpc(0, "prepare_checkin", {
      tag_id: tag,
      payload_version: 1,
    });
    const entered = await rpc(0, "commit_checkin", {
      attempt_id: attempt.attempt_id,
    });
    await rpc(0, "commit_checkin", { attempt_id: attempt.attempt_id });
    const reuse = await rpc(0, "prepare_checkin", {
      tag_id: tag,
      payload_version: 1,
    });
    const reused = await rpc(0, "commit_checkin", {
      attempt_id: reuse.attempt_id,
    });
    assert.equal(reused.visit.visit_id, entered.visit.visit_id);
    await rpc(0, "observe_visit", {
      visit_id: entered.visit.visit_id,
      seq: "1",
      area_version: "1",
      grid_version: "1",
      verdict: "inside",
      cell_id: "0:0",
      horizontal_accuracy_m: 10,
      observed_at: new Date(Date.now() - 1000).toISOString(),
    });
    const list = async () =>
      (await rpc(1, "chat_list", { street_id: street })).items;
    const first = await list();
    assert.equal(first.length, 1);
    assert.equal(first[0].kind, "arrival");
    assert.equal(first[0].display_name, "入街した人");
    assert.equal(first[0].author_id, users[0]);
    assert.equal("visit_id" in first[0], false);
    assert.equal("source_visit_id" in first[0], false);
    await rpc(0, "profile_save", { display_name: "変更した名前" });
    assert.equal((await list())[0].display_name, "変更した名前");
    await rpc(1, "block_set", { account_id: users[0], blocked: true });
    assert.deepEqual(await list(), []);
    await rpc(1, "block_set", { account_id: users[0], blocked: false });
    assert.equal((await list())[0].id, first[0].id);
    await db.query(
      "update app_private.arrival_logs set created_at=clock_timestamp()-interval '30 days' where street_id=$1",
      [street],
    );
    assert.deepEqual(await list(), []);
  } finally {
    await db.query("rollback");
    await db.end();
  }
});
