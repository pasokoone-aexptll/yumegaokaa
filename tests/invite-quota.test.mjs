import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
test('invite quota matches rolling-week policy and paused state', async () => {
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'}); await c.connect(); await c.query('begin');
 try {
  if(!(await c.query("select to_regprocedure('app_private.invitation_api_before_quota(text,jsonb)') present")).rows[0].present) await c.query(fs.readFileSync(new URL('../supabase/migrations/202611190052_invite_quota_display.sql',import.meta.url),'utf8').replace(/^begin;\s*/,'').replace(/commit;\s*$/,''));
  const uid=randomUUID(),sid=randomUUID();
  await c.query('insert into auth.users(id) values($1)',[uid]);await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,uid]);await c.query('insert into app_private.members(account_id) values($1)',[uid]);
  await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,session_id:sid,role:'authenticated'})]);
  const read=async()=> (await c.query("select public.street_api('invite_list','{}') result")).rows[0].result;
  assert.equal((await read()).remaining,5);
  const receipt=(await c.query("select public.street_api('command_prepare','{\"kind\":\"invite_create\"}') result")).rows[0].result;
  await c.query("select public.street_api('command_execute',$1)",[JSON.stringify({id:receipt.id,body:{}})]);
  assert.equal((await read()).remaining,4);
  await c.query('insert into app_private.invite_policies(account_id,weekly_limit,paused) values($1,10,false)',[uid]);
  assert.equal((await read()).remaining,9);
  await c.query('update app_private.invite_policies set paused=true where account_id=$1',[uid]);
  assert.equal((await read()).remaining,0);
 } finally {await c.query('rollback');await c.end();}
});
