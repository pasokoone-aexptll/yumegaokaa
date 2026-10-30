import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
test('運営資格とTOTPの両方を要求し、失効を各リクエストで反映する',async()=>{
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await c.connect();await c.query('begin');
 try{
 const uid=randomUUID(),sid=randomUUID(),factor=randomUUID();
 await c.query('insert into auth.users(id) values($1)',[uid]);
 await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,uid]);
 await c.query('insert into app_private.members(account_id) values($1)',[uid]);
 const call=async(op,aal='aal1')=>{
  await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,session_id:sid,role:'authenticated',aal})]);
  await c.query('set local role authenticated');
  const result=(await c.query('select public.street_api($1,$2) r',[op,{}])).rows[0].r;
  await c.query('reset role');return result;
 };
 const denied=async(aal,pattern)=>{
  await c.query('savepoint denied');await assert.rejects(()=>call('operator_dashboard',aal),pattern);await c.query('rollback to savepoint denied');
 };
 assert.equal((await call('operator_status')).operator,false);
 await denied('aal2',/membership_required/);
 await c.query('insert into app_private.operators(account_id) values($1)',[uid]);
 await denied('aal1',/unauthorized/);await denied('aal2',/unauthorized/);
 await c.query("insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values($1,$2,'totp','verified',now(),now())",[factor,uid]);
 await c.query("update auth.sessions set factor_id=$1,aal='aal2' where id=$2",[factor,sid]);
 assert.ok((await call('operator_dashboard','aal2')).active_members>=1);
 assert.ok(Array.isArray((await call('operator_invites','aal2')).items));
 await denied('aal1',/unauthorized/);
 await c.query("update auth.mfa_factors set status='unverified' where id=$1",[factor]);
 await denied('aal2',/unauthorized/);
 await c.query("update auth.mfa_factors set status='verified' where id=$1",[factor]);
 await c.query('update app_private.operators set active=false where account_id=$1',[uid]);
 await denied('aal2',/membership_required/);
 }finally{await c.query('rollback');await c.end();}
});
