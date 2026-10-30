import pg from "pg";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
const db = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
await db.connect();
const visit = randomUUID();
try {
  const user = (
    await db.query(
      "select id from auth.users where email='simulator-validation@example.test'",
    )
  ).rows[0].id;
  const active = (
    await db.query(
      "select id from app_private.visits where account_id=$1 and ended_at is null and expires_at>clock_timestamp()",
      [user],
    )
  ).rows;
  assert.equal(
    active.length,
    0,
    "Do not replace an existing active simulator visit",
  );
  await db.query(
    "insert into app_private.visits(id,account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,'11111111-1111-4111-8111-111111111111',$3,clock_timestamp(),clock_timestamp()+interval '1 hour')",
    [visit, user, randomUUID()],
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
      process.env.UI_RESULT_PATH ?? "/tmp/yumegaoka-other-writer115.xcresult",
      "-collect-test-diagnostics",
      "never",
      "-only-testing:Smoke/Smoke/testOtherWriterEntryState",
      "test",
    ],
    { stdio: "inherit" },
  );
  assert.equal(result.status, 0);
  const row = (
    await db.query("select ended_at from app_private.visits where id=$1", [
      visit,
    ])
  ).rows[0];
  assert.equal(
    row.ended_at,
    null,
    "Canceling the sheet must not end the other device's visit",
  );
} finally {
  await db.query("delete from app_private.presence where visit_id=$1", [visit]);
  await db.query("delete from app_private.visits where id=$1", [visit]);
  await db.end();
}
