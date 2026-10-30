import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

test('unpublished icons expire, cannot publish or upload, and are claimed without removing active contributions', async () => {
  const c = new pg.Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' });
  await c.connect();
  await c.query('begin');
  try {
    const uid = randomUUID(), sid = randomUUID(), street = randomUUID();
    await c.query('insert into auth.users(id) values($1)', [uid]);
    await c.query('insert into auth.sessions(id,user_id) values($1,$2)', [sid, uid]);
    await c.query('insert into app_private.members(account_id) values($1)', [uid]);
    await c.query("insert into app_private.streets(id,name) values($1,'期限試験')", [street]);
    const claims = JSON.stringify({ sub: uid, session_id: sid, role: 'authenticated' });
    await c.query("select set_config('request.jwt.claims',$1,true)", [claims]);
    const rpc = async (op, args = {}) => {
      await c.query('set local role authenticated');
      const result = (await c.query('select public.street_api($1,$2) r', [op, { street_id: street, ...args }])).rows[0].r;
      await c.query('reset role');
      return result;
    };
    const active = await rpc('street_icon_prepare');
    await c.query("insert into storage.objects(bucket_id,name,metadata) values('street-icons',$1,$2)", [active.upload_path, { size: 100, mimetype: 'image/jpeg' }]);
    await rpc('street_icon_publish', { id: active.id });
    const expired = await rpc('street_icon_prepare');
    await c.query("update app_private.street_icons set created_at=now()-interval '25 hours' where id=any($1::uuid[])", [[active.id, expired.id]]);
    assert.equal((await c.query('select public.street_icon_access($1,true) ok', [expired.upload_path])).rows[0].ok, false);
    assert.equal((await c.query('select public.street_icon_access($1,false) ok', [expired.upload_path])).rows[0].ok, false);
    await c.query('savepoint invalid');
    await assert.rejects(() => rpc('street_icon_publish', { id: expired.id }), /not_found/);
    await c.query('rollback to savepoint invalid');
    const fresh = await rpc('street_icon_prepare');
    assert.notEqual(fresh.id, expired.id);
    const current = await rpc('street_icon_get');
    assert.equal(current.contribution_id, active.id);
    assert.equal(current.contributed, true);
    assert.equal((await c.query('select public.street_icon_access($1,false) ok', [active.upload_path])).rows[0].ok, true);
    await c.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ role: 'service_role' })]);
    // Isolate the claim queue inside this rolled-back transaction.
    await c.query("update app_private.street_icons set cleanup_until=now()+interval '1 hour' where id<>$1", [expired.id]);
    await c.query('set local role service_role');
    const claim = (await c.query("select public.icon_cleanup('claim') r")).rows[0].r;
    assert.equal(claim.id, expired.id);
    assert.equal((await c.query("select public.icon_cleanup('finish',$1) r", [{ id: claim.id, lease: claim.lease }])).rows[0].r.finished, true);
    await c.query('reset role');
    assert.equal((await c.query('select id from app_private.street_icons where id=$1', [expired.id])).rowCount, 0);
    assert.equal((await c.query('select active from app_private.street_icons where id=$1', [active.id])).rows[0].active, true);
  } finally {
    await c.query('rollback');
    await c.end();
  }
});
