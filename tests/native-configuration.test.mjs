import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
test('Android application methods do not override the Expo event-emitter lifecycle', () => {
 const source=readFileSync('apps/mobile/modules/presence-native/android/src/main/java/jp/yumegaoka/presence/PresenceNativeModule.kt','utf8');
 const methods=[...source.matchAll(/(?:AsyncFunction|Function)\("([^"]+)"\)/g)].map(match=>match[1]);
 // Expo invokes these with an event name when listeners are attached/removed.
 for(const reserved of ['startObserving','stopObserving','addListener','removeListener','removeAllListeners'])
  assert.ok(!methods.includes(reserved), `Application method shadows Expo.${reserved}`);
});
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
