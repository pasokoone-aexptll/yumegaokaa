import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
const env=JSON.parse(execFileSync('npx',['supabase','status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
assert.equal(new URL(env.API_URL).hostname,'127.0.0.1');
const db=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await db.connect();
const fixtures=[],dir=await mkdtemp(join(tmpdir(),'yumegaoka-pool-'));
async function request(path,method,body,token=env.SERVICE_ROLE_KEY,type='application/json'){
 return fetch(env.API_URL+path,{method,headers:{apikey:env.PUBLISHABLE_KEY,Authorization:'Bearer '+token,'Content-Type':type,...(type==='image/jpeg'?{'x-upsert':'true'}:{})},...(body===undefined?{}:{body:type==='application/json'?JSON.stringify(body):body})});
}
async function rpc(user,operation,payload={}){const r=await request('/rest/v1/rpc/street_api','POST',{operation,payload},user.token);assert.ok(r.ok,'RPC '+operation+' '+r.status);return r.json();}
try{
 execFileSync('sips',['-s','format','jpeg','apps/mobile/assets/icon.png','--out',join(dir,'avatar.jpg')],{stdio:'ignore'});
 const image=await readFile(join(dir,'avatar.jpg'));assert.ok(image.length<=2097152);
 for(let i=0;i<2;i++){
  const email='pool-'+randomUUID()+'@example.test',password=randomUUID()+randomUUID();
  const created=await request('/auth/v1/admin/users','POST',{email,password,email_confirm:true});assert.ok(created.ok,'fixture create');
  const user=await created.json();fixtures.push({id:user.id});
  const login=await request('/auth/v1/token?grant_type=password','POST',{email,password});assert.ok(login.ok,'fixture login');const session=await login.json();fixtures[i].token=session.access_token;
  await db.query('insert into app_private.members(account_id) values($1)',[user.id]);await rpc(fixtures[i],'profile_save',{display_name:'画像試験'});
 }

 const owner=fixtures[0],other=fixtures[1],street_id='11111111-1111-4111-8111-111111111111';
 const pending=await rpc(owner,'street_icon_prepare',{street_id}),path=pending.upload_path;
 owner.path=path;
 assert.ok((await request('/storage/v1/object/street-icons/'+path,'POST',image,owner.token,'image/jpeg')).ok,'upload bytes');
 const published=await rpc(owner,'street_icon_publish',{street_id,id:pending.id});
 assert.equal(published.contribution_path,path);
 assert.ok(published.contributed);
 const read=await request('/storage/v1/object/authenticated/street-icons/'+path,'GET',undefined,other.token);
 assert.equal(read.status,200);
 assert.deepEqual(Buffer.from(await read.arrayBuffer()),image,'actual image bytes');
 assert.ok(!(await request('/storage/v1/object/street-icons/'+path,'POST',image,other.token,'image/jpeg')).ok,'other cannot overwrite');
 assert.ok(!(await request('/storage/v1/object/street-icons/'+path,'POST',image,owner.token,'image/jpeg')).ok,'published image immutable');
 assert.ok(!(await request('/storage/v1/object/public/street-icons/'+path,'GET',undefined,env.PUBLISHABLE_KEY)).ok,'not public');
 await rpc(owner,'street_icon_remove',{street_id,id:pending.id});
 assert.ok(!(await request('/storage/v1/object/authenticated/street-icons/'+path,'GET',undefined,other.token)).ok,'withdrawn image inaccessible');
 assert.equal((await rpc(owner,'street_icon_get',{street_id})).contributed,true);
 const forbidden=await request('/rest/v1/rpc/icon_cleanup','POST',{operation:'claim'},owner.token);
 assert.ok(!forbidden.ok,'ordinary members cannot claim cleanup');
 const expired=await rpc(other,'street_icon_prepare',{street_id});other.path=expired.upload_path;
 assert.ok((await request('/storage/v1/object/street-icons/'+other.path,'POST',image,other.token,'image/jpeg')).ok,'unfinished upload bytes');
 await db.query("update app_private.street_icons set created_at=now()-interval '25 hours' where id=$1",[expired.id]);
 assert.ok(!(await request('/storage/v1/object/authenticated/street-icons/'+other.path,'GET',undefined,other.token)).ok,'expired unfinished image inaccessible');
 execFileSync('node',['scripts/maintenance-worker.mjs','--once'],{stdio:'pipe'});
 assert.equal((await db.query("select count(*)::int n from storage.objects where bucket_id='street-icons' and name=$1",[other.path])).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int n from app_private.street_icons where id=$1',[expired.id])).rows[0].n,0);

 assert.equal((await db.query("select count(*)::int n from storage.objects where bucket_id='street-icons' and name=$1",[path])).rows[0].n,0);
 assert.equal((await db.query('select count(*)::int n from app_private.street_icons where id=$1',[pending.id])).rows[0].n,0);
 console.log('街pool実Storage統合成功: 画像保存/会員読取/上書き拒否/取り下げ拒否/worker物理削除/24時間未公開画像削除/登録完了維持。');

}finally{
 for(const user of fixtures){
  if(user.path) await request('/storage/v1/object/street-icons','DELETE',{prefixes:[user.path]});
  await db.query('delete from app_private.daily_street_icons where account_id=$1 or icon_id in(select id from app_private.street_icons where owner_id=$1)',[user.id]);
  await db.query('delete from app_private.street_icons where owner_id=$1',[user.id]);
  await db.query('delete from app_private.icon_enrollments where account_id=$1',[user.id]);
  await db.query('delete from app_private.profiles where account_id=$1',[user.id]);await db.query('delete from app_private.members where account_id=$1',[user.id]);
  const removed=await request('/auth/v1/admin/users/'+user.id,'DELETE');assert.ok(removed.ok,'fixture cleanup');
 }
 await db.end();await rm(dir,{recursive:true,force:true});
}
