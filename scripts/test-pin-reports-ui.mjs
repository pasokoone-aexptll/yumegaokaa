import pg from "pg";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
const db = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
await db.connect();
const owner = randomUUID(),
  event = randomUUID(),
  visit = randomUUID(),
  pin = randomUUID(),
  street = "11111111-1111-4111-8111-111111111111";
try {
  const viewer = (
    await db.query(
      "select id from auth.users where email='simulator-validation@example.test'",
    )
  ).rows[0].id;
  await db.query("insert into auth.users(id) values($1)", [owner]);
  await db.query("insert into app_private.members(account_id) values($1)", [
    owner,
  ]);
  await db.query(
    "insert into app_private.profiles(account_id,display_name) values($1,'通報fixture')",
    [owner],
  );
  await db.query(
    "insert into app_private.events(id,host_id,street_id,title,longitude,latitude,starts_at,ends_at) values($1,$2,$3,'UI通報イベント',139.7109,35.7295,clock_timestamp()+interval '1 hour',clock_timestamp()+interval '2 hours')",
    [event, owner, street],
  );
  await db.query(
    "insert into app_private.registrations(event_id,account_id,joined) values($1,$2,true)",
    [event, viewer],
  );
  await db.query(
    "insert into app_private.visits(id,account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,$3,$4,clock_timestamp(),clock_timestamp()+interval '1 hour')",
    [visit, owner, street, randomUUID()],
  );
  await db.query(
    "insert into app_private.recruitments(id,visit_id,title,longitude,latitude,expires_at) values($1,$2,'UI通報募集',139.7109,35.7295,clock_timestamp()+interval '20 minutes')",
    [pin, visit],
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
      process.env.UI_RESULT_PATH ?? "/tmp/yumegaoka-report112.xcresult",
      "-collect-test-diagnostics",
      "never",
      "-only-testing:Smoke/Smoke/testPinReportEntrypoints",
      "test",
    ],
    { stdio: "inherit" },
  );
  assert.equal(result.status, 0);
  const reports = (
    await db.query(
      "select target_kind,reason,reporter from app_private.reports where target_id=any($1::uuid[])",
      [[event, pin]],
    )
  ).rows;
  assert.equal(reports.length, 2);
  assert.deepEqual(reports.map((r) => r.target_kind).sort(), [
    "event",
    "recruitment",
  ]);
  assert.ok(reports.every((r) => r.reason === "spam" && r.reporter === viewer));
} finally {
  await db.query(
    "delete from app_private.reports where target_id=any($1::uuid[])",
    [[event, pin]],
  );
  await db.query("delete from app_private.registrations where event_id=$1", [
    event,
  ]);
  await db.query("delete from app_private.events where id=$1", [event]);
  await db.query("delete from app_private.recruitments where id=$1", [pin]);
  await db.query("delete from app_private.visits where id=$1", [visit]);
  await db.query("delete from app_private.profiles where account_id=$1", [
    owner,
  ]);
  await db.query("delete from app_private.members where account_id=$1", [
    owner,
  ]);
  await db.query("delete from auth.users where id=$1", [owner]);
  await db.end();
}
