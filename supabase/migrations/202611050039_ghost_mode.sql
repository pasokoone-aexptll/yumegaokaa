begin;
-- Private account preference survives visits; no public ghost counts or identifiers.
alter table app_private.members add column ghost_preference boolean not null default false,
 add column mode_revision bigint not null default 0,
 add column mode_request uuid;
alter table app_private.visits add column ghost boolean not null default false,
 add column mode_revision bigint not null default 0;

create function app_private.initialize_visit_mode() returns trigger
language plpgsql set search_path='' as $$
begin
 select ghost_preference, mode_revision into new.ghost, new.mode_revision
 from app_private.members where account_id=new.account_id;
 return new;
end $$;
create trigger initialize_visit_mode before insert on app_private.visits
 for each row execute function app_private.initialize_visit_mode();
create function app_private.suppress_ghost_arrival() returns trigger
language plpgsql set search_path='' as $$
begin
 if exists(select 1 from app_private.visits where id=new.source_visit_id and ghost) then return null; end if;
 return new;
end $$;
create trigger suppress_ghost_arrival before insert on app_private.arrival_logs
 for each row execute function app_private.suppress_ghost_arrival();
-- Defense in depth: every producer of location rows / recruitment passes this guard.
create function app_private.reject_ghost_publication() returns trigger
language plpgsql set search_path='' as $$
begin
 if exists(select 1 from app_private.visits where id=new.visit_id and ghost) then
  raise exception 'inactive_visit';
 end if;
 return new;
end $$;
create trigger reject_ghost_presence before insert or update on app_private.presence
 for each row execute function app_private.reject_ghost_publication();
create trigger reject_ghost_recruitment before insert on app_private.recruitments
 for each row execute function app_private.reject_ghost_publication();

create or replace function app_private.visit_view(v_id uuid,sid uuid,t timestamptz) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('visit_id',v.id,'street_id',v.street_id,'revision',v.revision::text,
 'last_seq',v.last_seq::text,'state',case when v.ended_at is not null then 'ended' when v.expires_at<=t then 'expired' else 'active' end,
 'expires_at',v.expires_at,'can_update',v.writer_session_id=sid and v.ended_at is null and v.expires_at>t,
 'ghost',v.ghost,'mode_revision',v.mode_revision::text,
 'presence_expires_at',(select p.expires_at from app_private.presence p where p.visit_id=v.id and p.expires_at>t and not v.ghost))
 from app_private.visits v where v.id=v_id
$$;

alter function app_private.street_api(text,jsonb) rename to pre_ghost_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid;
 m app_private.members%rowtype; v app_private.visits%rowtype; st app_private.streets%rowtype;
 t timestamptz; result jsonb; desired boolean; request uuid; observed timestamptz;
 accuracy double precision; seq bigint;
