// Explicit APNs runner. Local simulator maintenance never calls this transport.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { providerToken, apnsSender } from "./lib/apns.mjs";
import { deliverPush } from "./lib/push-delivery.mjs";
const config = {
  environment: process.env.APNS_ENVIRONMENT,
  topic: process.env.APNS_TOPIC,
};
if (!process.env.APNS_PRIVATE_KEY_FILE)
  throw Error("APNS_PRIVATE_KEY_FILE required");
const token = providerToken({
  keyId: process.env.APNS_KEY_ID,
  teamId: process.env.APNS_TEAM_ID,
  privateKey: readFileSync(process.env.APNS_PRIVATE_KEY_FILE),
});
const sender = apnsSender({ ...config, token });
const env = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
if (new URL(env.API_URL).hostname !== "127.0.0.1")
  throw Error("Local launcher only");
async function rpc(operation, payload) {
  const response = await fetch(env.API_URL + "/rest/v1/rpc/push_delivery", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      apikey: env.SERVICE_ROLE_KEY,
      Authorization: "Bearer " + env.SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ operation, payload }),
  });
  if (!response.ok) throw Error("push_rpc_failed");
  return response.json();
}
let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    console.log(
      "APNs acceptance results (not device delivery):",
      await deliverPush(rpc, sender, config),
    );
  } finally {
    running = false;
  }
}
if (process.argv.includes("--once")) {
  try {
    await tick();
  } finally {
    sender.close();
  }
} else {
  const run = () =>
    tick().catch(() =>
      console.error(
        "Push worker failed; check credentials/connection. No token or payload logged.",
      ),
    );
  await run();
  const timer = setInterval(run, 30000);
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      clearInterval(timer);
      sender.close();
    });
}
