import { execFileSync, spawnSync } from "node:child_process";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import pg from "pg";
const env = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
assert.equal(new URL(env.API_URL).hostname, "127.0.0.1");
const db = new pg.Client({ connectionString: env.DB_URL });
await db.connect();
const dir = await mkdtemp(join(tmpdir(), "yumegaoka-cache-ui-"));
let profile, path;
const headers = {
  apikey: env.SERVICE_ROLE_KEY,
  Authorization: "Bearer " + env.SERVICE_ROLE_KEY,
};
try {
  profile = (
    await db.query(
      "select p.* from app_private.profiles p join auth.users u on u.id=p.account_id where u.email='simulator-validation@example.test'",
    )
  ).rows[0];
  assert.ok(profile);
  path = profile.account_id + "/cache-test-" + randomUUID() + ".jpg";
  execFileSync(
    "sips",
    [
      "-s",
      "format",
      "jpeg",
      "apps/mobile/assets/icon.png",
      "--out",
      join(dir, "test.jpg"),
    ],
    { stdio: "ignore" },
  );
  const upload = await fetch(
    env.API_URL + "/storage/v1/object/avatars/" + path,
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "image/jpeg" },
      body: await readFile(join(dir, "test.jpg")),
    },
  );
  assert.ok(upload.ok, "fixture upload");
  await db.query(
    "update app_private.profiles set avatar_path=$1,avatar_updated_at=clock_timestamp() where account_id=$2",
    [path, profile.account_id],
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
      process.env.UI_RESULT_PATH ?? "/tmp/yumegaoka-image125.xcresult",
      "-collect-test-diagnostics",
      "never",
      "-only-testing:Smoke/Smoke/testProfileImageDisplay",
      "test",
    ],
    { stdio: "inherit" },
  );
  assert.equal(result.status, 0);
  execFileSync(
    "xcrun",
    [
      "simctl",
      "io",
      "6410E701-1891-45E2-B35D-CB42F5891EF8",
      "screenshot",
      "/tmp/yumegaoka-image125.png",
    ],
    { stdio: "ignore" },
  );
  console.log("Image screenshot saved; visual verification still required.");
} finally {
  if (profile)
    await db.query(
      "update app_private.profiles set avatar_path=$1,avatar_updated_at=$2 where account_id=$3",
      [profile.avatar_path, profile.avatar_updated_at, profile.account_id],
    );
  if (path) {
    const r = await fetch(env.API_URL + "/storage/v1/object/avatars", {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [path] }),
    });
    assert.ok(r.ok, "fixture removal");
  }
  await db.end();
  await rm(dir, { recursive: true, force: true });
}
