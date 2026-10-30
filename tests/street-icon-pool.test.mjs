import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
test('pool contribution, daily stability, replacement, removal and withdrawal', async () => {
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});
 await c.connect();await c.query('begin');
 try {
  const uid=randomUUID(), sid=randomUUID(), street='11111111-1111-4111-8111-111111111111';
  await c.query('insert into auth.users(id) values($1)',[uid]);
  await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,uid]);
  await c.query('insert into app_private.members(account_id) values($1)',[uid]);
  await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,session_id:sid,role:'authenticated'})]);
  const rpc=async(op,p={})=>{
   await c.query('set local role authenticated');
   const result=(await c.query('select public.street_api($1,$2) result',[op,{street_id:street,...p}])).rows[0].result;
   await c.query('reset role');return result;
  };
  const prepare=await rpc('street_icon_prepare');
  assert.deepEqual(await rpc('street_icon_prepare'),prepare);
  assert.equal(prepare.contributed,false);
  assert.equal(prepare.upload_path.includes(uid),false);
  // Metadata fixture tests DB acceptance, not image bytes or Storage transport.
  await c.query("insert into storage.objects(bucket_id,name,metadata) values('street-icons',$1,$2)",[prepare.upload_path,{size:100,mimetype:'image/jpeg'}]);
  const published=await rpc('street_icon_publish',{id:prepare.id});
  assert.equal(published.contributed,true);
  assert.equal(published.contribution_path,prepare.upload_path);
  assert.equal((await rpc('street_icon_get')).daily_path,published.daily_path);
  const visit=randomUUID();
  await c.query("insert into app_private.visits(id,account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,$3,$4,now(),now()+interval '3 hours')",[visit,uid,street,sid]);
  await c.query("insert into app_private.presence(visit_id,area_version,grid_version,cell_id,observed_at,expires_at) select $1,a.version,s.grid_version,floor(extensions.st_x(extensions.st_pointonsurface(a.polygon))/100)::int::text||':'||floor(extensions.st_y(extensions.st_pointonsurface(a.polygon))/100)::int::text,now(),now()+interval '10 minutes' from app_private.areas a join app_private.streets s on s.id=a.street_id and s.area_version=a.version where s.id=$2",[visit,street]);
  const snapshot=await rpc('get_presence_snapshot');
  const groups=snapshot.cells.flatMap(cell=>cell.expiry_groups);
  assert.equal(groups.reduce((sum,g)=>sum+g.count,0),snapshot.presence_count);
  assert.ok(groups.flatMap(g=>g.icons).includes(published.daily_path));
  for(const g of groups) assert.equal(g.icons.length,g.count);
  assert.equal(JSON.stringify(snapshot).includes(uid),false);
  assert.equal(JSON.stringify(snapshot).includes(visit),false);

  const replacement=await rpc('street_icon_prepare');
  assert.notEqual(replacement.id,prepare.id);
  assert.equal((await rpc('street_icon_get')).contribution_id,prepare.id);
  await c.query("insert into storage.objects(bucket_id,name,metadata) values('street-icons',$1,$2)",[replacement.upload_path,{size:100,mimetype:'image/jpeg'}]);
  await rpc('street_icon_publish',{id:replacement.id});
  assert.equal((await c.query("select public.street_icon_access($1,false) allowed",[prepare.upload_path])).rows[0].allowed,false);
  await rpc('street_icon_remove',{id:prepare.id});
  assert.equal((await rpc('street_icon_get')).contribution_id,replacement.id);
  await c.query("select app_private.my_daily_icon($1,$2,'2026-10-30T14:59:59Z')",[uid,street]);
  assert.equal((await c.query("select day::text from app_private.daily_street_icons where account_id=$1",[uid])).rows[0].day,'2026-10-30');
  await c.query("select app_private.my_daily_icon($1,$2,'2026-10-30T15:00:00Z')",[uid,street]);
  assert.equal((await c.query("select day::text from app_private.daily_street_icons where account_id=$1",[uid])).rows[0].day,'2026-10-31');
  assert.equal((await c.query('select count(*)::int n from app_private.daily_street_icons where account_id=$1',[uid])).rows[0].n,1);
  await rpc('street_icon_remove',{id:replacement.id});
  assert.equal((await rpc('street_icon_get')).contributed,true,'Removal must not force enrollment again');
  await c.query('update app_private.members set withdrawn_at=clock_timestamp(),active=false where account_id=$1',[uid]);
  assert.equal((await c.query('select count(*)::int n from app_private.street_icons where owner_id=$1 and active',[uid])).rows[0].n,0);
  assert.equal((await c.query('select count(*)::int n from app_private.daily_street_icons where account_id=$1',[uid])).rows[0].n,0);
 }finally{await c.query('rollback');await c.end();}
});
