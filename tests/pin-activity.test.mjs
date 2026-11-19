import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

test('PIN activity: one receipt per command, own list/read, retained after leave, no self push, expiry', async () => {
  const c = new pg.Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' });
  await c.connect();
  await c.query('begin');
  try {
    const exists = (await c.query("select 1 from information_schema.columns where table_schema='app_private' and table_name='notifications' and column_name='activity_pin_id'")).rowCount;
    if (!exists) await c.query(readFileSync('supabase/migrations/202611200054_pin_activity_notifications.sql','utf8').replace(/^begin;/,'').replace(/commit;\s*$/,''));
    const users=[randomUUID(),randomUUID()], sessions=users.map(()=>randomUUID()), street=randomUUID();
    for(let i=0;i<2;i++) {
      await c.query('insert into auth.users(id) values($1)',[users[i]]);
      await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessions[i],users[i]]);
      await c.query('insert into app_private.members(account_id) values($1)',[users[i]]);
      await c.query('insert into app_private.profiles(account_id,display_name) values($1,$2)',[users[i],`activity-${i}`]);
    }
    await c.query("insert into app_private.streets(id,name) values($1,'activity test')",[street]);
    await c.query("insert into app_private.areas values($1,1,extensions.st_buffer(extensions.st_transform(extensions.st_setsrid(extensions.st_makepoint(139.7109,35.7295),4326),'+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'),500))",[street]);
    async function rpc(i,op,p={}) {
      await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:users[i],session_id:sessions[i],role:'authenticated'})]);
      await c.query('set local role authenticated');
      const r=(await c.query('select public.street_api($1,$2) r',[op,p])).rows[0].r;
      await c.query('reset role');return r;
    }
    async function cmd(i,kind,body){ const ticket=await rpc(i,'command_prepare',{kind});return rpc(i,'command_execute',{id:ticket.id,body}); }
    const body={street_id:street,body:'初めての人も歓迎',longitude:139.7109,latitude:35.7295,recruiting:true,capacity:7};
    const ticket=await rpc(0,'command_prepare',{kind:'denshin_create'});
    const pin=await rpc(0,'command_execute',{id:ticket.id,body});
    await rpc(0,'command_execute',{id:ticket.id,body});
    let mine=(await rpc(0,'notification_list')).items;
    assert.equal(mine.length,1); assert.equal(mine[0].kind,'pin_created');assert.equal(mine[0].title,body.body);assert.equal(mine[0].display_name,'activity-0');
    assert.equal((await rpc(1,'notification_list')).items.length,0);
    await c.query('savepoint denied');
    await assert.rejects(rpc(1,'notification_read',{id:mine[0].id}),/not_found/);
    await c.query('rollback to savepoint denied');
    await cmd(1,'denshin_attend',{id:pin.id,revision:1,attendance_revision:0,state:'planned'});
    let joined=(await rpc(1,'notification_list')).items;
    assert.equal(joined.length,1);assert.equal(joined[0].kind,'pin_joined');
    assert.equal((await c.query('select 1 from app_private.notification_outbox where notification_id=any($1::uuid[])',[[mine[0].id,joined[0].id]])).rowCount,0);
    await cmd(1,'denshin_attend',{id:pin.id,revision:1,attendance_revision:1,state:'left'});
    assert.equal((await rpc(1,'notification_list')).items[0].id,joined[0].id);
    await rpc(1,'notification_read',{id:joined[0].id});
    assert.equal((await rpc(1,'notification_list')).items[0].read,true);
    await cmd(0,'denshin_edit',{...body,id:pin.id,revision:1,body:'変更後'});
    assert.equal((await rpc(0,'notification_list')).items[0].title,body.body);
    await c.query("update app_private.notifications set created_at=clock_timestamp()-interval '25 hours' where activity_pin_id=$1",[pin.id]);
    assert.equal((await rpc(0,'notification_list')).items.length,0);
    await c.query('select app_private.cleanup()');
    assert.equal((await c.query('select 1 from app_private.notifications where activity_pin_id=$1',[pin.id])).rowCount,0);
  } finally { await c.query('rollback'); await c.end(); }
});
