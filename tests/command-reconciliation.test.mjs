import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
test('画面復帰の結果照会は再送・取消を行わず、確定結果だけ片付ける', async () => {
  for (const terminal of ['completed', 'expired', 'canceled']) {
    const store = new Map(), calls = []; let status = {};
    const api = {};
    new Function('require','exports',ts.transpileModule(readFileSync('apps/mobile/src/lib/commands.ts','utf8'),{
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText)((id) => id.includes('SecureStore') || id.includes('secure-store') ? {
      getItemAsync: async k => store.get(k) ?? null,
      setItemAsync: async (k,v) => store.set(k,v),
      deleteItemAsync: async k => store.delete(k),
    } : { url:'test', native:{ session:async()=>({signed_in:true,email:'test'}),rpc:async(name)=>{
      calls.push(name);
      if(name==='command_prepare') return {id:'receipt'};
      if(name==='command_execute') throw Error('lost response');
      if(name==='command_status') return status;
      throw Error('unexpected mutation');
    }} },api);
    await assert.rejects(api.submitCommand('denshin_mode',{id:'pin',recruiting:true}));
    calls.length=0;
    assert.ok(await api.reconcilePendingCommand('denshin_mode'));
    assert.deepEqual(calls,['command_status']);
    status={ [terminal]:true }; calls.length=0;
    assert.equal(await api.reconcilePendingCommand('denshin_mode'),null);
    assert.deepEqual(calls,['command_status']);
    assert.equal(store.size,0);
  }
});
