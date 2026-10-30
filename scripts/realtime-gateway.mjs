import { execFileSync } from "node:child_process";
import { startGateway } from "./lib/gateway-runtime.mjs";
const env = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
if (new URL(env.API_URL).hostname !== "127.0.0.1")
  throw Error("This launcher is local-only");
const runtime = await startGateway({
  dbURL: env.DB_URL,
  apiURL: env.API_URL,
  publishableKey: env.PUBLISHABLE_KEY,
  streetId: "11111111-1111-4111-8111-111111111111",
  host: "0.0.0.0",
});
console.log("Local realtime gateway listening on port " + runtime.address.port);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => {
    void runtime.close();
  });
