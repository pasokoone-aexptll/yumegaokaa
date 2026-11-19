import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
test('discard survives offline and reload; old body is never restored or replayed',async()=>{
 const data=new Map(),calls=[];let offline=false,number=0;
 const native={session:async()=>({signed_in:true,email:'test@example.invalid'}),rpc:async(op,p)=>{
  calls.push([op,p]);if(offline)throw Error('offline');
  if(op==='command_prepare')return {id:`receipt-${++number}`};
  if(op==='command_execute'&&number===1)throw Error('response lost');
  if(op==='command_cancel')return {completed:true,result:{id:'previous-pin'}};
  return {id:'new-pin'};
 }};
 function load(){const e={};new Function('require','exports',ts.transpileModule(readFileSync('apps/mobile/src/lib/commands.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(id=>id==='expo-secure-store'?{getItemAsync:async k=>data.get(k)??null,setItemAsync:async(k,v)=>data.set(k,v),deleteItemAsync:async k=>data.delete(k)}:{native,url:'https://test.invalid'},e);return e;}
 let api=load();await assert.rejects(api.submitCommand('denshin_create',{body:'old'}),/response lost/);
 offline=true;await api.discardPendingCommand('denshin_create');await new Promise(r=>setImmediate(r));
 api=load();assert.equal(await api.pendingCommand('denshin_create'),null);
 await assert.rejects(api.submitCommand('denshin_create',{body:'new'}),/offline/);
 offline=false;assert.deepEqual(await api.submitCommand('denshin_create',{body:'new'}),{id:'new-pin'});
 assert.deepEqual(calls.filter(([op])=>op==='command_execute').map(([,p])=>p.body),[{body:'old'},{body:'new'}]);
 assert.equal(data.size,0);
});
