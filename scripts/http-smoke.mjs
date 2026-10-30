import { execFileSync } from "node:child_process";
import pg from "pg";
import assert from "node:assert/strict";
import proj4 from "proj4";
import { createClient } from "../apps/mobile/node_modules/@supabase/supabase-js/dist/index.mjs";
const env = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
const base = env.API_URL,
  key = env.PUBLISHABLE_KEY,
  email = `smoke-${Date.now()}@example.test`,
  password = crypto.randomUUID();
async function req(path, body, token = key, admin = false) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: {
      apikey: admin ? env.SERVICE_ROLE_KEY : key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw Error(`${r.status}:${j.message ?? j.msg ?? "failed"}`);
  return j;
}
const c = new pg.Client({ connectionString: env.DB_URL });
await c.connect();
let uid, realtime;
try {
  const user = await req(
    "/auth/v1/admin/users",
    { email, password, email_confirm: true },
    env.SERVICE_ROLE_KEY,
    true,
  );
  uid = user.id;
  await c.query("insert into app_private.members(account_id) values($1)", [
    uid,
  ]);
  const auth = await req("/auth/v1/token?grant_type=password", {
    email,
    password,
  });
  const rpc = (operation, payload = {}) =>
    req("/rest/v1/rpc/street_api", { operation, payload }, auth.access_token);
  const street = "11111111-1111-4111-8111-111111111111";
  realtime = createClient(base, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    accessToken: async () => auth.access_token,
  });
  await realtime.realtime.setAuth(auth.access_token);
  let changed = false,
    notification;
  const channel = realtime
    .channel(`street:${street}`, { config: { private: true } })
    .on("broadcast", { event: "changed" }, (event) => {
      notification = event.payload;
      changed = true;
    });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error("Realtime subscribe timeout")),
      8000,
    );
    channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      } else if (status === "CHANNEL_ERROR") {
        clearTimeout(timer);
        reject(
          Error("Realtime channel error: " + (error?.message ?? "unknown")),
        );
      }
    });
  });
  const config = await rpc("get_street_config", { street_id: street });
  const a = await rpc("prepare_checkin", {
    tag_id: "22222222-2222-4222-8222-222222222222",
    payload_version: 1,
  });
  const b = await rpc("commit_checkin", { attempt_id: a.attempt_id });
  const [e, n] = proj4("EPSG:4326", config.projection, [139.7109, 35.7295]);
  const cell = `${Math.floor(e / 100)}:${Math.floor(n / 100)}`;
  await rpc("observe_visit", {
    visit_id: b.visit.visit_id,
    seq: "1",
    area_version: config.area_version,
    grid_version: config.grid_version,
    verdict: "inside",
    cell_id: cell,
    horizontal_accuracy_m: 10,
    observed_at: new Date().toISOString(),
  });
  const map = await rpc("get_presence_snapshot", { street_id: street });
  assert.ok(map.cells.some((x) => x.cell_id === cell));
  assert.ok(map.presence_count >= 1);
  await rpc("end_visit", { visit_id: b.visit.visit_id, reason: "manual" });
  assert.equal((await rpc("get_my_visit")).visit, null);
  for (let i = 0; i < 30 && !changed; i++)
    await new Promise((r) => setTimeout(r, 100));
  assert.ok(changed, "private changed notification delivered");
  assert.ok(
    Object.keys(notification).every((k) => k === "id"),
    "notification has only transport message id",
  );
  assert.notEqual(notification.id, b.visit.visit_id);
  console.log(
    "private Realtime通知成功: 個人情報なし（transport message idのみ）",
  );
  console.log(
    "HTTP通し成功: Auth session → NFC相当の開始API → 区画更新 → 公開地図集約 → 退出（実NFC試験ではない）",
  );
} finally {
  if (realtime) await realtime.removeAllChannels();
  if (uid) {
    await c.query("delete from app_private.attempts where account_id=$1", [
      uid,
    ]);
    await c.query("delete from app_private.arrival_logs where account_id=$1", [
      uid,
    ]);
    await c.query("delete from app_private.visits where account_id=$1", [uid]);
    await c.query("delete from app_private.members where account_id=$1", [uid]);
    await c.query("delete from auth.users where id=$1", [uid]);
  }
  await c.end();
}
