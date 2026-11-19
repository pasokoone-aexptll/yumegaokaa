import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
test('native UI: private visit counter survives cleanup; exact-name block lookup excludes self', async () => {
 const c = new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});
 await c.connect(); await c.query('begin');
 try {
  // Validate the unapplied migration without retaining schema or fixture changes.
  if (!(await c.query("select to_regclass('app_private.visit_counts') present")).rows[0].present) {
   const migration = fs.readFileSync(new URL('../supabase/migrations/202611190051_native_ui_support.sql',import.meta.url),'utf8').replace(/^begin;\s*/, '').replace(/commit;\s*$/, '');
   await c.query(migration);
  }
  const accounts = [randomUUID(),randomUUID()]; const sessions = accounts.map(() => randomUUID()); const street = randomUUID();
  await c.query('insert into app_private.streets(id,name) values($1,$2)',[street,'UI test']);
  for(let i=0;i<2;i++) {
   await c.query('insert into auth.users(id) values($1)',[accounts[i]]);
   await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessions[i],accounts[i]]);
   await c.query('insert into app_private.members(account_id) values($1)',[accounts[i]]);
   await c.query('insert into app_private.profiles(account_id,display_name) values($1,$2)',[accounts[i],'native_ui_exact']);
  }
  const call = async (op,p={}) => { await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:accounts[0],session_id:sessions[0],role:'authenticated'})]); return (await c.query('select public.street_api($1,$2) result',[op,p])).rows[0].result; };
  assert.equal((await call('visit_count',{street_id:street})).total,0);
  const visit = (await c.query("insert into app_private.visits(account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,$3,now(),now()+interval '3 hours') returning id",[accounts[0],street,sessions[0]])).rows[0].id;
  assert.equal((await call('visit_count',{street_id:street})).total,1);
  await c.query("update app_private.visits set expires_at=expires_at+interval '1 minute' where id=$1",[visit]);
  assert.equal((await call('visit_count',{street_id:street})).total,1);
  await c.query('delete from app_private.visits where id=$1',[visit]);
  assert.equal((await call('visit_count',{street_id:street})).total,1);
  const found = (await call('block_lookup',{name:'@native_ui_exact'})).items;
  assert.deepEqual(found.map(x=>x.account_id),[accounts[1]]);
  assert.equal((await call('block_lookup',{name:'native_ui'})).items.length,0);
  await call('block_set',{account_id:accounts[1],blocked:true});
  assert.equal((await call('block_list')).items[0].account_id,accounts[1]);
  await c.query('update app_private.members set withdrawn_at=now() where account_id=$1',[accounts[0]]);
  assert.equal((await c.query('select count(*)::int count from app_private.visit_counts where account_id=$1',[accounts[0]])).rows[0].count,0);
 } finally { await c.query('rollback'); await c.end(); }
});
