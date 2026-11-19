import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

test('unused cancellation restores quota; redeemed cancellation preserves quota and suspends recipient', async () => {
  const db = new pg.Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' });
  await db.connect();
  await db.query('begin');
  try {
    const migration = fs.readFileSync('supabase/migrations/202611200055_unused_invitation_quota.sql', 'utf8').replace(/^begin;\s*/, '').replace(/commit;\s*$/, '');
    await db.query(migration);
    const issuer = randomUUID(), recipient = randomUUID(), sid = randomUUID(), recipientSid = randomUUID();
    for (const [id, session] of [[issuer, sid], [recipient, recipientSid]]) {
      await db.query('insert into auth.users(id) values($1)', [id]);
      await db.query('insert into auth.sessions(id,user_id) values($1,$2)', [session,id]);
    }
    await db.query('insert into app_private.members(account_id) values($1)', [issuer]);
    await db.query('insert into app_private.invite_policies(account_id,weekly_limit) values($1,1)', [issuer]);
    const auth = (sub,session_id) => db.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({sub,session_id,role:'authenticated'})]);
    const rpc = async (op,payload={}) => (await db.query('select public.street_api($1,$2) result',[op,payload])).rows[0].result;
    const issue = async () => { const receipt=await rpc('command_prepare',{kind:'invite_create'}); return rpc('command_execute',{id:receipt.id,body:{}}); };
    await auth(issuer,sid);
    const first=await issue(); assert.equal((await rpc('invite_list')).remaining,0);
    const rotated=await issue(); assert.equal(rotated.id,first.id); assert.notEqual(rotated.code,first.code);
    await rpc('invite_revoke',{id:first.id});
    let list=await rpc('invite_list'); assert.equal(list.remaining,1); assert.equal(list.current,undefined); assert.equal(list.items[0].revoked,true);
    const second=await issue(); assert.notEqual(second.id,first.id); assert.equal((await rpc('invite_list')).remaining,0);
    await auth(recipient,recipientSid); await rpc('invite_accept',{code:second.code});
    await auth(issuer,sid); await rpc('invite_revoke',{id:second.id});
    list=await rpc('invite_list'); assert.equal(list.remaining,0); assert.equal(list.items.length,2);
    assert.equal((await db.query('select active from app_private.members where account_id=$1',[recipient])).rows[0].active,false);
    await db.query('savepoint quota');
    await assert.rejects(issue, /rate_limited/); await db.query('rollback to savepoint quota');
    await db.query('update app_private.invite_policies set weekly_limit=2,paused=true where account_id=$1',[issuer]);
    assert.equal((await rpc('invite_list')).remaining,0);
    await db.query('savepoint paused'); await assert.rejects(issue, /membership_required/); await db.query('rollback to savepoint paused');
    assert.equal((await db.query("select has_function_privilege('authenticated','app_private.invitation_api_before_quota(text,jsonb)','EXECUTE') permitted")).rows[0].permitted,false);
  } finally { await db.query('rollback'); await db.end(); }
});
