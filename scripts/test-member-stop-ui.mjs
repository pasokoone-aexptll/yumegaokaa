import pg from "pg";
import { randomUUID } from "node:crypto";
import { spawnSync, execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const db = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
await db.connect();
const chat = process.argv.includes("--chat");
const user = randomUUID(),
  visit = randomUUID();
try {
  await db.query("insert into auth.users(id) values($1)", [user]);
  await db.query("insert into app_private.members(account_id) values($1)", [
    user,
  ]);
  await db.query(
    "insert into app_private.profiles(account_id,display_name) values($1,'UI停止対象')",
    [user],
  );
  await db.query(
    "insert into app_private.visits(id,account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,'11111111-1111-4111-8111-111111111111',$3,clock_timestamp(),clock_timestamp()+interval '3 hours')",
    [visit, user, randomUUID()],
  );
  execFileSync(
    "node",
    ["scripts/prepare-ui-test.mjs", "--simulator", "--operator"],
    { stdio: "pipe" },
  );
  const result = spawnSync(
    "xcodebuild",
    [
      "-project",
      "tests/ios-ui/Smoke.xcodeproj",
      "-scheme",
      "Smoke",
      "-destination",
      "platform=iOS Simulator,id=6410E701-1891-45E2-B35D-CB42F5891EF8",
      "-derivedDataPath",
      "/tmp/yumegaoka-ui-release",
      "-resultBundlePath",
      process.env.UI_RESULT_PATH ?? "/tmp/yumegaoka-stop126.xcresult",
      "-collect-test-diagnostics",
      "never",
      chat
        ? "-only-testing:Smoke/Smoke/testOperatorChatRestriction"
        : "-only-testing:Smoke/Smoke/testOperatorStopRestore",
      "test",
    ],
    { stdio: "inherit" },
  );
  assert.equal(result.status, 0);
  assert.equal(
    (
      await db.query(
        "select active from app_private.members where account_id=$1",
        [user],
      )
    ).rows[0].active,
    true,
  );
  assert.equal(
    (
      await db.query("select end_reason from app_private.visits where id=$1", [
        visit,
      ])
    ).rows[0].end_reason,
    chat ? null : "banned",
  );
  const audit = (
    await db.query(
      "select action,reason from app_private.operator_audit where target=$1 order by created_at",
      [user],
    )
  ).rows;
  assert.deepEqual(
    audit.map((x) => x.action),
    chat
      ? ["operator_chat_restrict", "operator_chat_restore"]
      : ["member_stop", "member_restore"],
  );
  assert.deepEqual(
    audit.map((x) => x.reason),
    ["UI stop restore verification", "UI stop restore verification"],
  );
  console.log(
    chat
      ? "Posting restriction/restore UI, active visit and exact audit reasons verified."
      : "Stop/restore UI, retained ended visit, and reasoned audit verified.",
  );
} finally {
  execFileSync(
    "node",
    ["scripts/prepare-ui-test.mjs", "--simulator", "--revoke-operator"],
    { stdio: "pipe" },
  );
  await db.query("delete from app_private.operator_audit where target=$1", [
    user,
  ]);
  await db.query(
    "delete from app_private.chat_restrictions where account_id=$1",
    [user],
  );
  await db.query("delete from app_private.visits where id=$1", [visit]);
  await db.query("delete from app_private.profiles where account_id=$1", [
    user,
  ]);
  await db.query("delete from app_private.members where account_id=$1", [user]);
  await db.query("delete from auth.users where id=$1", [user]);
  await db.end();
}
