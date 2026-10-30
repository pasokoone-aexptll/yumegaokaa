import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const env = JSON.parse(
  execFileSync("npx", ["supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
);
const email = `otp-${Date.now()}@example.test`;
async function auth(path, body) {
  const r = await fetch(env.API_URL + "/auth/v1/" + path, {
    method: "POST",
    headers: {
      apikey: env.PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  assert.ok(r.ok, `auth HTTP ${r.status}`);
  return j;
}
await auth("otp", { email, create_user: true });
const list = await (
  await fetch("http://127.0.0.1:54324/api/v1/messages")
).json();
const message = list.messages.find((m) =>
  m.To.some((to) => to.Address === email),
);
assert.ok(message, "fixture OTP mail delivered");
const mail = await (
  await fetch("http://127.0.0.1:54324/api/v1/message/" + message.ID)
).json();
const code = (mail.Text + " " + mail.HTML).match(/\b\d{6}\b/)?.[0];
assert.ok(code, "mail has OTP");
const session = await auth("verify", { email, token: code, type: "email" });
assert.ok(session.access_token);
assert.ok(session.refresh_token);
const r = await fetch(env.API_URL + "/rest/v1/rpc/street_api", {
  method: "POST",
  headers: {
    apikey: env.PUBLISHABLE_KEY,
    Authorization: "Bearer " + session.access_token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ operation: "time", payload: {} }),
});
assert.equal(r.status, 403, "email verification alone grants no membership");
// Remove only this disposable local fixture. Never output the OTP or tokens.
await fetch(env.API_URL + "/auth/v1/admin/users/" + session.user.id, {
  method: "DELETE",
  headers: {
    apikey: env.SERVICE_ROLE_KEY,
    Authorization: "Bearer " + env.SERVICE_ROLE_KEY,
  },
});
console.log(
  "OTP成功: ローカルメール配送→コード認証→未招待403。秘密は出力していません。",
);
