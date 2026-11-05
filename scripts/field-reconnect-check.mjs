// stdin: one current access token per test account. Never log tokens.
import { readFileSync } from "node:fs";
import { once } from "node:events";
import WebSocket from "ws";

const endpoint = new URL(process.argv[2]);
if (endpoint.pathname !== "/street" ||
    !(endpoint.protocol === "wss:" || (endpoint.protocol === "ws:" && endpoint.hostname === "127.0.0.1")))
  throw Error("Use the field wss endpoint or a loopback test gateway");
const tokens = readFileSync(0, "utf8").trim().split(/\s+/);
const accounts = tokens.map(token => JSON.parse(Buffer.from(token.split(".")[1], "base64url")).sub);
if (tokens.length !== 30 || accounts.some(id => typeof id !== "string" || !id) || new Set(accounts).size !== 30)
  throw Error("30 distinct test accounts required");

async function round() {
  const sockets = [];
  try {
    const times = await Promise.all(tokens.map(async token => {
      const start = performance.now();
      const ws = new WebSocket(endpoint, { headers: { Authorization: "Bearer " + token }, handshakeTimeout: 6000 });
      sockets.push(ws);
      ws.on("error", () => {});
      const [message] = await once(ws, "message", { signal: AbortSignal.timeout(10000) });
      if (JSON.parse(message).type !== "ready") throw Error("Gateway did not acknowledge the connection");
      return performance.now() - start;
    }));
    if (sockets.some(ws => ws.readyState !== WebSocket.OPEN)) throw Error("Connection lost during admission");
    times.sort((a, b) => a - b);
    return { simultaneous: times.length, p95_ready_ms: Math.round(times[28]), max_ready_ms: Math.round(times[29]) };
  } finally {
    await Promise.all(sockets.filter(ws => ws.readyState !== WebSocket.CLOSED).map(async ws => {
      const closed = once(ws, "close").catch(() => {});
      ws.terminate();
      await closed;
    }));
  }
}
console.log(JSON.stringify({ connect: await round(), reconnect: await round() }));
