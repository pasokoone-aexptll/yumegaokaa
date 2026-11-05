// Local server worker. The privileged key never enters mobile configuration.
import { execFileSync } from "node:child_process";
import { maintenanceTick } from "./lib/maintenance.mjs";
const env = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
if (new URL(env.API_URL).hostname !== "127.0.0.1")
  throw Error("Local worker only.");
const tick = maintenanceTick({
  apiURL: env.API_URL,
  serviceKey: env.SERVICE_ROLE_KEY,
  simulate: true,
});
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
