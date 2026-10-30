import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";
const exports = {};
new Function(
  "exports",
  ts.transpileModule(
    readFileSync("apps/mobile/src/lib/gatewayConnection.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(exports);
const tick = () => new Promise((r) => setTimeout(r, 10));
test("foreground reconnect renews token and reloads; background cancels pending auth", async () => {
  const sockets = [];
  let tokens = 0,
    changes = 0;
  const connection = exports.gatewayConnection({
    token: async () => String(++tokens),
    retryMs: 1,
    connect(token) {
      const s = {
        token,
        close() {
          this.closed = true;
          this.onclose?.();
        },
      };
      sockets.push(s);
      return s;
    },
    changed() {
      changes++;
    },
  });
  connection.setActive(true);
  await tick();
  sockets[0].onmessage({ data: '{"type":"ready"}' });
  assert.equal(changes, 1);
  sockets[0].onclose();
  await tick();
  assert.equal(sockets.length, 2);
  assert.equal(sockets[1].token, "2");
  sockets[1].onmessage({ data: '{"type":"changed"}' });
  assert.equal(changes, 2);
  connection.setActive(false);
  await tick();
  assert.equal(sockets.length, 2);
  assert.ok(sockets[1].closed);
  connection.setActive(true);
  await tick();
  assert.equal(sockets.length, 3);
  connection.setActive(false);
  let resolve;
  let opened = 0;
  const late = exports.gatewayConnection({
    token: () => new Promise((r) => (resolve = r)),
    connect() {
      opened++;
    },
    changed() {},
  });
  late.setActive(true);
  late.setActive(false);
  resolve("late");
  await tick();
  assert.equal(opened, 0);
});
