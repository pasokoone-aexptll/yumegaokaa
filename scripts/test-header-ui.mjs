import pg from "pg";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
const db = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
await db.connect();
const street = "11111111-1111-4111-8111-111111111111";
const users = Array.from({ length: 10 }, () => randomUUID());
try {
  const baseline = (
    await db.query(
      "select count(*) n from app_private.visits where street_id=$1 and ended_at is null and expires_at>clock_timestamp()",
      [street],
    )
  ).rows[0];
  if (Number(baseline.n) !== 0)
    throw Error(
      "Run only when the local validation street has no active visits",
    );
  await db.query("begin");
  const s = (
    await db.query(
      "select s.area_version,s.grid_version,floor(extensions.st_x(extensions.st_pointonsurface(a.polygon))/100)::text||':'||floor(extensions.st_y(extensions.st_pointonsurface(a.polygon))/100)::text cell from app_private.streets s join app_private.areas a on a.street_id=s.id and a.version=s.area_version where s.id=$1",
      [street],
    )
  ).rows[0];
  for (const [i, u] of users.entries()) {
    await db.query("insert into auth.users(id) values($1)", [u]);
    await db.query("insert into app_private.members(account_id) values($1)", [
      u,
    ]);
    const v = randomUUID();
    await db.query(
      "insert into app_private.visits(id,account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,$3,$4,clock_timestamp(),clock_timestamp()+interval '3 hours')",
      [v, u, street, randomUUID()],
    );
    const icon = (
      await db.query(
        "select app_private.my_daily_icon($1,$2,clock_timestamp()) path",
        [u, street],
      )
    ).rows[0].path;
    if (!icon)
      throw Error("An existing published local pool image is required");
    if (i < 8)
      await db.query(
        "insert into app_private.presence values($1,$2,$3,$4,statement_timestamp(),statement_timestamp()+interval '10 minutes')",
        [v, s.area_version, s.grid_version, s.cell],
      );
  }
  await db.query("commit");
  const child = spawn(
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
      "/tmp/yumegaoka-header97.xcresult",
      "-collect-test-diagnostics",
      "never",
      "-only-testing:Smoke/Smoke/testPresenceHeader",
      "test",
    ],
    { stdio: "inherit" },
  );
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  if (code !== 0) throw Error("Header UI verification failed: " + code);
} finally {
  await db.query("rollback");
  await db.query("begin");
  await db.query(
    "delete from app_private.presence where visit_id in(select id from app_private.visits where account_id=any($1::uuid[]))",
    [users],
  );
  await db.query(
    "delete from app_private.visits where account_id=any($1::uuid[])",
    [users],
  );
  await db.query(
    "delete from app_private.daily_street_icons where account_id=any($1::uuid[])",
    [users],
  );
  await db.query(
    "delete from app_private.members where account_id=any($1::uuid[])",
    [users],
  );
  await db.query("delete from auth.users where id=any($1::uuid[])", [users]);
  await db.query("commit");
  await db.end();
}
