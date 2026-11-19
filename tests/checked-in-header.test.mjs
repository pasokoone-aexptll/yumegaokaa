import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

test('street header includes active visits without map observations, exposes no identity and removes ended visits', async () => {
  const db = new pg.Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' });
  await db.connect(); await db.query('begin');
  try {
    if (!(await db.query("select to_regprocedure('app_private.street_api_before_header(text,jsonb)') present")).rows[0].present)
      await db.query(fs.readFileSync('supabase/migrations/202611200056_checked_in_header.sql','utf8').replace(/^begin;\s*/, '').replace(/commit;\s*$/, ''));
    const street=randomUUID(), uid=randomUUID(), ghost=randomUUID(), session=randomUUID(), ghostSession=randomUUID();
    await db.query("insert into app_private.streets(id,name) values($1,'header test')",[street]);
    for(const [u,s] of [[uid,session],[ghost,ghostSession]]) {
      await db.query('insert into auth.users(id) values($1)',[u]);
      await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[s,u]);
      await db.query('insert into app_private.members(account_id,ghost_preference) values($1,$2)',[u,u===ghost]);
      await db.query("insert into app_private.visits(account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,$3,now(),now()+interval '3 hours')",[u,street,s]);
    }
    await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,session_id:session,role:'authenticated'})]);
    const read=async()=>(await db.query("select public.street_api('get_presence_snapshot',$1) result",[{street_id:street}])).rows[0].result;
    const first=await read();
    assert.equal(first.checked_in_count,2); assert.equal(first.presence_count,0); assert.deepEqual(first.cells,[]);
    assert.equal(first.checked_in_icon_groups.flatMap(x=>x.icons).length,2);
    for(const group of first.checked_in_icon_groups) assert.deepEqual(Object.keys(group).sort(),['expires_at','icons']);
    for(const id of [uid,ghost,session,ghostSession]) assert.equal(JSON.stringify(first).includes(id),false);
    await db.query("update app_private.visits set ended_at=now(),end_reason='manual' where account_id=$1",[ghost]);
    const next=await read(); assert.equal(next.checked_in_count,1); assert.equal(next.checked_in_icon_groups.flatMap(x=>x.icons).length,1);
    await db.query('update app_private.members set active=false where account_id=$1',[uid]);
    await assert.rejects(read,/membership_required/);
  } finally { await db.query('rollback'); await db.end(); }
});
