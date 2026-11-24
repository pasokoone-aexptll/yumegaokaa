import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
test('PIN moderation requires operator MFA, closes attendance, erases body, and is idempotent', async () => {
 const db = new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});
 await db.connect();
 try {
  await db.query('begin');
  for (const name of ['202611250058_registration_declaration.sql','202611250060_existing_member_consent.sql']) await db.query(readFileSync('supabase/migrations/'+name,'utf8').replace(/^begin;/,'').replace(/commit;\s*$/,''));
  await db.query(readFileSync('supabase/migrations/202611250061_denshin_moderation.sql','utf8').replace(/^begin;/,'').replace(/commit;\s*$/,''));
  const [owner,op,session,street,pin,report,factor]=Array.from({length:7},randomUUID);
  await db.query('insert into auth.users(id) values($1),($2)',[owner,op]);
  await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[session,op]);
  await db.query('insert into app_private.members(account_id) values($1),($2)',[owner,op]);
  await db.query("insert into app_private.registration_declarations(account_id,age_band,guardian_declared,policy_version,terms_accepted) select $1,'18_plus',false,version,true from app_private.registration_policy",[op]);
  await db.query("insert into app_private.streets(id,name) values($1,'Moderation test')",[street]);
  await db.query("insert into app_private.denshin_pins(id,owner_id,street_id,body,longitude,latitude,created_at,expires_at,recruiting,capacity) values($1,$2,$3,'test content',139,35,now(),now()+interval '24 hours',true,5)",[pin,owner,street]);
  await db.query("insert into app_private.denshin_attendance(pin_id,account_id,state,updated_at) values($1,$2,'planned',now())",[pin,op]);
  await db.query("insert into app_private.reports(id,reporter,target_kind,target_id,subject_id,reason,description,evidence) values($1,$2,'denshin',$3,$4,'other','','{\"body\":\"test content\"}')",[report,op,pin,owner]);
  const claims=async(aal)=>db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:op,session_id:session,role:'authenticated',aal})]);
  const call=async()=>{await db.query('set local role authenticated');const r=await db.query("select public.street_api('operator_denshin_delete',$1) result",[{id:report}]);await db.query('reset role');return r.rows[0].result;};
  const denied=async()=>{await db.query('savepoint denied');await assert.rejects(call,/membership_required|unauthorized/);await db.query('rollback to savepoint denied');await db.query('reset role');};
  await claims('aal1');await denied();
  await db.query('insert into app_private.operators(account_id) values($1)',[op]);await denied();
  await db.query("insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values($1,$2,'totp','verified',now(),now())",[factor,op]);
  await db.query("update auth.sessions set factor_id=$1,aal='aal2' where id=$2",[factor,session]);await claims('aal2');
  assert.deepEqual(await call(),{deleted:true});assert.deepEqual(await call(),{deleted:true});
  const p=(await db.query('select * from app_private.denshin_pins where id=$1',[pin])).rows[0];
  assert.equal(p.body,'削除済み');assert.ok(p.deleted_at);assert.equal(p.recruiting,false);assert.equal(Number(p.revision),2);
  assert.equal((await db.query('select state from app_private.denshin_attendance where pin_id=$1',[pin])).rows[0].state,'left');
  assert.equal((await db.query("select count(*)::int n from app_private.operator_audit where target=$1 and action='denshin_delete'",[pin])).rows[0].n,1);
  assert.equal((await db.query('select evidence from app_private.reports where id=$1',[report])).rows[0].evidence.body,'test content');
 } finally {await db.query('rollback');await db.end();}
});
