import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
test('access gate distinguishes enrollment, suspension, withdrawal and expired session', async () => {
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await c.connect();await c.query('begin');
 try {
  const uid=randomUUID(),sid=randomUUID();
  await c.query('insert into auth.users(id) values($1)',[uid]);
  await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,uid]);
  await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,session_id:sid,role:'authenticated'})]);
  const read=async()=>{await c.query('set local role authenticated');const r=(await c.query("select public.street_api('account_access',$1) result",[{account_id:randomUUID()}])).rows[0].result;await c.query('reset role');return r.status;};
  assert.equal(await read(),'unregistered');
  await c.query('insert into app_private.members(account_id) values($1)',[uid]);
  assert.equal(await read(),'active');
  await c.query('update app_private.members set active=false where account_id=$1',[uid]);
  assert.equal(await read(),'suspended');
  await c.query('update app_private.members set withdrawn_at=now() where account_id=$1',[uid]);
  assert.equal(await read(),'withdrawn');
  await c.query("update auth.sessions set not_after=now()-interval '1 minute' where id=$1",[sid]);
  await assert.rejects(read,/unauthorized/);
 } finally {await c.query('rollback');await c.end();}
});
