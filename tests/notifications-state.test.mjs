import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
test('a list fetched before acknowledgement cannot restore unread state', async () => {
  let resolveList;
  let index=0;
  const state=[];
  const exports={};
  const native={rpc: operation => operation==='notification_list'
    ? new Promise(resolve => {resolveList=resolve;})
    : Promise.resolve({read:true})};
  const react={
    useRef:value=>({current:value}),
    useCallback:value=>value,
    useState:initial=>{
      const slot=index++;state[slot]=initial;
      return [initial,next=>{state[slot]=typeof next==='function'?next(state[slot]):next;}];
    },
  };
  const source=ts.transpileModule(readFileSync('apps/mobile/src/hooks/useNotifications.ts','utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','exports',source)(id=>{
    if(id==='react')return react;
    if(id==='expo-router')return {useFocusEffect:()=>{}};
    if(id==='react-native')return {AppState:{}};
    if(id.includes('streetChanges'))return {};
    return {native};
  },exports);
  const hook=exports.useNotifications();
  const notice={id:'n1',read:false};
  state[0]=[notice];
  const pending=hook.load();
  assert.equal(await hook.markRead(notice),true);
  resolveList({items:[notice]});
  await pending;
  assert.equal(state[0][0].read,true);
});
