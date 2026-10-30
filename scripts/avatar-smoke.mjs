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
const fixtures=[],dir=await mkdtemp(join(tmpdir(),'yumegaoka-avatar-'));
async function request(path,method,body,token=env.SERVICE_ROLE_KEY,type='application/json'){
 return fetch(env.API_URL+path,{method,headers:{apikey:env.PUBLISHABLE_KEY,Authorization:'Bearer '+token,'Content-Type':type,...(type==='image/jpeg'?{'x-upsert':'true'}:{})},...(body===undefined?{}:{body:type==='application/json'?JSON.stringify(body):body})});
}
async function rpc(user,operation,payload={}){const r=await request('/rest/v1/rpc/street_api','POST',{operation,payload},user.token);assert.ok(r.ok,'RPC '+operation+' '+r.status);return r.json();}
try{
 execFileSync('sips',['-s','format','jpeg','apps/mobile/assets/icon.png','--out',join(dir,'avatar.jpg')],{stdio:'ignore'});
 const image=await readFile(join(dir,'avatar.jpg'));assert.ok(image.length<=2097152);
 for(let i=0;i<2;i++){
  const email='avatar-'+randomUUID()+'@example.test',password=randomUUID()+randomUUID();
  const created=await request('/auth/v1/admin/users','POST',{email,password,email_confirm:true});assert.ok(created.ok,'fixture create');
  const user=await created.json();fixtures.push({id:user.id});
  const login=await request('/auth/v1/token?grant_type=password','POST',{email,password});assert.ok(login.ok,'fixture login');const session=await login.json();fixtures[i].token=session.access_token;
  await db.query('insert into app_private.members(account_id) values($1)',[user.id]);await rpc(fixtures[i],'profile_save',{display_name:'画像試験'});
 }
 const owner=fixtures[0],other=fixtures[1],path=owner.id+'/avatar.jpg';
 const upload=await request('/storage/v1/object/avatars/'+path,'POST',image,owner.token,'image/jpeg');assert.ok(upload.ok,'owner upload '+upload.status);
 const profile=await rpc(owner,'profile_avatar_set');assert.equal(profile.avatar_path,path);
 assert.equal((await request('/storage/v1/object/authenticated/avatars/'+path,'GET',undefined,other.token)).status,200,'member read');
 assert.ok(!(await request('/storage/v1/object/avatars/'+path,'POST',image,other.token,'image/jpeg')).ok,'other cannot overwrite');
 assert.ok(!(await request('/storage/v1/object/public/avatars/'+path,'GET',undefined,env.PUBLISHABLE_KEY)).ok,'not public');
 assert.ok(!(await request('/storage/v1/object/avatars/'+path,'POST',Buffer.alloc(2097153),owner.token,'image/jpeg')).ok,'2MB enforced');
 await db.query('update app_private.members set active=false where account_id=$1',[other.id]);
 assert.ok(!(await request('/storage/v1/object/authenticated/avatars/'+path,'GET',undefined,other.token)).ok,'stopped member cannot read');
 console.log('Storage統合成功: 所有者保存→プロフィール参照→会員読取→他人上書き/公開読取/2MB超過/停止会員拒否。');
}finally{
 for(const user of fixtures){
  await request('/storage/v1/object/avatars','DELETE',{prefixes:[user.id+'/avatar.jpg']});
  await db.query('delete from app_private.profiles where account_id=$1',[user.id]);await db.query('delete from app_private.members where account_id=$1',[user.id]);
  const removed=await request('/auth/v1/admin/users/'+user.id,'DELETE');assert.ok(removed.ok,'fixture cleanup');
 }
 await db.end();await rm(dir,{recursive:true,force:true});
}
