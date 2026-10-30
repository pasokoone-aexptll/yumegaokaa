import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
test('restore uncertain event and resend the identical body after a restart', async () => {
 const original={street_id:'street',title:'event',description:'description',starts_at:'2027-01-01T00:00:00.000Z',ends_at:'2027-01-01T01:00:00.000Z',longitude:139,latitude:35,capacity:20};
 let draft={kind:'recruitment',title:'',description:'',starts:'',ends:'',capacity:'20'};
 let index=0,first=true;const slots=[],effects=[],sent=[],routes=[];
 const react={
  useState:initial=>{const i=index++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>{slots[i]=value;}];},
  useEffect:callback=>{if(first)effects.push(callback);},
 };
 const commands={
  pendingCommand:async kind=>kind==='event_create'?{id:'receipt',body:original}:null,
  submitCommand:async(kind,body)=>{sent.push({kind,body});return {id:'created'};},
  cancelPendingCommand:async()=>null,
 };
 const exports={};
 new Function('require','exports',ts.transpileModule(readFileSync('apps/mobile/src/hooks/usePinCreation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>{
  if(id==='react')return react;
  if(id==='expo-router')return {router:{replace:r=>routes.push(r)}};
  if(id.includes('pinDraft'))return {usePinDraft:()=>draft,updateDraft:p=>{draft={...draft,...p};},clearDraft:()=>{}};
  if(id.includes('commands'))return commands;
  return {native:{},streetID:'street'};
 },exports);
 const render=()=>{index=0;return exports.usePinCreation();};
 render();first=false;effects.forEach(effect=>effect());
 await new Promise(resolve=>setImmediate(resolve));
 const recovered=render();
 assert.equal(recovered.draft.kind,'event');
 assert.deepEqual(recovered.draft.location,[139,35]);
 assert.equal(recovered.locked,true);
 await recovered.publish();
 assert.deepEqual(sent,[{kind:'event_create',body:original}]);
 assert.equal(routes[0].params.id,'created');
});
