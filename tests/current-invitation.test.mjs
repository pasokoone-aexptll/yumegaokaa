import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
test('current QR restores, rotates without quota loss, preserves recipients and isolates issuers', async()=>{
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await c.connect();await c.query('begin');
 try {
 if(!(await c.query("select to_regclass('app_private.current_invitation_qr') present")).rows[0].present) await c.query(fs.readFileSync('supabase/migrations/202611190053_current_invitation_qr.sql','utf8').replace(/^begin;\s*/,'').replace(/commit;\s*$/,''));
 const uid=randomUUID(), sid=randomUUID(), other=randomUUID(), osid=randomUUID();
 for(const [u,s] of [[uid,sid],[other,osid]]){await c.query('insert into auth.users(id) values($1)',[u]);await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[s,u]);await c.query('insert into app_private.members(account_id) values($1)',[u]);}
 const auth=async(u,s)=>c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:u,session_id:s,role:'authenticated'})]);
 const rpc=async(op,p={})=>(await c.query('select public.street_api($1,$2) result',[op,p])).rows[0].result;
 const create=async(body={})=>{const receipt=await rpc('command_prepare',{kind:'invite_create'});return rpc('command_execute',{id:receipt.id,body});};
 await auth(uid,sid);
 const first=await create({mode:'ensure'}); const initial=await rpc('invite_list');assert.equal(initial.current.code,first.code);assert.equal(initial.remaining,4);
 assert.equal((await create({mode:'ensure'})).code,first.code);
 const next=await create();assert.equal(next.id,first.id);assert.notEqual(next.code,first.code);assert.equal((await rpc('invite_list')).remaining,4);
 assert.equal((await c.query("select count(*)::int n from app_private.invitations where code_hash=sha256(convert_to($1,'UTF8'))",[first.code])).rows[0].n,0);
 await auth(other,osid);assert.equal((await rpc('invite_list')).current,undefined);
 await auth(uid,sid);
 await c.query('update app_private.invitations set used_by=$1,used_at=clock_timestamp() where id=$2',[other,first.id]);
 assert.equal((await rpc('invite_list')).current,undefined);
 const fresh=await create({mode:'ensure'});assert.notEqual(fresh.id,first.id);assert.equal((await rpc('invite_list')).remaining,3);
 assert.equal((await c.query('select active from app_private.members where account_id=$1',[other])).rows[0].active,true);
 assert.equal((await c.query('select revoked_at from app_private.invitations where id=$1',[first.id])).rows[0].revoked_at,null);
 } finally {await c.query('rollback');await c.end();}
});
