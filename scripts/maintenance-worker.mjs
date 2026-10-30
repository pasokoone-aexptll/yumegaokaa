// Local server worker. The privileged key never enters mobile configuration.
import { execFileSync } from "node:child_process";
import { simulateNotifications } from "./lib/notification-delivery.mjs";
const env = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
if (new URL(env.API_URL).hostname !== "127.0.0.1")
  throw Error("Local worker only.");
async function request(path, method, body) {
  return fetch(env.API_URL + path, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: {
      apikey: env.SERVICE_ROLE_KEY,
      Authorization: "Bearer " + env.SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
async function job(operation, payload = {}, endpoint = "maintenance_jobs") {
  const r = await request("/rest/v1/rpc/" + endpoint, "POST", {
    operation,
    payload,
  });
  if (!r.ok) throw Error("maintenance_http_" + r.status);
  return r.json();
}
async function tick() {
  await job("cleanup");
  const notices = await simulateNotifications((operation, payload = {}) =>
    job(operation, payload, "notification_delivery"),
  );
  console.log("通知の疑似配信（実Pushではありません）:", notices, "件");
  let icons = 0;
  for (let i = 0; i < 100; i++) {
    const item = await job("claim", {}, "icon_cleanup");
    if (!item.id) break;
    try {
      const result = await request(
        "/storage/v1/object/street-icons",
        "DELETE",
        { prefixes: [item.path] },
      );
      if (!result.ok) throw Error("icon_cleanup_failed");
      await job("finish", { id: item.id, lease: item.lease }, "icon_cleanup");
      icons++;
    } catch {
      await job("retry", { id: item.id, lease: item.lease }, "icon_cleanup");
      console.error("取り下げた街アイコンの清掃を再試行待ちにしました。");
    }
  }
  console.log("取り下げた街アイコン清掃:", icons, "件");
  let count = 0;
  for (let i = 0; i < 100; i++) {
    const item = await job("claim");
    if (!item.id) break;
    try {
      const storage = await request("/storage/v1/object/avatars", "DELETE", {
        prefixes: [item.account_id + "/avatar.jpg"],
      });
      if (!storage.ok) throw Error("storage_cleanup_failed");
      const auth = await request(
        "/auth/v1/admin/users/" + item.account_id,
        "DELETE",
        { should_soft_delete: true },
      );
      if (!auth.ok && auth.status !== 404) throw Error("auth_cleanup_failed");
      await job("finish", { id: item.id, lease: item.lease });
      count++;
    } catch {
      await job("retry", { id: item.id, lease: item.lease });
      console.error("退会後の清掃を再試行待ちにしました。");
    }
  }
  console.log("期限清掃・退会後清掃を実行:", count, "件");
}
if (process.argv.includes("--once")) await tick();
else {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await tick();
    } catch {
      console.error("ローカル清掃に失敗。次の周期で再試行します。");
    } finally {
      running = false;
    }
  };
  await run();
  setInterval(() => void run(), 60000);
}