begin
 if operation not in ('set_presence_mode','get_my_visit','observe_visit') then
  return app_private.pre_ghost_api(operation,payload);
 end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized'; end if;
 select * into m from app_private.members where account_id=uid for update;
 if not found or not m.active then raise exception 'membership_required'; end if;
 t:=clock_timestamp();
 select * into v from app_private.visits where account_id=uid and ended_at is null for update;
 if operation='get_my_visit' then
  return jsonb_build_object('visit',app_private.visit_view(v.id,sid,t),'ghost_preference',m.ghost_preference,'mode_revision',m.mode_revision::text,'server_time',t);
 end if;
 if operation='set_presence_mode' then
  if jsonb_typeof(payload->'ghost') is distinct from 'boolean' then raise exception 'invalid_input'; end if;
  desired:=(payload->>'ghost')::boolean; request:=(payload->>'request_id')::uuid;
  if request is null then raise exception 'invalid_input'; end if;
  -- Lost response retry is harmless; old requests cannot undo a newer mode.
  if request=m.mode_request then
   return jsonb_build_object('visit',app_private.visit_view(v.id,sid,t),'ghost_preference',m.ghost_preference,'mode_revision',m.mode_revision::text,'server_time',t);
  end if;
  if (payload->>'mode_revision')::bigint is distinct from m.mode_revision then raise exception 'conflict'; end if;
  if v.id is not null and v.expires_at>t then
   if v.writer_session_id<>sid then raise exception 'wrong_writer'; end if;
   if (payload->>'visit_id')::uuid is distinct from v.id then raise exception 'conflict'; end if;
   if not desired then
    -- Publish and the fresh inside observation are one transaction. Any invalid
    -- location/sequence/boundary rolls this change back, leaving ghost enabled.
    if payload->>'verdict' is distinct from 'inside' then raise exception 'invalid_input'; end if;
    update app_private.visits set ghost=false where id=v.id;
    result:=app_private.pre_ghost_api('observe_visit',payload);
    if result->>'result' is distinct from 'accepted' then raise exception 'stale_observation'; end if;
   else
    delete from app_private.presence where visit_id=v.id;
    update app_private.recruitments set ended_at=t,revision=revision+1 where visit_id=v.id and ended_at is null;
   end if;
   update app_private.visits set ghost=desired,mode_revision=m.mode_revision+1,revision=revision+1 where id=v.id;
  elsif payload->>'visit_id' is not null then
   -- A request bound to an ended visit must not change the next visit's preference.
   raise exception 'inactive_visit';
  end if;
  update app_private.members set ghost_preference=desired,mode_revision=mode_revision+1,mode_request=request where account_id=uid;
  return jsonb_build_object('visit',app_private.visit_view(v.id,sid,clock_timestamp()),'ghost_preference',desired,'mode_revision',(m.mode_revision+1)::text,'server_time',clock_timestamp());
 end if;
 -- Every observation is bound to a mode revision, so a queued public update
 -- cannot reappear after a ghost/public round trip.
 if v.id is null or (payload->>'visit_id')::uuid is distinct from v.id then raise exception 'inactive_visit'; end if;
 if v.writer_session_id<>sid then raise exception 'wrong_writer'; end if;
 if v.expires_at<=t then raise exception 'inactive_visit'; end if;
 if coalesce((payload->>'mode_revision')::bigint,0)<>v.mode_revision then raise exception 'conflict'; end if;
 if not v.ghost then return app_private.pre_ghost_api(operation,payload); end if;
 if payload ? 'cell_id' or payload ? 'grid_version' then raise exception 'invalid_input'; end if;
 select * into st from app_private.streets where id=v.street_id for share;
 seq:=(payload->>'seq')::bigint;
 if seq is null or seq<=0 then raise exception 'invalid_seq'; end if;
 if seq<=v.last_seq then return jsonb_build_object('result','ignored','visit',app_private.visit_view(v.id,sid,t)); end if;
 if (payload->>'area_version')::bigint is distinct from st.area_version then raise exception 'area_changed'; end if;
 observed:=(payload->>'observed_at')::timestamptz; accuracy:=(payload->>'horizontal_accuracy_m')::double precision;
 if observed is null or not isfinite(observed) or observed>t+interval '5 seconds' or observed<t-interval '120 seconds' then raise exception 'stale_observation'; end if;
 if accuracy is null or not (accuracy>=0 and accuracy<=50) then raise exception 'invalid_accuracy'; end if;
 observed:=least(observed,t);
 if v.last_observed_at is not null and observed<=v.last_observed_at then raise exception 'stale_observation'; end if;
 if payload->>'verdict'='outside' then
  perform app_private.end_visit(v.id,'outside',t);
  return jsonb_build_object('result','ended','visit',app_private.visit_view(v.id,sid,t));
 elsif payload->>'verdict' is distinct from 'inside' then raise exception 'invalid_verdict'; end if;
 update app_private.visits set last_seq=seq,last_observed_at=observed,expires_at=t+interval '3 hours',revision=revision+1 where id=v.id;
 return jsonb_build_object('result','accepted','visit',app_private.visit_view(v.id,sid,t));
end $$;
create function app_private.clear_withdrawn_mode() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.withdrawn_at is not null then new.ghost_preference=false; new.mode_request=null; end if;
 return new;
end $$;
create trigger clear_withdrawn_mode before update of withdrawn_at on app_private.members
 for each row execute function app_private.clear_withdrawn_mode();
revoke all on all functions in schema app_private from public,anon,authenticated;
commit;
