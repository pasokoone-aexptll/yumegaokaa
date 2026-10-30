import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
const source = ts.transpileModule(readFileSync('apps/mobile/src/hooks/useRecruitmentDetail.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const blockExports = {};
new Function('exports', ts.transpileModule(readFileSync('apps/mobile/src/lib/localBlocks.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(blockExports);
const { localBlocks } = blockExports;
function harness(rpc) {
  const slots = []; let index = 0;
  const exports = {};
  new Function('require','exports',source)(id => {
    if(id.includes('localBlocks'))return {localBlocks};
    if(id === 'react') return {
      useState(initial) { const i=index++; if(!(i in slots))slots[i]=initial; return [slots[i],v=>{slots[i]=v;}]; },
      useRef(initial) { const i=index++; if(!(i in slots))slots[i]={current:initial}; return slots[i]; },
      useCallback: value => value,
    };
    if(id === 'expo-router') return { useFocusEffect() {} };
    if(id === 'react-native') return { AppState:{} };
    if(id.includes('streetChanges'))return {streetChanges:{notify(){}}};
    return {native:{rpc}};
  },exports);
  return () => {index=0;return exports.useRecruitmentDetail('r1');};
}
test('refresh and connection recovery preserve draft and original revision', async()=>{
  let fail=false;
  let current={id:'r1',title:'original',revision:1};
  const render=harness(async()=>{if(fail)throw Error('offline');return current;});
  await render().load();
  render().editTitle('my draft');
  current={...current,title:'other device',revision:2};
  await render().load();
  assert.equal(render().title,'my draft');
  assert.equal(render().pin.revision,1);
  fail=true;await render().load();assert.equal(render().pin,undefined);
  fail=false;await render().load();assert.equal(render().pin.revision,1);
  await render().load(true);
  assert.equal(render().title,'other device');assert.equal(render().pin.revision,2);
});
test('an ended pin is removed and subsequent refresh cannot resurrect it',async()=>{
  let calls=0;
  const render=harness(async()=>{calls++;throw Error('not_found');});
  await render().load();
  assert.equal(render().ended,true);assert.equal(render().pin,undefined);
  await render().load();assert.equal(calls,1);
});

test('a read started before block cannot restore the recruitment location',async()=>{
  localBlocks.clear();
  let resolve;
  const render=harness(()=>new Promise(r=>{resolve=r;}));
  const pending=render().load();
  localBlocks.set('author',true);
  resolve({id:'r1',author_id:'author',title:'old response',revision:1});
  await pending;
  assert.equal(render().pin,undefined);
  localBlocks.set('author',false);
  const reopened=render().load();
  resolve({id:'r1',author_id:'author',title:'current',revision:1});
  await reopened;
  assert.equal(render().pin.title,'current');
  localBlocks.clear();
});
