begin;
create extension if not exists postgis with schema extensions;
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
create table app_private.members (
 account_id uuid primary key references auth.users(id), active boolean not null default true,
 epoch bigint not null default 0 check(epoch>=0)
);
create table app_private.streets (
 id uuid primary key, name text not null, area_version bigint not null default 1, grid_version bigint not null default 1
);
create table app_private.areas (
 street_id uuid references app_private.streets, version bigint, polygon extensions.geometry(Polygon) not null,
 primary key(street_id,version), check(extensions.st_isvalid(polygon))
);
create table app_private.tags (
 id uuid primary key, street_id uuid not null references app_private.streets,
 revision bigint not null default 1, active boolean not null default false
);
create table app_private.visits (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references app_private.members,
 street_id uuid not null references app_private.streets, writer_session_id uuid not null,
 started_at timestamptz not null, expires_at timestamptz not null,
 ended_at timestamptz, end_reason text, revision bigint not null default 1,
 last_seq bigint not null default 0 check(last_seq>=0), last_observed_at timestamptz,
 check((ended_at is null)=(end_reason is null)),
 check(end_reason is null or end_reason in ('manual','logout','outside','expired','replaced','checkin_canceled','banned'))
);
create unique index one_open_visit on app_private.visits(account_id) where ended_at is null;
create index visit_expiry on app_private.visits(street_id,expires_at);
create table app_private.attempts (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references app_private.members,
 session_id uuid not null, street_id uuid not null references app_private.streets,
 tag_id uuid references app_private.tags, tag_revision bigint, expected_epoch bigint not null,
 issued_at timestamptz not null, accept_until timestamptz not null,
 state text not null default 'pending' check(state in ('pending','committed','canceled','rejected')),
 result_visit_id uuid, result_kind text check(result_kind in ('created','reused'))
);
create table app_private.presence (
 visit_id uuid primary key references app_private.visits on delete cascade,
 area_version bigint not null, grid_version bigint not null, cell_id text not null,
 observed_at timestamptz not null, expires_at timestamptz not null,
 check(expires_at=observed_at+interval '10 minutes')
);
create index presence_expiry on app_private.presence(expires_at);
create table app_private.arrival_logs (
 id uuid primary key default gen_random_uuid(), source_visit_id uuid not null unique,
 account_id uuid not null, street_id uuid not null, created_at timestamptz not null
);
-- Recruitment integration boundary: later feature must create through a guarded RPC.
create table app_private.recruitments (
 id uuid primary key default gen_random_uuid(), visit_id uuid not null references app_private.visits,
 expires_at timestamptz not null, ended_at timestamptz
);

create function app_private.end_visit(v_id uuid, reason text, t timestamptz) returns void
language plpgsql set search_path='' as $$
declare owner_id uuid;
begin
 update app_private.visits set ended_at=t,end_reason=reason,revision=revision+1
 where id=v_id and ended_at is null returning account_id into owner_id;
 if owner_id is not null then
  delete from app_private.presence where visit_id=v_id;
  update app_private.recruitments set ended_at=t where visit_id=v_id and ended_at is null;
  update app_private.members set epoch=epoch+1 where account_id=owner_id;
  update app_private.attempts set tag_id=null,tag_revision=null where result_visit_id=v_id;
 end if;
end $$;

create function app_private.visit_view(v_id uuid,sid uuid,t timestamptz) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('visit_id',v.id,'street_id',v.street_id,'revision',v.revision::text,
 'last_seq',v.last_seq::text,'state',case when v.ended_at is not null then 'ended' when v.expires_at<=t then 'expired' else 'active' end,
 'expires_at',v.expires_at,'can_update',v.writer_session_id=sid and v.ended_at is null and v.expires_at>t,
 'presence_expires_at',(select p.expires_at from app_private.presence p where p.visit_id=v.id and p.expires_at>t))
 from app_private.visits v where v.id=v_id
$$;

