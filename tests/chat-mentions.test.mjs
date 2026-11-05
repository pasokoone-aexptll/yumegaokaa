import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

test('mention receipts, notification throttle and block recheck', async () => {
  const db = new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});
  const street_id = '11111111-1111-4111-8111-111111111111';
  const accounts = [0,1].map(() => ({sub:randomUUID(),session_id:randomUUID(),role:'authenticated'}));
  await db.connect();
  async function rpc(actor, operation, body) {
    await db.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify(actor)]);
    await db.query('set local role authenticated');
    const {rows} = await db.query('select public.street_api($1,$2) result',[operation,body]);
    await db.query('reset role');
    return rows[0].result;
  }
  try {
    await db.query('begin');
    for (const actor of accounts) {
      await db.query('insert into auth.users(id) values($1)',[actor.sub]);
      await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[actor.session_id,actor.sub]);
      await db.query('insert into app_private.members(account_id) values($1)',[actor.sub]);
      await db.query("insert into app_private.profiles(account_id,display_name) values($1,'same name')",[actor.sub]);
    }
    const [author,target]=accounts;
    await db.query("insert into app_private.messages(author_id,street_id,body) values($1,$2,'hi')",[target.sub,street_id]);
    const body={street_id,body:'hello',mention_ids:[target.sub,author.sub]};
    async function send() {
      const {id}=await rpc(author,'command_prepare',{kind:'chat_send'});
      const args={id,body};
      const result=await rpc(author,'command_execute',args);
      assert.deepEqual(await rpc(author,'command_execute',args),result);
      return result.id;
    }
    const id=await send();
    await send();
    const feed=await rpc(target,'chat_list',{street_id});
    assert.deepEqual(feed.items.find(item=>item.id===id).mentions,['same name']);
    const {items}=await rpc(target,'notification_list',{});
    assert.equal(items.length,1);
    assert.equal(items[0].message_id,id);
    assert.equal((await db.query('select count(*)::int n from app_private.notification_outbox where notification_id=$1',[items[0].id])).rows[0].n,1);
    await rpc(target,'block_set',{account_id:author.sub,blocked:true});
    assert.equal((await rpc(target,'notification_list',{})).items.length,0);
    assert.equal((await db.query('select app_private.notification_sendable($1,now()) ok',[items[0].id])).rows[0].ok,false);
  } finally {
    await db.query('rollback');
    await db.end();
  }
});
