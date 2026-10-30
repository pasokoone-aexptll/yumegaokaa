import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import pg from "pg";
const env = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
const db = new pg.Client({ connectionString: env.DB_URL });
await db.connect();
const street = randomUUID(),
  tag = randomUUID(),
  email = `lifecycle-${randomUUID()}@example.test`,
  password = randomUUID();
let uid;
async function req(path, body, admin = false) {
  const r = await fetch(env.API_URL + path, {
    method: "POST",
    headers: {
      apikey: admin ? env.SERVICE_ROLE_KEY : env.PUBLISHABLE_KEY,
      ...(admin ? { Authorization: `Bearer ${env.SERVICE_ROLE_KEY}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw Error(`Auth fixture failed: ${r.status}`);
  return r.json();
}
try {
  uid = (
    await req(
      "/auth/v1/admin/users",
      { email, password, email_confirm: true },
      true,
    )
  ).id;
  await db.query("insert into app_private.members(account_id) values($1)", [
    uid,
  ]);
  await db.query(
    "insert into app_private.streets(id,name) values($1,'lifecycle integration')",
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
  const auth = await req("/auth/v1/token?grant_type=password", {
    email,
    password,
  });
  execFileSync(
    "swiftc",
    [
      "-parse-as-library",
      "-module-cache-path",
      "/tmp/yumegaoka-swift-cache",
      "apps/mobile/modules/presence-native/ios/ServiceError.swift",
      "apps/mobile/modules/presence-native/ios/VisitLifecycle.swift",
      "tests/lifecycle-http/main.swift",
      "-o",
      "/tmp/yumegaoka-lifecycle-http",
    ],
    { stdio: "inherit" },
  );
  await new Promise((resolve, reject) => {
    const p = spawn("/tmp/yumegaoka-lifecycle-http", [], {
      env: {
        ...process.env,
        TEST_API: env.API_URL,
        TEST_KEY: env.PUBLISHABLE_KEY,
        TEST_TOKEN: auth.access_token,
        TEST_STREET: street,
        TEST_TAG: tag,
      },
      stdio: "inherit",
    });
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error(`Swift integration exit ${code}`)),
    );
  });
} finally {
  if (uid) {
    for (const table of ["attempts", "arrival_logs", "visits"])
      await db.query(`delete from app_private.${table} where account_id=$1`, [
        uid,
      ]);
    await db.query("delete from app_private.members where account_id=$1", [
      uid,
    ]);
    await db.query("delete from auth.users where id=$1", [uid]);
  }
  await db.query("delete from app_private.tags where id=$1", [tag]);
  await db.query("delete from app_private.areas where street_id=$1", [street]);
  await db.query("delete from app_private.streets where id=$1", [street]);
  await db.end();
}
