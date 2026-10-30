import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

// Single process owns all accepted sockets. Deployment must not run independent
// replicas until the account-wide admission lock is shared between them.
export function createRealtimeGateway({ authorize, heartbeatMs = 30000 }) {
  const accounts = new Map();
  const clients = new Map();
  const server = createServer((req, res) => {
    res.writeHead(404);
    res.end();
  });
  const sockets = new WebSocketServer({
    noServer: true,
    maxPayload: 1024,
    perMessageDeflate: false,
  });
  const alive = new WeakSet();
  const heartbeat = setInterval(() => {
    for (const ws of clients.keys()) {
      if (!alive.has(ws)) {
        ws.terminate();
        continue;
      }
      alive.delete(ws);
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }
  }, heartbeatMs);
  heartbeat.unref();
  let closing = false;
  server.on("upgrade", async (req, socket, head) => {
    socket.on("error", () => {});
    const timeout = setTimeout(() => socket.destroy(), 5000);
    const reject = (code) => {
      clearTimeout(timeout);
      if (!socket.destroyed)
        socket.end(
          `HTTP/1.1 ${code}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`,
        );
    };
    try {
      if (req.url !== "/street" || closing) return reject("404 Not Found");
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ") || header.length > 8192)
        return reject("401 Unauthorized");
      const token = header.slice(7);
      const identity = await authorize(token);
      if (socket.destroyed || closing) return reject("503 Service Unavailable");
      if (!identity?.accountId || !identity.sessionId || !identity.streetId)
        return reject("403 Forbidden");
      const owned = accounts.get(identity.accountId) ?? new Set();
      if (owned.size >= 3) return reject("429 Too Many Requests");
      // No await between quota check and reservation. Count until TCP close,
      // including upgrades in flight and sockets waiting for a close handshake.
      owned.add(socket);
      accounts.set(identity.accountId, owned);
      socket.once("close", () => {
        owned.delete(socket);
        if (!owned.size) accounts.delete(identity.accountId);
      });
      clearTimeout(timeout);
      sockets.handleUpgrade(req, socket, head, (ws) => {
        clients.set(ws, { token, ...identity });
        alive.add(ws);
        ws.on("pong", () => alive.add(ws));
        ws.on("error", () => {});
        ws.once("close", () => clients.delete(ws));
        ws.on("message", () => ws.close(1008, "Receive-only connection"));
        ws.send(JSON.stringify({ type: "ready" }));
      });
    } catch {
      reject("401 Unauthorized");
    }
  });
  async function validate(ws, record) {
    try {
      const current = await authorize(record.token);
      if (
        !current ||
        current.accountId !== record.accountId ||
        current.sessionId !== record.sessionId ||
        current.streetId !== record.streetId
      )
        throw Error("revoked");
      return ws.readyState === WebSocket.OPEN;
    } catch {
      ws.terminate();
      return false;
    }
  }
  return {
    server,
    async revalidate() {
      await Promise.all([...clients].map(([ws, r]) => validate(ws, r)));
    },
    async changed(streetId) {
      await Promise.all(
        [...clients]
          .filter(([, r]) => r.streetId === streetId)
          .map(async ([ws, r]) => {
            if (await validate(ws, r))
              ws.send(JSON.stringify({ type: "changed" }));
          }),
      );
    },
    revokeAccount(accountId) {
      for (const [ws, r] of clients)
        if (r.accountId === accountId) ws.terminate();
    },
    async close() {
      closing = true;
      clearInterval(heartbeat);
      for (const owned of accounts.values())
        for (const socket of owned) socket.destroy();
      await new Promise((resolve) => sockets.close(resolve));
      if (server.listening)
        await new Promise((resolve) => server.close(resolve));
    },
  };
}
