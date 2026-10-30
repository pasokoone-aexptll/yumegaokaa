// Local development only. Never puts the service role key into the application.
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
const status = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
const lan =
  Object.values(networkInterfaces())
    .flat()
    .find((n) => n.family === "IPv4" && !n.internal)?.address ?? "127.0.0.1";
const url = process.env.LOCAL_API_URL ?? `http://${lan}:54321`;
const previous = existsSync("apps/mobile/.env.local")
  ? readFileSync("apps/mobile/.env.local", "utf8")
  : "";
const retained = previous
  .split("\n")
  .filter((line) => /^(APPLE_TEAM_ID|YUMEGAOKA_LOCAL_ENTRY)=/.test(line));
if (!retained.some((line) => line.startsWith("YUMEGAOKA_LOCAL_ENTRY=")))
  retained.push("YUMEGAOKA_LOCAL_ENTRY=1");
writeFileSync(
  "apps/mobile/.env.local",
  `EXPO_PUBLIC_SUPABASE_URL=${url}\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}\nEXPO_PUBLIC_STREET_ID=11111111-1111-4111-8111-111111111111\n${retained.join("\n")}\n`,
);
console.log(
  `iPhone接続先: ${url}\nローカルメール: http://127.0.0.1:54324\nログイン後、npm run local:invite -- メールアドレス で利用資格を登録します。`,
);
