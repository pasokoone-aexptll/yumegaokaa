import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
test('プロフィール: 実RPC保存・別アカウント分離・未会員拒否・中核互換',async()=>{
 const c=new pg.Client({connectionString:process.env.TEST_DATABASE_URL??'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await c.connect();await c.query('begin');
 try{
 const users=[randomUUID(),randomUUID()],sessions=[randomUUID(),randomUUID()];
 for(let i=0;i<2;i++){await c.query('insert into auth.users(id) values($1)',[users[i]]);await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessions[i],users[i]]);await c.query('insert into app_private.members(account_id) values($1)',[users[i]]);}
 const call=async(i,op,p={})=>{await c.query('select set_config(\'request.jwt.claims\',$1,true)',[JSON.stringify({sub:users[i],session_id:sessions[i],role:'authenticated'})]);await c.query('set local role authenticated');const result=(await c.query('select public.street_api($1,$2) r',[op,p])).rows[0].r;await c.query('reset role');return result;};
 assert.equal((await call(0,'profile_save',{display_name:'夢ヶ丘テスト',account_id:users[1]})).display_name,'夢ヶ丘テスト');
 assert.equal((await call(0,'profile_get')).display_name,'夢ヶ丘テスト');
 assert.equal((await call(1,'profile_get')).display_name,'');
 assert.ok((await call(0,'time')).server_time);
 await c.query('update app_private.members set active=false where account_id=$1',[users[0]]);
 await c.query('savepoint rejected');
 await assert.rejects(()=>call(0,'profile_get'),/membership_required/);
 await c.query('rollback to savepoint rejected');
 }finally{await c.query('rollback');await c.end();}
});
