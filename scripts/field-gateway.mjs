import { startGateway } from "./lib/gateway-runtime.mjs";
import { maintenanceTick } from "./lib/maintenance.mjs";

function required(name) {
  const value = process.env[name];
  if (!value) throw Error("Missing environment variable " + name);
  return value;
}
const apiURL = new URL(required("SUPABASE_URL"));
if (apiURL.protocol !== "https:") throw Error("HTTPS required");
const database = new URL(required("DATABASE_URL"));
if (database.searchParams.get("sslmode") !== "verify-full")
  throw Error("Use a TLS verified Postgres session connection");
const runtime = await startGateway({
  dbURL: database.href,
  apiURL: apiURL.origin,
  publishableKey: required("SUPABASE_PUBLISHABLE_KEY"),
  streetId: required("STREET_ID"),
  host: "0.0.0.0",
  port: Number(required("PORT")),
});
const tick = maintenanceTick({
  apiURL: apiURL.origin,
  serviceKey: required("SUPABASE_SERVICE_ROLE_KEY"),
});
let timer;
let closed = false;
runtime.gateway.server.once("close", () => {
  closed = true;
  clearTimeout(timer);
});
async function maintain() {
  try {
    await tick();
  } catch {
    console.error("Field maintenance failed; retrying in one minute");
  }
  if (!closed) timer = setTimeout(maintain, 60000);
}
void maintain();
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => void runtime.close());
