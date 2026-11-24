import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Read-only: resolve Expo config with the same dotenv loading as prebuild.
// Do not print the full config (it may include deployment values).
const result = spawnSync(
  process.execPath,
  ["node_modules/expo/bin/cli", "config", "--type", "public", "--json"],
  {
    cwd: fileURLToPath(new URL("../apps/mobile/", import.meta.url)),
    env: { ...process.env, YUMEGAOKA_STORE_BUILD: "1" },
    encoding: "utf8",
  },
);
if (result.error || result.status !== 0) {
  console.error(
    "Store configuration blocked. Check the required inputs in docs/APP_STORE_BUILD.md. No build or upload performed.",
  );
  process.exit(2);
}
try {
  const config = JSON.parse(result.stdout);
  if (config.extra?.storeBuild !== true) throw new Error("store_mode_missing");
  console.log(
    "Store configuration checks passed. This does not verify the archive, backend, privacy declarations or App Review readiness.",
  );
} catch {
  console.error(
    "Could not verify the resolved store configuration. No build or upload performed.",
  );
  process.exit(2);
}
