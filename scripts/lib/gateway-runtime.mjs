import pg from "pg";
import { createRealtimeGateway } from "./realtime-gateway.mjs";
import { gatewayAuthorizer } from "./gateway-authorize.mjs";

export async function startGateway({
  dbURL,
  apiURL,
  publishableKey,
  streetId,
  rollingDeployment = false,
  port = 54325,
  host = "127.0.0.1",
}) {
  const listener = new pg.Client({
    connectionString: dbURL,
    keepAlive: true,
    statement_timeout: 5000,
  });
  const db = new pg.Pool({
    connectionString: dbURL,
    max: 4,
    statement_timeout: 4000,
    connectionTimeoutMillis: 4000,
  });
  let ownsLock = false;
  const gateway = createRealtimeGateway({
    accepting: () => ownsLock && !closed,
    authorize: gatewayAuthorizer({ apiURL, publishableKey, db, streetId }),
  });
  let closed = false,
    timer,
    queued = false,
    running = false;
  async function close() {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    await gateway.close();
    await listener.end().catch(() => {});
    await db.end();
  }
  async function flush() {
    if (closed) return;
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      await gateway.changed(streetId);
    } finally {
      running = false;
      if (queued && !closed) {
        queued = false;
        void flush();
      }
    }
  }
  listener.on("error", () => {
    void close();
  });
  listener.on("end", () => {
    void close();
  });
  db.on("error", () => {
    void close();
  });
  try {
    await listener.connect();
    // One gateway owns every socket in this DB deployment. Lock dies with the
    // dedicated LISTEN connection; losing it closes all sockets, never fails open.
    async function acquire() {
      ownsLock = (await listener.query("select pg_try_advisory_lock(19460831,3) acquired")).rows[0].acquired;
    }
    await acquire();
    if (!ownsLock && !rollingDeployment)
      throw Error("Another gateway already owns this database");
    await listener.query("LISTEN yumegaoka_gateway_changed");
    listener.on("notification", () => { if (ownsLock) void flush(); });
    // Render drains the previous instance only after its replacement serves HTTP.
    // During handover, clients retry WebSocket upgrades until the lock transfers.
    await new Promise((resolve, reject) => {
      gateway.server.once("error", reject);
      gateway.server.listen(port, host, resolve);
    });
    while (!ownsLock && !closed) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!closed) await acquire();
    }
    if (closed) throw Error("Gateway closed during handover");
    timer = setInterval(() => {
      void gateway.revalidate();
    }, 5000);
    timer.unref();
    return { gateway, close, address: gateway.server.address() };
  } catch (error) {
    await close();
    throw error;
  }
}
