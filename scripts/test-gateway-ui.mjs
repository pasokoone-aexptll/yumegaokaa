import pg from "pg";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const db = new pg.Client({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});
await db.connect();
const user = randomUUID(),
  body = "Gateway UI " + randomUUID().slice(0, 8);
let written = false;
const server = createServer(async (req, res) => {
  try {
    if (req.method !== "POST" || req.url !== "/message") {
      res.writeHead(404).end();
      return;
    }
    // Fixture input only: reads and realtime delivery use the production app path.
    await db.query(
      "insert into app_private.messages(street_id,author_id,body) values('11111111-1111-4111-8111-111111111111',$1,$2)",
      [user, body],
    );
    written = true;
    res.writeHead(200).end(body);
  } catch {
    res.writeHead(500).end();
  }
});
try {
  await db.query("insert into auth.users(id) values($1)", [user]);
  await db.query("insert into app_private.members(account_id) values($1)", [
    user,
  ]);
  await db.query(
    "insert into app_private.profiles(account_id,display_name) values($1,'Gateway UI peer')",
    [user],
  );
  await new Promise((r) => server.listen(54326, "127.0.0.1", r));
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
      process.env.UI_RESULT_PATH ?? "/tmp/yumegaoka-gateway128.xcresult",
      "-collect-test-diagnostics",
      "never",
      "-only-testing:Smoke/Smoke/testGatewayLiveChat",
      "test",
    ],
    { stdio: "inherit" },
  );
  const status = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
  assert.equal(status, 0);
  assert.ok(written);
  console.log(
    "Existing RN Map received live DB message with gateway configuration, without navigation or manual refresh. Polling fallback remains enabled.",
  );
} finally {
  server.close();
  await db.query("delete from app_private.messages where author_id=$1", [user]);
  await db.query("delete from app_private.profiles where account_id=$1", [
    user,
  ]);
  await db.query("delete from app_private.members where account_id=$1", [user]);
  await db.query("delete from auth.users where id=$1", [user]);
  await db.end();
}
