import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
const source = ts.transpileModule(readFileSync('apps/mobile/src/lib/entrySuccessDismissal.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function setup() {
  const exports = {}; let callback, delay;
  new Function('exports','setTimeout','clearTimeout',source)(exports, (fn, ms) => {callback=fn;delay=ms;return 1;}, () => {callback=null;});
  return { schedule:exports.scheduleEntrySuccessDismissal, fire:()=>callback?.(), delay:()=>delay };
}
test('successful sheet closes after 3000ms',()=>{ const s=setup();let count=0;s.schedule(()=>true,()=>count++);assert.equal(s.delay(),3000);assert.equal(count,0);s.fire();assert.equal(count,1); });
test('manual dismissal cancels the pending automatic close',()=>{const s=setup();let count=0;const cancel=s.schedule(()=>true,()=>count++);cancel();s.fire();assert.equal(count,0);});
test('a stale success timer cannot close a new scan',()=>{const s=setup();let count=0;s.schedule(()=>false,()=>count++);s.fire();assert.equal(count,0);});
