import pg from "pg";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
const db = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
await db.connect();
const users = Array.from({ length: 3 }, () => randomUUID());
try {
  for (const [i, id] of users.entries()) {
    await db.query("insert into auth.users(id) values($1)", [id]);
    await db.query("insert into app_private.members(account_id) values($1)", [
      id,
    ]);
    await db.query(
      "insert into app_private.profiles(account_id,display_name) values($1,$2)",
      [id, ["UIページ発行者", "UIページ受領者", "UIページ末尾"][i]],
    );
  }
  for (let i = 0; i < 101; i++)
    await db.query(
      "insert into app_private.invitations(issuer,code_hash,created_at,used_at,used_by) values($1,decode(md5(gen_random_uuid()::text),'hex'),'2099-01-01'::timestamptz-$2*interval '1 second',clock_timestamp(),$3)",
      [i === 100 ? users[2] : users[0], i, users[1]],
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
      "/tmp/yumegaoka-invites105.xcresult",
      "-collect-test-diagnostics",
      "never",
      "-only-testing:Smoke/Smoke/testOperatorInvitePagination",
      "test",
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) throw Error("UI failed " + result.status);
} finally {
  await db.query(
    "delete from app_private.invitations where issuer=any($1::uuid[])",
    [users],
  );
  await db.query(
    "delete from app_private.profiles where account_id=any($1::uuid[])",
    [users],
  );
  await db.query(
    "delete from app_private.members where account_id=any($1::uuid[])",
    [users],
  );
  await db.query("delete from auth.users where id=any($1::uuid[])", [users]);
  await db.end();
}
