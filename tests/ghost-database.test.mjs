import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
test('ghost hides location, preserves visit, suppresses new arrivals and gates republication',async()=>{
 const db=new pg.Client({connectionString:process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});
 await db.connect();await db.query('begin');
 const uid=randomUUID(),sid=randomUUID(),street='11111111-1111-4111-8111-111111111111';
 async function rpc(op,body={}){
  await db.query('savepoint request');
  try{
   await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,session_id:sid,role:'authenticated'})]);
   await db.query('set local role authenticated');
   const r=(await db.query('select public.street_api($1,$2) result',[op,body])).rows[0].result;
   await db.query('reset role');await db.query('release savepoint request');return r;
  }catch(e){await db.query('rollback to savepoint request');await db.query('reset role');throw e;}
 }
 async function enter(){const a=await rpc('prepare_checkin',{tag_id:'22222222-2222-4222-8222-222222222222',payload_version:1});return (await rpc('commit_checkin',{attempt_id:a.attempt_id})).visit;}
 try{
  await db.query('insert into auth.users(id) values($1)',[uid]);
  await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,uid]);
  await db.query('insert into app_private.members(account_id) values($1)',[uid]);
  let v=await enter();
  const mode={ghost:true,visit_id:v.visit_id,mode_revision:'0',request_id:randomUUID()};
  await rpc('set_presence_mode',mode);
  const obs={visit_id:v.visit_id,mode_revision:'1',seq:'1',area_version:'1',observed_at:new Date(Date.now()-1000).toISOString(),horizontal_accuracy_m:10,verdict:'inside'};
  await assert.rejects(rpc('observe_visit',{...obs,cell_id:'0:0'}),/invalid_input/);
  assert.equal((await rpc('observe_visit',obs)).result,'accepted');
  assert.equal((await db.query('select count(*)::int n from app_private.presence where visit_id=$1',[v.visit_id])).rows[0].n,0);
  assert.equal((await rpc('get_presence_snapshot',{street_id:street})).checked_in_count,1);
  assert.equal((await rpc('set_presence_mode',mode)).mode_revision,'1');
  await assert.rejects(rpc('set_presence_mode',{ghost:false,visit_id:v.visit_id,mode_revision:'1',request_id:randomUUID()}),/invalid_input/);
  await assert.rejects(rpc('observe_visit',{...obs,mode_revision:'0'}),/conflict/);
  await rpc('end_visit',{visit_id:v.visit_id,reason:'manual'});
  v=await enter();assert.equal(v.ghost,true);
  assert.equal((await db.query('select count(*)::int n from app_private.arrival_logs where account_id=$1',[uid])).rows[0].n,1);
  await assert.rejects(db.query('insert into app_private.recruitments(visit_id,title,longitude,latitude,expires_at) values($1,$2,139.71,35.73,now()+interval \'20 minutes\')',[v.visit_id,'hidden']),/inactive_visit/);
 }finally{await db.query('rollback');await db.end();}
});