create function public.street_api(operation text, payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid; t timestamptz;
 m app_private.members%rowtype; v app_private.visits%rowtype; a app_private.attempts%rowtype;
 tag app_private.tags%rowtype; st app_private.streets%rowtype;
 v_id uuid; observed timestamptz; seq bigint; accuracy double precision;
 col integer; row_ integer; cell extensions.geometry; poly extensions.geometry;
 cells jsonb; checked integer; present integer; result text;
 projection constant text := '+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs';
begin
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then
  raise exception 'unauthorized' using errcode='28000';
 end if;
 select * into m from app_private.members where account_id=uid for update;
 if not found or not m.active then raise exception 'membership_required' using errcode='42501'; end if;
 t:=clock_timestamp();
 if operation='time' then return jsonb_build_object('server_time',clock_timestamp()); end if;
 if operation='get_my_visit' then
  select * into v from app_private.visits where account_id=uid and ended_at is null;
  return jsonb_build_object('server_time',t,'visit',app_private.visit_view(v.id,sid,t));
 elsif operation in ('get_street_config','get_presence_snapshot') then
  select * into st from app_private.streets where id=(payload->>'street_id')::uuid;
  if not found then raise exception 'not_found'; end if;
  if operation='get_street_config' then
   select polygon into poly from app_private.areas where street_id=st.id and version=st.area_version;
   return jsonb_build_object('server_time',t,'street_id',st.id,'name',st.name,
    'area_version',st.area_version::text,'grid_version',st.grid_version::text,
    'polygon',extensions.st_asgeojson(poly)::jsonb,'projection',projection,'cell_size_m',100);
  end if;
  -- One SQL snapshot for visit count and all presence aggregates.
  with live as (
   select p.*,vv.street_id from app_private.presence p join app_private.visits vv on vv.id=p.visit_id
   join app_private.members mm on mm.account_id=vv.account_id
   where vv.street_id=st.id and mm.active and vv.ended_at is null and vv.expires_at>t and p.expires_at>t
  ), buckets as (
   select grid_version,area_version,cell_id,expires_at,count(*) n from live group by 1,2,3,4
  ), groups as (
   select grid_version,area_version,cell_id,sum(n)::int n,
   jsonb_agg(jsonb_build_object('expires_at',expires_at,'count',n) order by expires_at) expiry_groups
   from buckets group by 1,2,3
  ), located as (
   select g.*,extensions.st_transform(extensions.st_pointonsurface(extensions.st_intersection(ar.polygon,
     extensions.st_makeenvelope(split_part(cell_id,':',1)::int*100,split_part(cell_id,':',2)::int*100,
     split_part(cell_id,':',1)::int*100+100,split_part(cell_id,':',2)::int*100+100))),projection,'+proj=longlat +datum=WGS84 +no_defs') anchor
   from groups g join app_private.areas ar on ar.street_id=st.id and ar.version=g.area_version
  ) select
   (select count(*) from app_private.visits vv join app_private.members mm on mm.account_id=vv.account_id
     where vv.street_id=st.id and mm.active and vv.ended_at is null and vv.expires_at>t),
   (select count(*) from live),
   coalesce((select jsonb_agg(jsonb_build_object('grid_version',grid_version::text,'area_version',area_version::text,
    'cell_id',cell_id,'count',n,'expiry_groups',expiry_groups,'anchor',jsonb_build_object('longitude',extensions.st_x(anchor),'latitude',extensions.st_y(anchor)))) from located),'[]'::jsonb)
   into checked,present,cells;
  return jsonb_build_object('server_time',t,'street_id',st.id,'checked_in_count',checked,'presence_count',present,'cells',cells);
 elsif operation='prepare_checkin' then
  select * into tag from app_private.tags where id=(payload->>'tag_id')::uuid;
  if not found then raise exception 'inactive_tag'; end if;
  select * into st from app_private.streets where id=tag.street_id for share;
  select * into tag from app_private.tags where id=tag.id for share;
  if not tag.active or (payload->>'payload_version') is distinct from '1' then raise exception 'inactive_tag'; end if;
  if not exists(select 1 from app_private.areas where street_id=st.id and version=st.area_version) then raise exception 'area_unpublished'; end if;
  t:=clock_timestamp();
  if (select count(*) from app_private.attempts where account_id=uid and issued_at>t-interval '1 minute')>=10 then raise exception 'rate_limited'; end if;
  insert into app_private.attempts(account_id,session_id,street_id,tag_id,tag_revision,expected_epoch,issued_at,accept_until)
   values(uid,sid,st.id,tag.id,tag.revision,m.epoch,t,t+interval '2 minutes') returning * into a;
  return jsonb_build_object('server_time',t,'attempt_id',a.id,'accept_until',a.accept_until);
 elsif operation in ('commit_checkin','cancel_checkin','get_checkin_result') then
  select * into a from app_private.attempts where id=(payload->>'attempt_id')::uuid and account_id=uid and session_id=sid for update;
  if not found then raise exception 'not_found'; end if;
  if operation='cancel_checkin' then
   if a.result_kind='created' then perform app_private.end_visit(a.result_visit_id,'checkin_canceled',t); end if;
   update app_private.attempts set state='canceled' where id=a.id;
   return jsonb_build_object('server_time',t,'result','canceled','visit',app_private.visit_view(a.result_visit_id,sid,t));
  end if;
  if operation='get_checkin_result' or a.state<>'pending' then
   return jsonb_build_object('server_time',t,'result',case when a.state='pending' and a.accept_until<=t then 'expired' else a.state end,
    'visit',app_private.visit_view(a.result_visit_id,sid,t));
  end if;
  select * into st from app_private.streets where id=a.street_id for share;
  select * into tag from app_private.tags where id=a.tag_id for share;
  t:=clock_timestamp();
  if a.accept_until<=t then raise exception 'attempt_expired'; end if;
  if a.expected_epoch<>m.epoch then raise exception 'conflict'; end if;
  if tag.id is null or not tag.active or tag.revision<>a.tag_revision then raise exception 'tag_changed'; end if;
  select * into v from app_private.visits where account_id=uid and ended_at is null for update;
  if v.id is not null and v.expires_at>t and v.writer_session_id=sid and v.street_id=st.id then
   v_id:=v.id; result:='reused';
  else
   if v.id is not null then perform app_private.end_visit(v.id,case when v.expires_at<=t then 'expired' else 'replaced' end,least(t,v.expires_at)); end if;
   insert into app_private.visits(account_id,street_id,writer_session_id,started_at,expires_at)
    values(uid,st.id,sid,t,t+interval '3 hours') returning id into v_id;
   update app_private.members set epoch=epoch+1 where account_id=uid;
   insert into app_private.arrival_logs(source_visit_id,account_id,street_id,created_at) values(v_id,uid,st.id,t);
   result:='created';
  end if;
  update app_private.attempts set state='committed',result_visit_id=v_id,result_kind=result where id=a.id;
  return jsonb_build_object('server_time',t,'result',result,'visit',app_private.visit_view(v_id,sid,t));
 elsif operation in ('observe_visit','end_visit') then
  select * into v from app_private.visits where id=(payload->>'visit_id')::uuid and account_id=uid;
  if not found then raise exception 'not_found'; end if;
  select * into st from app_private.streets where id=v.street_id for share;
  select * into v from app_private.visits where id=v.id for update;
  t:=clock_timestamp();
  if v.writer_session_id<>sid then raise exception 'wrong_writer'; end if;
  if operation='end_visit' then
   if payload->>'reason' not in ('manual','logout') or payload->>'reason' is null then raise exception 'invalid_reason'; end if;
   perform app_private.end_visit(v.id,payload->>'reason',t);
   return jsonb_build_object('server_time',t,'result','ended','visit',app_private.visit_view(v.id,sid,t));
  end if;
  if v.ended_at is not null or v.expires_at<=t then raise exception 'inactive_visit'; end if;
  seq:=(payload->>'seq')::bigint;
  if seq is null or seq<=0 then raise exception 'invalid_seq'; end if;
  if seq<=v.last_seq then return jsonb_build_object('server_time',t,'result','ignored','visit',app_private.visit_view(v.id,sid,t)); end if;
  if (payload->>'area_version')::bigint is distinct from st.area_version then raise exception 'area_changed'; end if;
  observed:=(payload->>'observed_at')::timestamptz; accuracy:=(payload->>'horizontal_accuracy_m')::double precision;
  if observed is null or not isfinite(observed) or observed>t+interval '5 seconds' or observed<t-interval '120 seconds' then raise exception 'stale_observation'; end if;
  if accuracy is null or not (accuracy>=0 and accuracy<=50) then raise exception 'invalid_accuracy'; end if;
  observed:=least(observed,t);
  if v.last_observed_at is not null and observed<=v.last_observed_at then raise exception 'stale_observation'; end if;
  if payload->>'verdict'='outside' then
   perform app_private.end_visit(v.id,'outside',t); result:='ended';
  elsif payload->>'verdict'='inside' then
   if (payload->>'grid_version')::bigint is distinct from st.grid_version or coalesce(payload->>'cell_id','')!~'^-?[0-9]{1,6}:-?[0-9]{1,6}$' then raise exception 'invalid_cell'; end if;
   col:=split_part(payload->>'cell_id',':',1)::integer; row_:=split_part(payload->>'cell_id',':',2)::integer;
   cell:=extensions.st_makeenvelope(col*100,row_*100,col*100+100,row_*100+100);
   select polygon into poly from app_private.areas where street_id=st.id and version=st.area_version;
   if not extensions.st_area(extensions.st_intersection(poly,cell))>0 then raise exception 'invalid_cell'; end if;
   insert into app_private.presence values(v.id,st.area_version,st.grid_version,payload->>'cell_id',observed,observed+interval '10 minutes')
   on conflict(visit_id) do update set area_version=excluded.area_version,grid_version=excluded.grid_version,cell_id=excluded.cell_id,observed_at=excluded.observed_at,expires_at=excluded.expires_at;
   update app_private.visits set last_seq=seq,last_observed_at=observed,expires_at=t+interval '3 hours',revision=revision+1 where id=v.id;
   result:='accepted';
  else raise exception 'invalid_verdict'; end if;
  return jsonb_build_object('server_time',t,'result',result,'visit',app_private.visit_view(v.id,sid,t));
 else raise exception 'unknown_operation'; end if;
end $$;

-- Default PUBLIC execution must not expose private helpers.
revoke all on all tables in schema app_private from public,anon,authenticated;
revoke all on all functions in schema app_private from public,anon,authenticated;
revoke all on function public.street_api(text,jsonb) from public,anon;
grant execute on function public.street_api(text,jsonb) to authenticated;
commit;
