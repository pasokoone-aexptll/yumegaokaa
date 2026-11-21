const ts = require('../apps/mobile/node_modules/typescript');
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const out = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('apps/mobile/src/lib/chatRows.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {exports:out});
const profile = {display_name:'me',avatar_path:'self.jpg',avatar_updated_at:'v2'};
const pending = {key:'local-1',created_at:'2026-11-21T00:00:01Z'};
const before = out.chatRows([],[],pending,'hello',{},profile);
const echo = {id:'server-1',body:'hello',...pending};
const receipt = out.chatRows([],[echo],null,null,{'server-1':'local-1'},profile);
const server = {...before[0],id:'server-1',local:undefined,sending:undefined,avatar_updated_at:'old'};
const after = out.chatRows([server],[echo],null,null,{'server-1':'local-1'},profile);
for (const rows of [before,receipt,after]) {
 assert.equal(rows.length,1);
 assert.equal(rows[0].rowKey,'local-1');
 assert.equal(rows[0].avatar_path,'self.jpg');
 assert.equal(rows[0].avatar_updated_at,'v2');
 assert.equal(rows[0].body,'hello');
}
assert.equal(out.chatRows([server],[],null,null,{'server-1':'local-1'},profile)[0].rowKey,'local-1');
const other = {...server,id:'other',mine:false,avatar_path:'other.jpg',created_at:'2026-11-21T00:00:00Z'};
assert.equal(out.chatRows([server,other],[],null,null,{},profile)[0].avatar_path,'other.jpg');
assert.equal(out.chatRows([],[],null,null,{},profile).length,0);
console.log('chat rows: stable identity, receipt dedup, cached self identity, other author and cancellation passed');
