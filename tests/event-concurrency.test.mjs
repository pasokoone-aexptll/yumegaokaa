import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
test('last seat and cancellation serialize across real database connections', async () => {
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  const users = Array.from({ length: 3 }, () => randomUUID());
  const sessions = users.map(() => randomUUID());
  const street = randomUUID(), event = randomUUID();
  const clients = [];
  async function rpc(index, operation, payload) {
    const client = clients[index];
    await client.query('begin');
    try {
      await client.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({
        sub: users[index], session_id: sessions[index], role: 'authenticated',
      })]);
      await client.query('set local role authenticated');
      const result = (await client.query('select public.street_api($1,$2) result', [operation, payload])).rows[0].result;
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  }
  try {
    for (let i = 0; i < users.length; i++) {
      await admin.query('insert into auth.users(id) values($1)', [users[i]]);
      await admin.query('insert into auth.sessions(id,user_id) values($1,$2)', [sessions[i], users[i]]);
      await admin.query('insert into app_private.members(account_id) values($1)', [users[i]]);
      const client = new pg.Client({ connectionString });
      await client.connect(); clients.push(client);
      await client.query("set statement_timeout='10s'");
    }
    await admin.query("insert into app_private.streets(id,name) values($1,'concurrency fixture')", [street]);
    await admin.query(`insert into app_private.events(id,host_id,street_id,title,longitude,latitude,starts_at,ends_at,capacity)
      values($1,$2,$3,'concurrency fixture',139.71,35.73,clock_timestamp()-interval '1 minute',clock_timestamp()+interval '1 hour',1)`, [event, users[0], street]);
    // Hold the parent lock until both independent requests have been submitted.
    await admin.query('begin');
    await admin.query('select id from app_private.events where id=$1 for update', [event]);
    const race = Promise.allSettled([1, 2].map(i => rpc(i, 'event_register', { id: event, joined: true, revision: 0 })));
    await admin.query('commit');
    const outcomes = await race;
    assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
    assert.match(outcomes.find(x => x.status === 'rejected').reason.message, /conflict/);
    const winner = outcomes[0].status === 'fulfilled' ? 1 : 2;
    const loser = winner === 1 ? 2 : 1;
    assert.equal((await rpc(winner, 'event_get', { id: event })).count, 1);
    await rpc(winner, 'event_register', { id: event, joined: false, revision: 1 });
    await assert.rejects(() => rpc(winner, 'event_register', { id: event, joined: true, revision: 0 }), /conflict/);
    await admin.query('begin');
    await admin.query('select id from app_private.events where id=$1 for update', [event]);
    const cancelRace = Promise.allSettled([
      rpc(0, 'event_cancel', { id: event, revision: 1 }),
      rpc(loser, 'event_register', { id: event, joined: true, revision: 0 }),
    ]);
    await admin.query('commit');
    const canceled = await cancelRace;
    assert.equal(canceled[0].status, 'fulfilled');
    if (canceled[1].status === 'rejected') assert.match(canceled[1].reason.message, /not_found/);
    for (const i of [1, 2]) {
      await assert.rejects(() => rpc(i, 'event_get', { id: event }), /not_found/);
      assert.deepEqual((await rpc(i, 'event_list', { street_id: street, mine_only: true })).items, []);
      await assert.rejects(() => rpc(i, 'event_register', { id: event, joined: true, revision: 0 }), /not_found/);
    }
  } finally {
    await admin.query('rollback');
    await Promise.all(clients.map(c => c.end()));
    await admin.query('delete from app_private.events where id=$1', [event]);
    await admin.query('delete from app_private.streets where id=$1', [street]);
    await admin.query('delete from app_private.members where account_id=any($1::uuid[])', [users]);
    await admin.query('delete from auth.sessions where user_id=any($1::uuid[])', [users]);
    await admin.query('delete from auth.users where id=any($1::uuid[])', [users]);
    await admin.end();
  }
});
