begin;
alter table app_private.recruitments add column title text check(char_length(title) between 1 and 50),add column longitude double precision check(longitude between -180 and 180),add column latitude double precision check(latitude between -90 and 90),add column created_at timestamptz not null default clock_timestamp(),add column revision bigint not null default 1;
create function app_private.recruitment_view(rid uuid,actor uuid,t timestamptz) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',r.id,'title',r.title,'longitude',r.longitude,'latitude',r.latitude,'expires_at',r.expires_at,'revision',r.revision,'mine',v.account_id=actor,'author_id',v.account_id,'display_name',coalesce(p.display_name,'名前未設定'))
 from app_private.recruitments r join app_private.visits v on v.id=r.visit_id left join app_private.profiles p on p.account_id=v.account_id
 where r.id=rid and r.title is not null and r.ended_at is null and r.expires_at>t and v.ended_at is null and v.expires_at>t
 and not exists(select 1 from app_private.blocks b where b.owner_id=actor and b.target_id=v.account_id)
$$;
alter function app_private.execute_command(text,jsonb,uuid,timestamptz,uuid) rename to execute_event_command;
create function app_private.execute_command(kind text,body jsonb,actor uuid,t timestamptz,command_id uuid) returns jsonb language plpgsql set search_path='' as $$
declare v app_private.visits%rowtype;rid uuid;title text;lon double precision;lat double precision;accuracy double precision;observed timestamptz;
begin
 if kind<>'recruitment_create' then return app_private.execute_event_command(kind,body,actor,t,command_id);end if;
 select * into v from app_private.visits where id=(body->>'visit_id')::uuid and account_id=actor for update;
 if not found or v.ended_at is not null or v.expires_at<=t or v.writer_session_id is distinct from (auth.jwt()->>'session_id')::uuid then raise exception 'inactive_visit';end if;
 title:=btrim(body->>'title');lon:=(body->>'longitude')::double precision;lat:=(body->>'latitude')::double precision;accuracy:=(body->>'accuracy')::double precision;observed:=(body->>'observed_at')::timestamptz;
 if title is null or char_length(title) not between 1 and 50 or accuracy is null or accuracy not between 0 and 50 or observed is null or not isfinite(observed) or observed<t-interval '120 seconds' or observed>t+interval '2 seconds' or not app_private.inside_street(v.street_id,lon,lat) then raise exception 'invalid_input';end if;
 if exists(select 1 from app_private.recruitments r where r.visit_id=v.id and r.ended_at is null and r.expires_at>t) then raise exception 'conflict';end if;
 if(select count(*) from app_private.request_limits l where l.account_id=actor and l.kind='pin_create' and l.at>t-interval '1 minute')>=3 then raise exception 'rate_limited';end if;
 insert into app_private.request_limits values(actor,'pin_create',t);
 insert into app_private.recruitments(visit_id,title,longitude,latitude,created_at,expires_at) values(v.id,title,lon,lat,t,t+interval '20 minutes') returning id into rid;
 perform realtime.send('{}'::jsonb,'changed','street:'||v.street_id::text,true);
 return jsonb_build_object('id',rid);
end $$;
alter function app_private.street_api(text,jsonb) rename to event_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;t timestamptz;r app_private.recruitments%rowtype;v app_private.visits%rowtype;result jsonb;title text;
begin
 if operation not in ('recruitment_list','recruitment_get','recruitment_edit','recruitment_end') then return app_private.event_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;if not found then raise exception 'membership_required';end if;t:=clock_timestamp();
 if operation='recruitment_list' then
  select coalesce(jsonb_agg(x.data),'[]'::jsonb) into result from (select app_private.recruitment_view(rr.id,uid,t) data from app_private.recruitments rr join app_private.visits vv on vv.id=rr.visit_id where vv.street_id=(payload->>'street_id')::uuid) x where x.data is not null;
  return jsonb_build_object('items',result,'server_time',t);
 elsif operation='recruitment_get' then
  result:=app_private.recruitment_view((payload->>'id')::uuid,uid,t);if result is null then raise exception 'not_found';end if;return result;
 end if;
 select * into r from app_private.recruitments where id=(payload->>'id')::uuid;
 if not found then raise exception 'not_found';end if;
 select * into v from app_private.visits where id=r.visit_id for update;
 if v.account_id is distinct from uid then raise exception 'membership_required';end if;
 select * into r from app_private.recruitments where id=r.id for update;
 if operation='recruitment_end' then
  update app_private.recruitments set ended_at=coalesce(ended_at,t),revision=case when ended_at is null then revision+1 else revision end where id=r.id;
 else
  if r.ended_at is not null or r.expires_at<=t or v.ended_at is not null or v.expires_at<=t then raise exception 'inactive_visit';end if;
  if (payload->>'revision')::bigint is distinct from r.revision then raise exception 'conflict';end if;
  title:=btrim(payload->>'title');if title is null or char_length(title) not between 1 and 50 then raise exception 'invalid_input';end if;
  update app_private.recruitments set title=payload->>'title',revision=revision+1 where id=r.id;
 end if;
 perform realtime.send('{}'::jsonb,'changed','street:'||v.street_id::text,true);
 return jsonb_build_object('id',r.id);
end $$;
revoke all on all functions in schema app_private from public,anon,authenticated;
commit;
