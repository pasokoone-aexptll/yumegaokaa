import test from 'node:test';
import assert from 'node:assert/strict';
import {maintenanceTick} from '../scripts/lib/maintenance.mjs';
for(const scenario of ['success','storage_failure','auth_failure','already_deleted']){
 test(`worker erasure: ${scenario}`,async()=>{
  const old=globalThis.fetch;const calls=[];let claimed=false;
  globalThis.fetch=async(url,init)=>{
   const path=new URL(url).pathname,b=JSON.parse(init.body);calls.push({path,b});
   if(path.endsWith('/icon_cleanup'))return Response.json({});
   if(path.endsWith('/maintenance_jobs')){
    if(b.operation==='claim'){if(claimed)return Response.json({});claimed=true;return Response.json({id:'job',lease:'lease',account_id:'account'});}
    return Response.json({});
   }
   if(path.endsWith('/account_erasure'))return Response.json(b.operation==='assets'?{assets:[{bucket:'avatars',path:'account/avatar.jpg'}]}:{prepared:true});
   if(path.startsWith('/storage/'))return new Response('',{status:scenario==='storage_failure'?500:200});
   if(path.startsWith('/auth/'))return new Response('',{status:scenario==='auth_failure'?500:scenario==='already_deleted'?404:200});
   throw Error('unexpected request');
  };
  try{await maintenanceTick({apiURL:'https://example.invalid',serviceKey:'test-only'})();}finally{globalThis.fetch=old;}
  const finish=calls.some(x=>x.path.endsWith('/maintenance_jobs')&&x.b.operation==='finish');
  assert.equal(finish,['success','already_deleted'].includes(scenario));
  assert.equal(calls.some(x=>x.b.operation==='retry'),!finish);
  const auth=calls.findIndex(x=>x.path.startsWith('/auth/'));
  if(scenario==='storage_failure')assert.equal(auth,-1);
  else {assert.equal(calls[auth].b.should_soft_delete,false);assert.ok(calls.findIndex(x=>x.b.operation==='prepare_auth_delete')<auth);}
 });
}
