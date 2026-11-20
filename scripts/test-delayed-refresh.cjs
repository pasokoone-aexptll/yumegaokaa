const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require(process.cwd() + "/apps/mobile/node_modules/typescript");
let state = false,
  deps,
  cleanup,
  effect,
  now = 0,
  next = 0;
const timers = new Map();
const react = {
  useState: () => [
    state,
    (v) => {
      state = v;
    },
  ],
  useEffect: (fn, d) => {
    if (!deps || deps[0] !== d[0]) {
      cleanup?.();
      effect = fn;
      deps = d;
    }
  },
};
const moduleMock = { exports: {} };
const source = fs.readFileSync(
  "apps/mobile/src/hooks/useDelayedRefreshStatus.ts",
  "utf8",
);
vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS }), {
  exports: moduleMock.exports,
  require: () => react,
  setTimeout: (fn, ms) => {
    timers.set(++next, { fn, at: now + ms });
    return next;
  },
  clearTimeout: (id) => timers.delete(id),
});
const render = (failed) => {
  let result = moduleMock.exports.useDelayedRefreshStatus(failed);
  if (effect) {
    const fn = effect;
    effect = null;
    cleanup = fn();
    result = moduleMock.exports.useDelayedRefreshStatus(failed);
  }
  return result;
};
const advance = (ms) => {
  now += ms;
  for (const [id, t] of timers) {
    if (t.at <= now) {
      timers.delete(id);
      t.fn();
    }
  }
};
assert.equal(render(false), false);
assert.equal(render(true), false);
advance(29000);
assert.equal(render(true), false);
assert.equal(render(false), false);
advance(1000);
assert.equal(render(false), false);
assert.equal(render(true), false);
advance(30000);
assert.equal(render(true), true);
assert.equal(render(false), false);
assert.equal(render(true), false);
advance(29999);
assert.equal(render(true), false);
cleanup?.();
advance(1);
assert.equal(state, false);
console.log(
  "PASS: transient failure hidden; sustained failure shown; recovery resets; unmount cancels",
);
