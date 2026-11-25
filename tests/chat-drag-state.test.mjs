import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";

const source = ts.transpileModule(
  readFileSync("apps/mobile/src/hooks/useStreetChat.ts", "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  },
).outputText;

test("ending a chat drag collapses presentation without clearing history or resuming auto-follow", async () => {
  const states = [];
  let calls = 0;
  const message = {
    id: "old",
    author_id: "peer",
    created_at: "2026-11-01T00:00:00Z",
  };
  const exports = {};
  new Function("require", "exports", source)((id) => {
    if (id === "react")
      return {
        useContext: () => ({}),
        useCallback: (fn) => fn,
        useEffect() {},
        useRef: (value) => ({ current: value }),
        useState: (value) => {
          const index = states.length;
          states.push(value);
          return [
            value,
            (next) => {
              states[index] =
                typeof next === "function" ? next(states[index]) : next;
            },
          ];
        },
      };
    if (id.endsWith("chatReadPolicy")) return { readSpacingMs: 0, showReadFailure: () => false };
    if (id.endsWith("chatMentions")) return { chatAuthors: () => [] };
    if (id.endsWith("readRetry")) {
      const retry = {};
      const src = readFileSync("apps/mobile/src/lib/readRetry.ts", "utf8");
      new Function("exports",ts.transpileModule(src, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(retry);
      return retry;
    }
    if (id.endsWith("chatWindow"))
      return { readChatWindow: async (page) => page() };
    if (id.endsWith("localBlocks"))
      return { localBlocks: { hidden: () => false } };
    if (id.endsWith("useChatComposer")) return { useChatComposer: () => ({}) };
    if (id.endsWith("native"))
      return {
        streetID: "street",
        native: {
          rpc: async () => {
            calls++;
            return { items: [message] };
          },
        },
      };
    return {};
  }, exports);
  const hook = exports.useStreetChat();
  hook.reload();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(states[0], [message]);
  hook.beginHistory();
  assert.equal(states[3], true);
  assert.equal(hook.readingHistory.current, true);
  hook.endHistoryDrag();
  assert.equal(states[3], false);
  assert.equal(hook.readingHistory.current, true);
  assert.deepEqual(states[0], [message]);
  assert.equal(calls, 1, "collapse must not refetch/reset history");
  hook.followLatest();
  assert.equal(hook.readingHistory.current, false);
});
