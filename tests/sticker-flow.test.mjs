import test from 'node:test';import assert from 'node:assert/strict';import pg from 'pg';import {randomUUID} from 'node:crypto';
test('ステッカー3枚準備→凸包公開→再送→停止で旧範囲保持、未照合は有効化不可',async()=>{
 const c=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await c.connect();await c.query('begin');
 try{
 const uid=randomUUID(),sid=randomUUID(),factor=randomUUID(),street=randomUUID(),visit=randomUUID();
 await c.query('insert into auth.users(id) values($1)',[uid]);await c.query('insert into auth.sessions(id,user_id) values($1,$2)',[sid,uid]);await c.query('insert into app_private.members(account_id) values($1)',[uid]);
 await c.query('insert into app_private.operators(account_id) values($1)',[uid]);await c.query("insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at) values($1,$2,'totp','verified',now(),now())",[factor,uid]);await c.query("update auth.sessions set factor_id=$1,aal='aal2' where id=$2",[factor,sid]);
 await c.query("insert into app_private.streets(id,name) values($1,'設置試験')",[street]);
 await c.query("insert into app_private.visits(id,account_id,street_id,writer_session_id,started_at,expires_at) values($1,$2,$3,$4,now(),now()+interval '3 hours')",[visit,uid,street,sid]);
 const call=async(op,p={})=>{await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,session_id:sid,role:'authenticated',aal:'aal2'})]);await c.query('set local role authenticated');const r=(await c.query('select public.street_api($1,$2) r',[op,p])).rows[0].r;await c.query('reset role');return r;};
 const drafts=[];
 for(const [longitude,latitude] of [[139.7,35.72],[139.71,35.72],[139.71,35.73]]){
  const ticket=await call('command_prepare',{kind:'sticker_create'}),body={street_id:street,title:'設置',longitude,latitude};
  const created=await call('command_execute',{id:ticket.id,body});assert.equal((await call('command_execute',{id:ticket.id,body})).id,created.id);
  let d=await call('sticker_get',{id:created.id});
  await c.query('savepoint skip');await assert.rejects(()=>call('sticker_step',{id:d.id,revision:d.revision,phase:'installed'}),/conflict/);await c.query('rollback to savepoint skip');
  for(const phase of ['written','verified','installed'])d=await call('sticker_step',{id:d.id,revision:d.revision,phase,tag_payload:{v:1,tag_id:d.tag_id}});
  assert.equal((await c.query('select active from app_private.tags where id=$1',[d.tag_id])).rows[0].active,false);drafts.push(d);
 }
 assert.equal((await call('sticker_preview',{street_id:street,draft_ids:[drafts[0].id]})).valid,false);
 const preview=await call('sticker_preview',{street_id:street,draft_ids:drafts.map(d=>d.id)});assert.equal(preview.valid,true);assert.equal(preview.boundary.type,'Polygon');
 let edited=await call('sticker_edit',{id:drafts[0].id,revision:drafts[0].revision,title:'変更',longitude:139.7001,latitude:35.72});
 assert.equal(edited.phase,'verified');
 await c.query('savepoint stale_edit');await assert.rejects(()=>call('sticker_publish',{id:preview.id}),/conflict/);await c.query('rollback to savepoint stale_edit');
 edited=await call('sticker_step',{id:edited.id,revision:edited.revision,phase:'installed'});
 const updatedPreview=await call('sticker_preview',{street_id:street,draft_ids:drafts.map(d=>d.id)});
 const result=await call('sticker_publish',{id:updatedPreview.id});assert.equal(result.area_version,2);assert.equal((await call('sticker_publish',{id:updatedPreview.id})).area_version,2);
 assert.equal((await c.query('select ended_at from app_private.visits where id=$1',[visit])).rows[0].ended_at,null);
 const list=await call('placement_list',{street_id:street});assert.equal(list.items.length,3);assert.ok(list.items.every(x=>x.active));
 const stale=await call('sticker_preview',{street_id:street,draft_ids:[]});
 await call('sticker_suspend',{tag_id:list.items[0].tag_id,revision:list.items[0].revision});
 await c.query('savepoint stale');await assert.rejects(()=>call('sticker_publish',{id:stale.id}),/tag_changed/);await c.query('rollback to savepoint stale');
 assert.equal((await call('sticker_preview',{street_id:street,draft_ids:[]})).valid,false);
 assert.equal((await c.query('select area_version from app_private.streets where id=$1',[street])).rows[0].area_version,'2');
 const ticket=await call('command_prepare',{kind:'sticker_create'});
 const fresh=await call('command_execute',{id:ticket.id,body:{street_id:street,title:'取消',longitude:139.72,latitude:35.73}});
 const draft=await call('sticker_get',{id:fresh.id});
 await call('sticker_cancel',{id:draft.id,revision:draft.revision});
 assert.equal((await call('sticker_cancel',{id:draft.id,revision:draft.revision})).canceled,true);
 assert.equal((await c.query('select retired from app_private.tags where id=$1',[draft.tag_id])).rows[0].retired,true);
 await c.query('savepoint canceled');await assert.rejects(()=>call('sticker_step',{id:draft.id,revision:draft.revision,phase:'written',tag_payload:{v:1,tag_id:draft.tag_id}}),/not_found/);await c.query('rollback to savepoint canceled');
 }finally{await c.query('rollback');await c.end();}
});
