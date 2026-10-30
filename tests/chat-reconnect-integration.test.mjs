import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const moduleExports = {};
new Function(
  "exports",
  ts.transpileModule(
    readFileSync("apps/mobile/src/lib/chatWindow.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
)(moduleExports);

test("real chat API restores a 125-row gap through the mobile window reader", async () => {
  const db = new pg.Client({
    connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await db.connect();
  await db.query("begin");
  const users = [randomUUID(), randomUUID()],
    sessions = users.map(() => randomUUID()),
    street = randomUUID();
  try {
    for (let i = 0; i < 2; i++) {
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
      "insert into app_private.streets(id,name) values($1,'reconnect fixture')",
      [street],
    );
    async function rpc(user, op, payload) {
      await db.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({
          sub: users[user],
          session_id: sessions[user],
          role: "authenticated",
        }),
      ]);
      await db.query("set local role authenticated");
      const result = (
        await db.query("select public.street_api($1,$2) result", [op, payload])
      ).rows[0].result;
      await db.query("reset role");
      return result;
    }
    await rpc(0, "profile_save", { display_name: "Sender" });
    await db.query(
      "insert into app_private.messages(street_id,author_id,body,created_at) select $1,$2,'older '||n,now()-interval '10 minutes'+n*interval '1 second' from generate_series(1,30) n",
      [street, users[0]],
    );
    const before = (await rpc(1, "chat_list", { street_id: street })).items;
    assert.equal(before.length, 30);
    // Seed messages accumulated during the read gap, not a bypass of send-rate behavior.
    await db.query(
      "insert into app_private.messages(street_id,author_id,body,created_at) select $1,$2,'gap '||n,now()-interval '3 minutes'+n*interval '1 second' from generate_series(1,125) n",
      [street, users[0]],
    );
    await rpc(0, "chat_delete", { id: before[0].id });
    const ticket = await rpc(0, "command_prepare", { kind: "chat_send" });
    const sent = await rpc(0, "command_execute", {
      id: ticket.id,
      body: { street_id: street, body: "live after gap" },
    });
    const sizes = [];
    const result = await moduleExports.readChatWindow(
      async (cursor) => {
        const rows = (
          await rpc(1, "chat_list", {
            street_id: street,
            ...(cursor
              ? { before_at: cursor.created_at, before_id: cursor.id }
              : {}),
          })
        ).items;
        sizes.push(rows.length);
        return rows;
      },
      before.at(-1),
      () => false,
    );
    assert.deepEqual(sizes, [50, 50, 50, 6]);
    assert.equal(result.length, 156);
    assert.equal(new Set(result.map((x) => x.id)).size, 156);
    assert.equal(result[0].id, sent.id);
    assert.equal(result[0].display_name, "Sender");
    assert.equal(result.at(-1).id, before.at(-1).id);
    assert.equal(result.find((x) => x.id === before[0].id).body, null);
    assert.equal(result.find((x) => x.id === before[0].id).deleted, true);
    const senderView = (await rpc(0, "chat_list", { street_id: street })).items;
    assert.equal(senderView[0].id, result[0].id);
  } finally {
    await db.query("rollback");
    await db.end();
  }
});
