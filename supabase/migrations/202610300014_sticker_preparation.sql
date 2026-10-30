begin;
alter table app_private.tags add column retired boolean not null default false;
create table app_private.sticker_drafts(
 id uuid primary key default gen_random_uuid(),tag_id uuid not null references app_private.tags,
 street_id uuid not null references app_private.streets,creator uuid not null,
 title text not null check(char_length(title) between 1 and 50),
 longitude double precision not null check(longitude between -180 and 180),
 latitude double precision not null check(latitude between -90 and 90),
 phase text not null default 'draft' check(phase in ('draft','written','verified','installed','published')),
 revision bigint not null default 1,tag_revision bigint not null,updated_at timestamptz not null default clock_timestamp()
);
create unique index sticker_one_draft on app_private.sticker_drafts(tag_id) where phase<>'published';
revoke all on app_private.sticker_drafts from public,anon,authenticated;
alter function app_private.execute_command(text,jsonb,uuid,timestamptz,uuid) rename to execute_pin_command;
create function app_private.execute_command(kind text,body jsonb,actor uuid,t timestamptz,command_id uuid)
returns jsonb language plpgsql set search_path='' as $$
declare street uuid;tag uuid;title text;lon double precision;lat double precision;draft_id uuid;tag_rev bigint;phase text:='draft';
begin
 if kind<>'sticker_create' then return app_private.execute_pin_command(kind,body,actor,t,command_id);end if;
 perform app_private.require_operator();
 street:=(body->>'street_id')::uuid;title:=btrim(body->>'title');lon:=(body->>'longitude')::double precision;lat:=(body->>'latitude')::double precision;
 if title is null or char_length(title) not between 1 and 50 or lon is null or lon not between -180 and 180 or lat is null or lat not between -90 and 90 then raise exception 'invalid_input';end if;
 perform 1 from app_private.streets where id=street for update;if not found then raise exception 'not_found';end if;
 tag:=(body->>'tag_id')::uuid;
 if tag is null then
  tag:=gen_random_uuid();tag_rev:=1;
  insert into app_private.tags(id,street_id) values(tag,street);
 else
  select revision into tag_rev from app_private.tags where id=tag and street_id=street and not retired for update;
  if not found then raise exception 'not_found';end if;
  -- Moving an existing sticker stops new check-ins before physical work.
  update app_private.tags set active=false,revision=revision+1 where id=tag returning revision into tag_rev;
  phase:='written';
 end if;
 insert into app_private.sticker_drafts(tag_id,street_id,creator,title,longitude,latitude,phase,tag_revision)
 values(tag,street,actor,title,lon,lat,phase,tag_rev) returning id into draft_id;
 insert into app_private.operator_audit(actor,action,target) values(actor,'sticker_prepare',tag);
 return jsonb_build_object('id',draft_id,'tag_id',tag);
