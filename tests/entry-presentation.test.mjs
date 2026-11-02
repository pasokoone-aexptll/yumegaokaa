import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
const source = ts.transpileModule(readFileSync('apps/mobile/src/hooks/useEntryPresentation.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function harness() {
  let now = 0, cursor = 0, deps, cleanup, effect;
  const states = [], timers = new Map();
  let serial = 0;
  const exports = {};
  new Function('require', 'exports', 'Date', 'setTimeout', 'clearTimeout', source)(() => ({
    useRef(initial) { const index = cursor++; if (!(index in states)) states[index] = { current: initial }; return states[index]; },
    useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; },
    useEffect(fn, next) { if (!deps || next.some((value, index) => value !== deps[index])) { cleanup?.(); deps = next; effect = fn; } },
  }), exports, { now: () => now }, (fn, delay) => { const id = ++serial; timers.set(id, { fn, due: now + delay }); return id; }, id => timers.delete(id));
  return {
    render(phase) { cursor = 0; const result = exports.useEntryPresentation(phase); if (effect) { const run = effect; effect = undefined; cleanup = run(); } return result; },
    advance(ms) { now += ms; for (const [id, timer] of timers) if (timer.due <= now) { timers.delete(id); timer.fn(); } },
    timers,
  };
}
test('fast server success remains checking until three seconds, without delaying actual state', () => {
  const h = harness();
  h.render('checking'); h.render('checking');
  h.advance(100);
  assert.equal(h.render('success'), 'checking');
  h.advance(2899); assert.equal(h.render('success'), 'checking');
  h.advance(1); assert.equal(h.render('success'), 'success');
});
test('cancellation removes the deferred success and never keeps the sheet alive', () => {
  const h = harness(); h.render('checking'); h.render('checking'); h.render('success');
  assert.equal(h.render(null), null); assert.equal(h.timers.size, 0);
  h.advance(4000); assert.equal(h.render(null), null);
});
test('a slow request does not add another three seconds after completion', () => {
  const h = harness(); h.render('scanning'); h.render('scanning'); h.advance(4000);
  h.render('success'); h.advance(0); assert.equal(h.render('success'), 'success');
});
