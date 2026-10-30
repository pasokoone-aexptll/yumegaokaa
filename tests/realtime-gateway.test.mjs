import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import WebSocket from "ws";
import { createRealtimeGateway } from "../scripts/lib/realtime-gateway.mjs";

test("real websocket admission permits three sockets, releases on close, and cuts revoked accounts", async () => {
  let active = true;
  const gateway = createRealtimeGateway({
    authorize: async (token) =>
      token === "valid" && active
        ? { accountId: "a", sessionId: "s", streetId: "street" }
        : null,
  });
  gateway.server.listen(0, "127.0.0.1");
  await once(gateway.server, "listening");
  const url = `ws://127.0.0.1:${gateway.server.address().port}/street`;
  const clients = [];
  const connect = () =>
    new Promise((resolve, reject) => {
      const ws = new WebSocket(url, {
        headers: { Authorization: "Bearer valid" },
      });
      clients.push(ws);
      ws.on("error", reject);
      ws.once("message", (data) => resolve({ ws, data: JSON.parse(data) }));
    });
  try {
    const outcomes = await Promise.allSettled([
      connect(),
      connect(),
      connect(),
      connect(),
    ]);
    assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 3);
    assert.match(
      outcomes.find((x) => x.status === "rejected").reason.message,
      /429/,
    );
    const accepted = outcomes
      .filter((x) => x.status === "fulfilled")
      .map((x) => x.value.ws);
    for (const x of outcomes.filter((x) => x.status === "fulfilled"))
      assert.equal(x.value.data.type, "ready");
    const received = once(accepted[0], "message");
    await gateway.changed("street");
    assert.deepEqual(JSON.parse((await received)[0]), { type: "changed" });
    const closed = once(accepted[0], "close");
    accepted[0].close();
    await closed;
    // Peer close reaches the server asynchronously; wait until that close event
    // has been processed, without adding a product reconnect delay.
    await new Promise((resolve) => setTimeout(resolve, 20));
    const replacement = await connect();
    assert.equal(replacement.data.type, "ready");
    const endings = [accepted[1], accepted[2], replacement.ws].map((ws) =>
      once(ws, "close"),
    );
    active = false;
    await gateway.revalidate();
    await Promise.all(endings);
    await assert.rejects(connect(), /403/);
  } finally {
    for (const ws of clients) ws.terminate();
    await gateway.close();
  }
});
