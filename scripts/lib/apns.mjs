import { connect } from "node:http2";
import { createPrivateKey, sign } from "node:crypto";

export function providerToken({
  keyId,
  teamId,
  privateKey,
  now = () => Date.now(),
}) {
  const key = createPrivateKey(privateKey);
  if (
    key.asymmetricKeyType !== "ec" ||
    key.asymmetricKeyDetails?.namedCurve !== "prime256v1"
  )
    throw Error("apns_key_must_be_p256");
  if (!/^[A-Z0-9]{10}$/.test(keyId) || !/^[A-Z0-9]{10}$/.test(teamId))
    throw Error("invalid_apns_identity");
  let token,
    issued = 0;
  return () => {
    const seconds = Math.floor(now() / 1000);
    if (!token || seconds - issued >= 3000 || seconds < issued) {
      const encode = (x) =>
        Buffer.from(JSON.stringify(x)).toString("base64url");
      const body =
        encode({ alg: "ES256", kid: keyId }) +
        "." +
        encode({ iss: teamId, iat: seconds });
      token =
        body +
        "." +
        sign("sha256", Buffer.from(body), {
          key,
          dsaEncoding: "ieee-p1363",
        }).toString("base64url");
      issued = seconds;
    }
    return token;
  };
}
export function classifyAPNs(status, body = {}) {
  if (status === 200) return { kind: "accepted" }; // Accepted by APNs, not proof of device delivery.
  if (
    status === 410 ||
    body.reason === "BadDeviceToken" ||
    body.reason === "DeviceTokenNotForTopic"
  )
    return {
      kind: "invalid_token",
      ...(Number.isFinite(body.timestamp)
        ? { invalidated_at: new Date(body.timestamp).toISOString() }
        : {}),
    };
  if (status === 429 || status >= 500) return { kind: "retry" };
  if (status === 403) return { kind: "configuration_error" };
  return { kind: "failed" };
}
export function apnsSender({
  environment,
  topic,
  token,
  timeoutMs = 10000,
  transport = connect,
}) {
  if (
    !["sandbox", "production"].includes(environment) ||
    !topic ||
    !/^[A-Za-z0-9.-]+$/.test(topic)
  )
    throw Error("invalid_apns_config");
  const origin =
    environment === "sandbox"
      ? "https://api.sandbox.push.apple.com"
      : "https://api.push.apple.com";
  let connection;
  function session() {
    if (!connection || connection.closed || connection.destroyed) {
      const opened = transport(origin);
      connection = opened;
      opened.on("error", () => {});
      opened.on("goaway", () => opened.close());
    }
    return connection;
  }
  return {
    send(item) {
      if (
        item.environment !== environment ||
        !/^[0-9a-f]{2,512}$/.test(item.token) ||
        item.token.length % 2
      )
        throw Error("invalid_apns_target");
      const expiration = Math.floor(new Date(item.expires_at).getTime() / 1000);
      if (!Number.isFinite(expiration) || expiration <= Date.now() / 1000)
        throw Error("notification_expired");
      return new Promise((resolve, reject) => {
        let settled = false,
          status = 0,
          response = "";
        const req = session().request({
          ":method": "POST",
          ":path": "/3/device/" + item.token,
          authorization: "bearer " + token(),
          "apns-topic": topic,
          "apns-push-type": "alert",
          "apns-priority": "10",
          "apns-id": item.id,
          "apns-collapse-id": item.id,
          "apns-expiration": String(expiration),
          "content-type": "application/json",
        });
        const finish = (error, result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          error ? reject(Error("apns_transport_failed")) : resolve(result);
        };
        const timer = setTimeout(() => {
          finish(true);
          req.close();
        }, timeoutMs);
        req.on("response", (headers) => {
          status = Number(headers[":status"]);
        });
        req.on("data", (chunk) => {
          response += chunk;
          if (response.length > 4096) {
            finish(true);
            req.close();
          }
        });
        req.on("error", () => finish(true));
        req.on("aborted", () => finish(true));
        req.on("end", () => {
          let body = {};
          try {
            body = JSON.parse(response || "{}");
          } catch {
            finish(true);
            return;
          }
          finish(false, classifyAPNs(status, body));
        });
        req.on("close", () => {
          if (!settled) finish(true);
        });
        // No event title, participant names, or coordinates on the lock screen.
        req.end(
          JSON.stringify({
            aps: {
              alert: { title: "夢ヶ丘", body: item.kind === "mention" ? "街のチャットにメンションがあります。" : "オフ会のお知らせがあります。" },
              sound: "default",
            },
            notification_id: item.id,
          }),
        );
      });
    },
    close() {
      connection?.close();
    },
  };
}
