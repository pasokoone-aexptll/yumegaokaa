import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';import {randomUUID} from 'node:crypto';
test('招待: 発行→単回受領→資格→停止ユーザー再登録不可',async()=>{
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await c.connect();await c.query('begin');
 try{
 const users=[randomUUID(),randomUUID(),randomUUID()],sessions=users.map(()=>randomUUID());
 for(let i=0;i<3;i++){await c.query('insert into auth.users(id) values($1)',[users[i]]);await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessions[i],users[i]]);}
 await c.query('insert into app_private.members(account_id) values($1)',[users[0]]);
 async function call(i,op,p={}){await c.query('select set_config(\'request.jwt.claims\',$1,true)',[JSON.stringify({sub:users[i],session_id:sessions[i],role:'authenticated'})]);await c.query('set local role authenticated');const r=await c.query('select public.street_api($1,$2) result',[op,p]);await c.query('reset role');return r.rows[0].result;}
 const invite=await call(0,'invite_create');assert.ok(invite.code);
 assert.equal((await call(1,'invite_accept',{code:invite.code})).accepted,true);
 assert.ok((await call(1,'time')).server_time);
 await c.query('savepoint rejected');await assert.rejects(()=>call(2,'invite_accept',{code:invite.code}),/invalid_input/);await c.query('rollback to savepoint rejected');
 assert.equal((await call(0,'invite_list')).items[0].used,true);
 await c.query('update app_private.members set active=false where account_id=$1',[users[1]]);
 await c.query('savepoint banned');await assert.rejects(()=>call(1,'invite_accept',{code:invite.code}),/membership_required/);await c.query('rollback to savepoint banned');
 }finally{await c.query('rollback');await c.end();}
});