end $$;
revoke all on function app_private.execute_command(text,jsonb,uuid,timestamptz,uuid) from public,anon,authenticated;
alter function app_private.street_api(text,jsonb) rename to moderation_controls_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid;d app_private.sticker_drafts%rowtype;result jsonb;next_phase text;street uuid;
begin
 if operation not in ('sticker_list','sticker_get','sticker_step') then return app_private.moderation_controls_api(operation,payload);end if;
 uid:=app_private.require_operator();
 if operation='sticker_list' then
  select coalesce(jsonb_agg(x order by x.updated_at desc),'[]'::jsonb) into result from(
   select id,tag_id,title,phase,revision,longitude,latitude,updated_at from app_private.sticker_drafts
   where street_id=(payload->>'street_id')::uuid and (phase='published' or updated_at>clock_timestamp()-interval '7 days')
   order by updated_at desc limit 100
  )x;return jsonb_build_object('items',result);
 end if;
 select street_id into street from app_private.sticker_drafts where id=(payload->>'id')::uuid;
 perform 1 from app_private.streets where id=street for update;
 select * into d from app_private.sticker_drafts where id=(payload->>'id')::uuid for update;
 if not found or (d.phase<>'published' and d.updated_at<=clock_timestamp()-interval '7 days') then raise exception 'not_found';end if;
 if operation='sticker_step' then
  next_phase:=payload->>'phase';
  if next_phase is null or next_phase not in ('written','verified','installed') then raise exception 'invalid_input';end if;
  if d.phase=next_phase then return to_jsonb(d);end if;
  if (payload->>'revision')::bigint is distinct from d.revision then raise exception 'conflict';end if;
  if not ((d.phase='draft' and next_phase='written') or (d.phase='written' and next_phase='verified') or (d.phase='verified' and next_phase='installed')) then raise exception 'conflict';end if;
  if next_phase in ('written','verified') and payload->'tag_payload' is distinct from jsonb_build_object('v',1,'tag_id',d.tag_id::text) then raise exception 'invalid_input';end if;
  perform 1 from app_private.tags where id=d.tag_id and revision=d.tag_revision and not retired and not active for update;
  if not found then raise exception 'tag_changed';end if;
  update app_private.sticker_drafts set phase=next_phase,revision=revision+1,updated_at=clock_timestamp() where id=d.id returning * into d;
  insert into app_private.operator_audit(actor,action,target) values(uid,'sticker_'||next_phase,d.tag_id);
 end if;
 return to_jsonb(d);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
alter function app_private.cleanup() rename to cleanup_reports;
create function app_private.cleanup() returns void language plpgsql security definer set search_path='' as $$
begin
 perform app_private.cleanup_reports();
 delete from app_private.sticker_drafts where (phase<>'published' and updated_at+interval '7 days'<=clock_timestamp())
 or (phase='published' and updated_at+interval '90 days'<=clock_timestamp());
 -- Expired drafts leave inactive tag IDs, never reusable active installations.
end $$;
revoke all on function app_private.cleanup() from public,anon,authenticated;
create or replace function app_private.command_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;t timestamptz; c app_private.commands%rowtype; body jsonb; h bytea;response jsonb;
begin
 if operation not in ('command_prepare','command_execute','command_status','command_cancel') then return app_private.chat_read_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 t:=clock_timestamp();
 if operation='command_prepare' then
  if payload->>'kind' is null or payload->>'kind' not in ('chat_send','event_create','recruitment_create','sticker_create') then raise exception 'invalid_input';end if;
  -- Preparation abuse bound is above every user-facing creation rate.
  if(select count(*) from app_private.commands where owner_id=uid and issued_at>t-interval '1 minute')>=120 then raise exception 'rate_limited';end if;
  insert into app_private.commands(owner_id,kind,issued_at,accept_until) values(uid,payload->>'kind',t,t+interval '10 minutes') returning * into c;
  return jsonb_build_object('id',c.id,'accept_until',c.accept_until);
 end if;
 select * into c from app_private.commands where id=(payload->>'id')::uuid and owner_id=uid for update;
 if not found then raise exception 'not_found';end if;
 if operation='command_status' then return jsonb_build_object('completed',c.completed_at is not null,'result',c.result,'accept_until',c.accept_until,'expired',c.accept_until<=t,'canceled',c.canceled_at is not null);end if;
 if operation='command_cancel' then
  if c.completed_at is not null then return jsonb_build_object('completed',true,'result',c.result);end if;
  update app_private.commands set canceled_at=coalesce(canceled_at,t) where id=c.id;
  return '{"completed":false,"canceled":true}'::jsonb;
 end if;
 if c.canceled_at is not null then raise exception 'attempt_expired';end if;
 body:=payload->'body';
 if body is null or jsonb_typeof(body)<>'object' then raise exception 'invalid_input';end if;
 h:=sha256(convert_to(body::text,'UTF8'));
 if c.completed_at is not null then
  if c.body_hash<>h then raise exception 'conflict';end if;
  return c.result;
 end if;
 if c.accept_until<=t then raise exception 'attempt_expired';end if;
 response:=app_private.execute_command(c.kind,body,uid,t,c.id);
 update app_private.commands set body_hash=h,result=response,completed_at=t where id=c.id;
 return response;
end $$;
commit;
