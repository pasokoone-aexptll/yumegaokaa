import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
test('upload waiting behind withdrawal rechecks authorization after the lock',async()=>{
 const connectionString='postgresql://postgres:postgres@127.0.0.1:54322/postgres';
 const owner=new pg.Client({connectionString}),upload=new pg.Client({connectionString});
 await owner.connect();await upload.connect();
 const uid=randomUUID(),sid=randomUUID(),icon=randomUUID(),path=randomUUID()+'.jpg';
 let pending;
 try {
  await owner.query('insert into auth.users(id) values($1)',[uid]);
  await owner.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,uid]);
  await owner.query('insert into app_private.members(account_id) values($1)',[uid]);
  await owner.query("insert into app_private.street_icons(id,street_id,owner_id,path) values($1,'11111111-1111-4111-8111-111111111111',$2,$3)",[icon,uid,path]);
  await upload.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:uid,session_id:sid,role:'authenticated'})]);
  await upload.query('set role authenticated');
  await upload.query("set statement_timeout='5s'");
  const pid=(await upload.query('select pg_backend_pid() pid')).rows[0].pid;
  await owner.query('begin');
  await owner.query('update app_private.street_icons set removed_at=clock_timestamp() where id=$1',[icon]);
  pending=upload.query('select public.street_icon_access($1,true) allowed',[path]);
  // Observe an actual lock wait, not merely two sequential requests.
  let waiting=false;
  for(let i=0;i<100;i++){
   waiting=(await owner.query('select cardinality(pg_blocking_pids($1))>0 waiting',[pid])).rows[0].waiting;
   if(waiting)break;
   await new Promise(r=>setTimeout(r,10));
  }
  assert.equal(waiting,true,'upload must wait for removal transaction');
  await owner.query('commit');
  assert.equal((await pending).rows[0].allowed,false);
 }finally{
  await owner.query('rollback');
  if(pending)await pending.catch(()=>{});
  await upload.end();
  await owner.query('delete from app_private.street_icons where id=$1',[icon]);
  await owner.query('delete from app_private.members where account_id=$1',[uid]);
  await owner.query('delete from auth.sessions where id=$1',[sid]);
  await owner.query('delete from auth.users where id=$1',[uid]);
  await owner.end();
 }
});
