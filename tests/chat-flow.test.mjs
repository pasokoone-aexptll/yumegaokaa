import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';import {randomUUID} from 'node:crypto';
test('統合: プロフィール→会話→別人閲覧→削除→再送/ブロック→受付失効',async()=>{
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await c.connect();await c.query('begin');
 try{
 const users=[randomUUID(),randomUUID()],sessions=users.map(()=>randomUUID()),street=randomUUID();
 for(let i=0;i<2;i++){await c.query('insert into auth.users(id) values($1)',[users[i]]);await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessions[i],users[i]]);await c.query('insert into app_private.members(account_id) values($1)',[users[i]]);}
 await c.query("insert into app_private.streets(id,name) values($1,'chat integration')",[street]);
 async function rpc(i,op,p={}){await c.query('select set_config(\'request.jwt.claims\',$1,true)',[JSON.stringify({sub:users[i],session_id:sessions[i],role:'authenticated'})]);await c.query('set local role authenticated');const r=(await c.query('select public.street_api($1,$2) r',[op,p])).rows[0].r;await c.query('reset role');return r;}
 await rpc(0,'profile_save',{display_name:'話し手'});await rpc(1,'profile_save',{display_name:'閲覧者'});
 const ticket=await rpc(0,'command_prepare',{kind:'chat_send'}),body={street_id:street,body:'街にいるよ'};
 const created=await rpc(0,'command_execute',{id:ticket.id,body});
 assert.equal((await rpc(0,'command_execute',{id:ticket.id,body})).id,created.id);
 assert.equal((await rpc(1,'chat_list',{street_id:street})).items[0].body,body.body);
 await rpc(0,'profile_save',{display_name:'新しい名前'});
 assert.equal((await rpc(1,'chat_list',{street_id:street})).items[0].display_name,'新しい名前');
 await rpc(0,'chat_delete',{id:created.id});await rpc(0,'command_execute',{id:ticket.id,body});
 const deleted=(await rpc(1,'chat_list',{street_id:street})).items[0];assert.equal(deleted.deleted,true);assert.equal(deleted.body,null);
 await rpc(1,'block_set',{account_id:users[0],blocked:true});assert.equal((await rpc(1,'chat_list',{street_id:street})).items.length,0);
 const expired=await rpc(0,'command_prepare',{kind:'chat_send'});await c.query("update app_private.commands set accept_until=now()-interval '1 second' where id=$1",[expired.id]);assert.equal((await rpc(0,'command_status',{id:expired.id})).expired,true);
 await c.query('savepoint reject');await assert.rejects(()=>rpc(0,'command_execute',{id:expired.id,body}),/attempt_expired/);await c.query('rollback to savepoint reject');
 const canceled=await rpc(0,'command_prepare',{kind:'chat_send'});
 assert.equal((await rpc(0,'command_cancel',{id:canceled.id})).canceled,true);
 await c.query('savepoint canceled');await assert.rejects(()=>rpc(0,'command_execute',{id:canceled.id,body}),/attempt_expired/);await c.query('rollback to savepoint canceled');
 const recovered=await rpc(0,'command_cancel',{id:ticket.id});assert.equal(recovered.completed,true);assert.equal(recovered.result.id,created.id);
 assert.equal((await c.query('select count(*) from app_private.messages where street_id=$1',[street])).rows[0].count,'1');
 }finally{await c.query('rollback');await c.end();}
});
