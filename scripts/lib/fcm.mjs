import { sign } from "node:crypto";
import { deliverPush } from "./push-delivery.mjs";

export function fieldFcmTick(apiURL, serviceKey, credentials) {
  const account = JSON.parse(credentials);
  const project = "yuwegaoka-staging";
  if (account.project_id !== project) throw Error("Unexpected FCM project");
  let token, expires = 0;
  const endpoint = "https://oauth2.googleapis.com/token";
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  async function authorize() {
    if (token && Date.now() < expires) return token;
    const now = Math.floor(Date.now() / 1000);
    const unsigned = encode({ alg: "RS256", typ: "JWT" }) + "." + encode({
      iss: account.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: endpoint, iat: now, exp: now + 3600,
    });
    const assertion = unsigned + "." + sign("RSA-SHA256", Buffer.from(unsigned), account.private_key).toString("base64url");
    const result = await fetch(endpoint, { method: "POST", signal: AbortSignal.timeout(12000),
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
    if (!result.ok) throw Error("FCM authorization failed");
    const response = await result.json();
    token = response.access_token;
    expires = Date.now() + (response.expires_in - 60) * 1000;
    return token;
  }
  async function send(item) {
    const response = await fetch("https://fcm.googleapis.com/v1/projects/" + project + "/messages:send", {
      method: "POST", signal: AbortSignal.timeout(12000),
      headers: { Authorization: "Bearer " + await authorize(), "Content-Type": "application/json" },
      body: JSON.stringify({ message: { token: item.token,
        notification: { title: "夢ヶ丘", body: item.kind === "mention" ? "街のチャットにメンションがあります。" : "オフ会のお知らせがあります。" },
        android: { notification: { tag: item.id } }, data: { yumegaoka_open: "notifications" },
      } }),
    });
    if (response.ok) return { kind: "accepted" };
    const info = await response.json().catch(() => ({}));
    if (info.error?.details?.some(x => x.errorCode === "UNREGISTERED")) return { kind: "invalid_token" };
    if ([401, 403].includes(response.status)) { expires = 0; return { kind: "configuration_error" }; }
    return { kind: response.status === 429 || response.status >= 500 ? "retry" : "failed" };
  }
  async function rpc(operation, payload) {
    const response = await fetch(apiURL + "/rest/v1/rpc/fcm_delivery", {
      method: "POST", signal: AbortSignal.timeout(12000),
      headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ operation, payload }),
    });
    if (!response.ok) throw Error("FCM queue unavailable");
    return response.json();
  }
  return () => deliverPush(rpc, { send }, { environment: "fcm", limit: 30 });
}
