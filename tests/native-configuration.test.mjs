import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
test('screen remounts share native configuration; failed configuration can retry', async () => {
 let calls=0,fail=false;
 const bridge={configure:async()=>{calls++;if(fail)throw Error('configuration_failed');}};
 const exports={};
 const source=ts.transpileModule(readFileSync('apps/mobile/src/lib/native.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','exports',source)(name=>name==='expo-modules-core'?{requireNativeModule:()=>bridge}:{sessionState:{publish(){}}},exports);
 await Promise.all([exports.native.configure('http://localhost','key'),exports.native.configure('http://localhost','key')]);
 await exports.native.configure('http://localhost','key');assert.equal(calls,1);
 fail=true;await assert.rejects(exports.native.configure('http://other-localhost','key'));
 fail=false;await exports.native.configure('http://other-localhost','key');assert.equal(calls,3);
});
