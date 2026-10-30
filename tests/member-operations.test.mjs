import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';import {randomUUID} from 'node:crypto';
test('利用停止で主催イベント通知・滞在終了、解除で復活なし、招待枠/停止反映',async()=>{
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await c.connect();await c.query('begin');
 try{
 const users=[randomUUID(),randomUUID(),randomUUID()],sessions=users.map(()=>randomUUID()),factor=randomUUID(),street=randomUUID(),event=randomUUID(),visit=randomUUID();
 for(let i=0;i<3;i++){await c.query('insert into auth.users(id) values($1)',[users[i]]);await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessions[i],users[i]]);await c.query('insert into app_private.members(account_id) values($1)',[users[i]]);}
 await c.query('insert into app_private.operators(account_id) values($1)',[users[0]]);
 await c.query("insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values($1,$2,'totp','verified',now(),now())",[factor,users[0]]);
 await c.query("update auth.sessions set factor_id=$1,aal='aal2' where id=$2",[factor,sessions[0]]);
 await c.query("insert into app_private.streets(id,name) values($1,'運営試験')",[street]);
 await c.query("insert into app_private.events(id,host_id,street_id,title,longitude,latitude,starts_at,ends_at) values($1,$2,$3,'試験',139,35,now()+interval '1 hour',now()+interval '2 hours')",[event,users[1],street]);
 await c.query('insert into app_private.registrations(event_id,account_id,joined) values($1,$2,true)',[event,users[2]]);
 await c.query("insert into app_private.visits(id,account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,$3,$4,now(),now()+interval '3 hours')",[visit,users[1],street,sessions[1]]);
 const call=async(i,op,p={})=>{await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:users[i],session_id:sessions[i],role:'authenticated',aal:i===0?'aal2':'aal1'})]);await c.query('set local role authenticated');const r=(await c.query('select public.street_api($1,$2) r',[op,p])).rows[0].r;await c.query('reset role');return r;};
 assert.ok((await call(0,'operator_members')).items.some(x=>x.account_id===users[1]));
 await call(1,'profile_save',{display_name:'主催者'});
 const invite=async()=>{const receipt=await call(1,'command_prepare',{kind:'invite_create'});return call(1,'command_execute',{id:receipt.id,body:{}});};
 const ticket=await call(1,'command_prepare',{kind:'chat_send'});
 await call(0,'operator_chat_restrict',{account_id:users[1],until_at:new Date(Date.now()+3600000).toISOString(),reason:'投稿制限'});
 assert.ok((await call(0,'operator_members')).items.find(x=>x.account_id===users[1]).chat_restricted_until);
 assert.equal((await c.query('select ended_at from app_private.visits where id=$1',[visit])).rows[0].ended_at,null);
 await c.query('savepoint restricted');await assert.rejects(()=>call(1,'command_execute',{id:ticket.id,body:{street_id:street,body:'投稿'}}),/membership_required/);await c.query('rollback to savepoint restricted');
 await call(0,'operator_chat_restore',{account_id:users[1],reason:'投稿制限解除'});
 assert.equal((await call(0,'operator_members')).items.find(x=>x.account_id===users[1]).chat_restricted_until,null);
 assert.ok((await call(1,'command_execute',{id:ticket.id,body:{street_id:street,body:'投稿'}})).id);
 await call(0,'operator_member_state',{account_id:users[1],active:false,reason:'試験停止'});
 assert.ok((await c.query('select canceled_at from app_private.events where id=$1',[event])).rows[0].canceled_at);
 assert.ok((await c.query('select ended_at from app_private.visits where id=$1',[visit])).rows[0].ended_at);
 assert.equal((await c.query('select kind from app_private.notifications where event_id=$1 and recipient=$2',[event,users[2]])).rows[0].kind,'canceled');
 await call(0,'operator_member_state',{account_id:users[1],active:true,reason:'試験解除'});
 assert.ok((await c.query('select canceled_at from app_private.events where id=$1',[event])).rows[0].canceled_at);
 await call(0,'operator_invite_policy',{account_id:users[1],weekly_limit:0,paused:false,reason:'枠変更'});
 await c.query('savepoint denied');await assert.rejects(()=>invite(),/rate_limited/);await c.query('rollback to savepoint denied');
 await call(0,'operator_invite_policy',{account_id:users[1],weekly_limit:6,paused:false,reason:'枠追加'});assert.ok((await invite()).code);
 await call(0,'operator_invite_policy',{account_id:users[1],weekly_limit:6,paused:true,reason:'発行停止'});
 await c.query('savepoint paused');await assert.rejects(()=>invite(),/membership_required/);await c.query('rollback to savepoint paused');
 }finally{await c.query('rollback');await c.end();}
});
