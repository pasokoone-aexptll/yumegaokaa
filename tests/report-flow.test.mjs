import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';import {randomUUID} from 'node:crypto';
test('通報→重複抑止→MFA運営証拠→投稿削除→解決→期限清掃',async()=>{
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await c.connect();await c.query('begin');
 try{
 const users=[randomUUID(),randomUUID()],sessions=[randomUUID(),randomUUID()],street=randomUUID(),message=randomUUID(),factor=randomUUID();
 for(let i=0;i<2;i++){await c.query('insert into auth.users(id) values($1)',[users[i]]);await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessions[i],users[i]]);await c.query('insert into app_private.members(account_id) values($1)',[users[i]]);}
 await c.query("insert into app_private.streets(id,name) values($1,'通報試験')",[street]);
 await c.query("insert into app_private.messages(id,street_id,author_id,body) values($1,$2,$3,'証拠本文')",[message,street,users[1]]);
 const call=async(i,op,p={})=>{await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:users[i],session_id:sessions[i],role:'authenticated',aal:i===1?'aal2':'aal1'})]);await c.query('set local role authenticated');const r=(await c.query('select public.street_api($1,$2) r',[op,p])).rows[0].r;await c.query('reset role');return r;};
 const body={target_kind:'message',target_id:message,reason:'spam',description:'確認お願いします',evidence:{body:'偽造'}};
 const report=await call(0,'report_create',body);assert.equal((await call(0,'report_create',body)).id,report.id);
 await c.query('savepoint nope');await assert.rejects(()=>call(0,'operator_reports'),/membership_required/);await c.query('rollback to savepoint nope');
 await c.query('insert into app_private.operators(account_id) values($1)',[users[1]]);
 await c.query("insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values($1,$2,'totp','verified',now(),now())",[factor,users[1]]);
 await c.query("update auth.sessions set factor_id=$1,aal='aal2' where id=$2",[factor,sessions[1]]);
 const evidence=(await call(1,'operator_reports')).items.find(x=>x.id===report.id);assert.equal(evidence.evidence.body,'証拠本文');assert.equal(evidence.reporter,undefined);
 await call(1,'operator_message_delete',{id:report.id});assert.equal((await c.query('select body from app_private.messages where id=$1',[message])).rows[0].body,null);
 assert.equal((await call(1,'operator_reports')).items.find(x=>x.id===report.id).evidence.body,'証拠本文');
 await call(1,'operator_report_resolve',{id:report.id,resolution:'handled'});
 assert.ok(!(await call(1,'operator_reports')).items.some(x=>x.id===report.id));
 await c.query("update app_private.reports set resolved_at=now()-interval '31 days' where id=$1",[report.id]);
 await c.query('select app_private.cleanup()');assert.equal((await c.query('select id from app_private.reports where id=$1',[report.id])).rowCount,0);
 }finally{await c.query('rollback');await c.end();}
});
