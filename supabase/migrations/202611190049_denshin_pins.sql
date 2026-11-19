begin;
-- Additive migration: legacy event/recruitment data is intentionally preserved.
create table app_private.denshin_pins (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references app_private.members,
 street_id uuid not null references app_private.streets,
 body text not null check(char_length(btrim(body)) between 1 and 500),
 longitude double precision not null check(longitude between -180 and 180),
 latitude double precision not null check(latitude between -90 and 90),
 recruiting boolean not null default false,
 capacity integer check(capacity between 1 and 100),
 host_arrived boolean not null default false,
 revision bigint not null default 1,
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null,
 deleted_at timestamptz,
 check(expires_at=created_at+interval '24 hours')
);
create index denshin_street_active on app_private.denshin_pins(street_id,expires_at) where deleted_at is null;
create table app_private.denshin_attendance (
 pin_id uuid not null references app_private.denshin_pins on delete cascade,
 account_id uuid not null references app_private.members,
 state text not null check(state in ('planned','arrived','left')),
 revision bigint not null default 1,
 updated_at timestamptz not null,
 primary key(pin_id,account_id)
);
create table app_private.denshin_daily_usage (
 account_id uuid not null references app_private.members,
 day date not null, used integer not null check(used between 1 and 3),
 primary key(account_id,day)
);
revoke all on app_private.denshin_pins,app_private.denshin_attendance,app_private.denshin_daily_usage from public,anon,authenticated;
create trigger gateway_changed after insert or update or delete on app_private.denshin_pins for each statement execute function app_private.gateway_changed();
create trigger gateway_changed after insert or update or delete on app_private.denshin_attendance for each statement execute function app_private.gateway_changed();

alter table app_private.notifications add column pin_id uuid references app_private.denshin_pins on delete cascade;
-- Migration 042 used an unnamed shape constraint. Locate only that constraint.
do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='app_private.notifications'::regclass and contype='c' and pg_get_constraintdef(oid) like '%message_id%' loop
 execute format('alter table app_private.notifications drop constraint %I',c.conname);
 end loop;
end $$;
alter table app_private.notifications add constraint notification_target_shape check (
 (kind='mention' and message_id is not null and event_id is null and event_revision is null and pin_id is null)
 or (kind in ('changed','canceled') and event_id is not null and event_revision is not null and message_id is null and pin_id is null)
 or (kind in ('pin_changed','pin_closed') and pin_id is not null and event_revision is not null and event_id is null and message_id is null)
);
create unique index one_pin_notice on app_private.notifications(pin_id,event_revision,recipient) where pin_id is not null;
alter table app_private.reports drop constraint reports_target_kind_check;
alter table app_private.reports add constraint reports_target_kind_check check(target_kind in ('message','recruitment','event','denshin'));

create function app_private.denshin_view(pid uuid,actor uuid,t timestamptz) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('id',p.id,'street_id',p.street_id,'author_id',p.owner_id,'body',p.body,
 'longitude',p.longitude,'latitude',p.latitude,'recruiting',p.recruiting,'capacity',p.capacity,
 'host_arrived',p.host_arrived,'revision',p.revision,'created_at',p.created_at,'expires_at',p.expires_at,
 'mine',p.owner_id=actor,'display_name',coalesce(pr.display_name,'名前未設定'),'avatar_path',pr.avatar_path,
 'blocked',exists(select 1 from app_private.blocks b where b.owner_id=actor and b.target_id=p.owner_id),
 'count',(select count(*) from app_private.denshin_attendance a where a.pin_id=p.id and a.state<>'left'),
 'attendance',coalesce((select a.state from app_private.denshin_attendance a where a.pin_id=p.id and a.account_id=actor),'left'),
 'attendance_revision',coalesce((select a.revision from app_private.denshin_attendance a where a.pin_id=p.id and a.account_id=actor),0),
 'people',coalesce((select jsonb_agg(jsonb_build_object('account_id',a.account_id,'display_name',coalesce(pr2.display_name,'名前未設定'),
 'avatar_path',pr2.avatar_path,'state',a.state) order by a.updated_at,a.account_id)
 from app_private.denshin_attendance a left join app_private.profiles pr2 on pr2.account_id=a.account_id
 where a.pin_id=p.id and a.state<>'left' and not exists(select 1 from app_private.blocks b where b.owner_id=actor and b.target_id=a.account_id)),'[]'::jsonb))
 from app_private.denshin_pins p left join app_private.profiles pr on pr.account_id=p.owner_id
 where p.id=pid and p.deleted_at is null and p.expires_at>t
$$;
create function app_private.denshin_notify(pid uuid,rev bigint,notice_kind text,t timestamptz) returns void language plpgsql set search_path='' as $$
begin
 insert into app_private.notifications(pin_id,event_revision,recipient,kind,created_at)
 select pid,rev,a.account_id,notice_kind,t from app_private.denshin_attendance a
 where a.pin_id=pid and a.state<>'left' on conflict do nothing;
 insert into app_private.notification_outbox(notification_id)
 select n.id from app_private.notifications n where n.pin_id=pid and n.event_revision=rev on conflict do nothing;
end $$;

alter function app_private.execute_command(text,jsonb,uuid,timestamptz,uuid) rename to execute_before_denshin;
create function app_private.execute_command(kind text,body jsonb,actor uuid,t timestamptz,command_id uuid)
returns jsonb language plpgsql set search_path='' as $$
declare p app_private.denshin_pins%rowtype; a app_private.denshin_attendance%rowtype;
 pid uuid; msg text; lon double precision;lat double precision; cap integer; mode boolean; desired text; n integer; day_jst date;
begin
 if kind not in ('denshin_create','denshin_edit','denshin_delete','denshin_attend','denshin_mode','denshin_host') then
 return app_private.execute_before_denshin(kind,body,actor,t,command_id); end if;
 -- command_api holds the acting member lock. All transitions then lock the PIN.
 if kind in ('denshin_create','denshin_edit','denshin_mode') and exists(select 1 from app_private.chat_restrictions where account_id=actor and until_at>t) then raise exception 'posting_restricted'; end if;
 if kind='denshin_create' then
  msg:=btrim(execute_command.body->>'body');lon:=(execute_command.body->>'longitude')::double precision;lat:=(execute_command.body->>'latitude')::double precision;
  cap:=(execute_command.body->>'capacity')::integer;mode:=(execute_command.body->>'recruiting')::boolean;
  if msg is null or char_length(msg) not between 1 and 500 or mode is null or (cap is not null and cap not between 1 and 100)
   or not app_private.inside_street((execute_command.body->>'street_id')::uuid,lon,lat) then raise exception 'invalid_input';end if;
  day_jst:=(t at time zone 'Asia/Tokyo')::date;
  if coalesce((select used from app_private.denshin_daily_usage where account_id=actor and day=day_jst),0)>=3 then raise exception 'daily_limit';end if;
  if (select count(*) from app_private.denshin_pins where owner_id=actor and deleted_at is null and expires_at>t)>=3 then raise exception 'active_limit';end if;
  insert into app_private.denshin_daily_usage values(actor,day_jst,1) on conflict(account_id,day) do update set used=app_private.denshin_daily_usage.used+1;
  insert into app_private.denshin_pins(owner_id,street_id,body,longitude,latitude,recruiting,capacity,created_at,expires_at)
  values(actor,(execute_command.body->>'street_id')::uuid,msg,lon,lat,mode,cap,t,t+interval '24 hours') returning id into pid;
  return jsonb_build_object('id',pid);
 end if;
 select * into p from app_private.denshin_pins where id=(execute_command.body->>'id')::uuid for update;
 -- Sample time after the row lock, so lock waits cannot extend the lifetime.
 t:=clock_timestamp();
 if not found or p.deleted_at is not null or p.expires_at<=t then raise exception 'not_found';end if;
 if (execute_command.body->>'revision')::bigint is distinct from p.revision then raise exception 'conflict';end if;
 if kind='denshin_attend' then
  if p.owner_id=actor then raise exception 'invalid_input';end if;
  desired:=execute_command.body->>'state';
  if desired is null or desired not in ('planned','arrived','left') then raise exception 'invalid_input';end if;
  select * into a from app_private.denshin_attendance where pin_id=p.id and account_id=actor;
  if (execute_command.body->>'attendance_revision')::bigint is distinct from coalesce(a.revision,0) then raise exception 'conflict';end if;
  if desired<>'left' and (not p.recruiting or exists(select 1 from app_private.blocks where owner_id=actor and target_id=p.owner_id)) then raise exception 'not_recruiting';end if;
  if desired='arrived' and coalesce(a.state,'left')<>'planned' then raise exception 'invalid_transition';end if;
  if desired='planned' and coalesce(a.state,'left')<>'left' then raise exception 'invalid_transition';end if;
  if desired='planned' and p.capacity is not null and (select count(*) from app_private.denshin_attendance where pin_id=p.id and state<>'left')>=p.capacity then raise exception 'full';end if;
  insert into app_private.denshin_attendance values(p.id,actor,desired,coalesce(a.revision,0)+1,t)
  on conflict(pin_id,account_id) do update set state=excluded.state,revision=excluded.revision,updated_at=excluded.updated_at;
  if desired='left' then delete from app_private.notifications where pin_id=p.id and recipient=actor;end if;
  return jsonb_build_object('id',p.id);
 end if;
 if p.owner_id<>actor then raise exception 'membership_required';end if;
 if kind='denshin_delete' then
  perform app_private.denshin_notify(p.id,p.revision+1,'pin_closed',t);
  update app_private.denshin_pins set deleted_at=t,revision=revision+1,host_arrived=false where id=p.id;
 elsif kind='denshin_host' then
  if not p.recruiting or (execute_command.body->>'arrived')::boolean is null then raise exception 'not_recruiting';end if;
  update app_private.denshin_pins set host_arrived=(execute_command.body->>'arrived')::boolean,revision=revision+1 where id=p.id;
 else
  mode:=(execute_command.body->>'recruiting')::boolean;
  if mode is null then raise exception 'invalid_input';end if;
  if kind='denshin_mode' then msg:=p.body;lon:=p.longitude;lat:=p.latitude;cap:=p.capacity;
  else
   msg:=btrim(execute_command.body->>'body');lon:=(execute_command.body->>'longitude')::double precision;lat:=(execute_command.body->>'latitude')::double precision;cap:=(execute_command.body->>'capacity')::integer;
   if msg is null or char_length(msg) not between 1 and 500 or (cap is not null and cap not between 1 and 100) or not app_private.inside_street(p.street_id,lon,lat) then raise exception 'invalid_input';end if;
  end if;
  select count(*) into n from app_private.denshin_attendance where pin_id=p.id and state<>'left';
  if cap<n or (n>0 and (lon is distinct from p.longitude or lat is distinct from p.latitude)) then raise exception 'participants_present';end if;
  if p.recruiting and not mode then
   if n>0 and coalesce((execute_command.body->>'confirm_close')::boolean,false)=false then raise exception 'confirmation_required';end if;
   perform app_private.denshin_notify(p.id,p.revision+1,'pin_closed',t);
  elsif msg<>p.body then perform app_private.denshin_notify(p.id,p.revision+1,'pin_changed',t);end if;
  update app_private.denshin_pins set body=msg,longitude=lon,latitude=lat,capacity=cap,recruiting=mode,
   host_arrived=case when mode then host_arrived else false end,revision=revision+1 where id=p.id;
 end if;
 if kind='denshin_delete' or (p.recruiting and mode=false) then
  update app_private.denshin_attendance set state='left',revision=revision+1,updated_at=t where pin_id=p.id and state<>'left';
 end if;
 return jsonb_build_object('id',p.id);
end $$;

alter function app_private.notification_sendable(uuid,timestamptz) rename to notification_sendable_before_denshin;
create function app_private.notification_sendable(nid uuid,t timestamptz) returns boolean language sql stable set search_path='' as $$
 select app_private.notification_sendable_before_denshin(nid,t) or exists(
 select 1 from app_private.notifications n join app_private.denshin_pins p on p.id=n.pin_id
 join app_private.members m on m.account_id=n.recipient and m.active and m.withdrawn_at is null
 where n.id=nid and n.created_at+interval '24 hours'>t
 and ((n.kind='pin_closed') or (n.kind='pin_changed' and p.deleted_at is null and p.expires_at>t and p.recruiting
  and exists(select 1 from app_private.denshin_attendance a where a.pin_id=p.id and a.account_id=n.recipient and a.state<>'left')))
 and not exists(select 1 from app_private.notifications newer where newer.pin_id=p.id and newer.recipient=n.recipient and newer.event_revision>n.event_revision))
$$;

alter function app_private.street_api(text,jsonb) rename to before_denshin_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;t timestamptz;result jsonb; additions jsonb;
 p app_private.denshin_pins%rowtype;rid uuid;c app_private.commands%rowtype;
begin
 if operation not in ('denshin_list','denshin_get') and not(operation='command_prepare' and payload->>'kind' like 'denshin_%')
  and not(operation='report_create' and payload->>'target_kind'='denshin') then
  result:=app_private.before_denshin_api(operation,payload);
  if operation='notification_list' then
   select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'pin_id',n.pin_id,'kind',n.kind,'title','電信PIN',
    'created_at',n.created_at,'read',n.read_at is not null) order by n.created_at desc),'[]'::jsonb) into additions
    from app_private.notifications n where n.recipient=uid and n.pin_id is not null and app_private.notification_sendable(n.id,clock_timestamp());
   return jsonb_set(result,'{items}',result->'items'||additions);
  end if;
  return result;
 end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;t:=clock_timestamp();
 if operation='command_prepare' then
  if payload->>'kind' not in ('denshin_create','denshin_edit','denshin_delete','denshin_attend','denshin_mode','denshin_host') then raise exception 'invalid_input';end if;
  if(select count(*) from app_private.commands where owner_id=uid and issued_at>t-interval '1 minute')>=120 then raise exception 'rate_limited';end if;
  insert into app_private.commands(owner_id,kind,issued_at,accept_until) values(uid,payload->>'kind',t,t+interval '10 minutes') returning * into c;
  return jsonb_build_object('id',c.id,'accept_until',c.accept_until);
 elsif operation='denshin_list' then
  select coalesce(jsonb_agg(app_private.denshin_view(pins.id,uid,t) order by pins.created_at desc),'[]'::jsonb) into result
   from app_private.denshin_pins pins where pins.street_id=(payload->>'street_id')::uuid and pins.deleted_at is null and pins.expires_at>t
   and not exists(select 1 from app_private.blocks b where b.owner_id=uid and b.target_id=pins.owner_id);
  -- Blocked creators' memberships are returned separately, with no text/location/name.
  select coalesce(jsonb_agg(jsonb_build_object('id',p2.id,'attendance',a.state,'revision',p2.revision,'attendance_revision',a.revision,'expires_at',p2.expires_at)),'[]'::jsonb)
   into additions from app_private.denshin_pins p2 join app_private.denshin_attendance a on a.pin_id=p2.id and a.account_id=uid and a.state<>'left'
   where p2.street_id=(payload->>'street_id')::uuid and p2.deleted_at is null and p2.expires_at>t
   and exists(select 1 from app_private.blocks b where b.owner_id=uid and b.target_id=p2.owner_id);
  return jsonb_build_object('items',result,'hidden_attendance',additions,'server_time',t);
 end if;
 select * into p from app_private.denshin_pins where id=coalesce(payload->>'id',payload->>'target_id')::uuid;
 if not found or p.deleted_at is not null or p.expires_at<=t or exists(select 1 from app_private.blocks where owner_id=uid and target_id=p.owner_id) then raise exception 'not_found';end if;
 if operation='denshin_get' then return app_private.denshin_view(p.id,uid,t)||jsonb_build_object('server_time',t);end if;
 if payload->>'reason' is null or payload->>'reason' not in ('spam','harassment','other') or char_length(coalesce(payload->>'description',''))>1000 then raise exception 'invalid_input';end if;
 select id into rid from app_private.reports where reporter=uid and target_kind='denshin' and target_id=p.id and resolved_at is null;
 if rid is not null then return jsonb_build_object('id',rid);end if;
 if(select count(*) from app_private.request_limits where account_id=uid and kind='report' and at>t-interval '1 minute')>=10 then raise exception 'rate_limited';end if;
 insert into app_private.reports(reporter,target_kind,target_id,subject_id,reason,description,evidence)
 values(uid,'denshin',p.id,p.owner_id,payload->>'reason',coalesce(payload->>'description',''),jsonb_build_object('body',p.body,'street_id',p.street_id,'created_at',p.created_at)) returning id into rid;
 insert into app_private.request_limits values(uid,'report',t);
 return jsonb_build_object('id',rid);
end $$;

create function app_private.denshin_member_stopped() returns trigger language plpgsql security definer set search_path='' as $$
declare p record;t timestamptz:=clock_timestamp();begin
 if old.active and not new.active then
  perform 1 from app_private.denshin_pins dp where dp.owner_id=new.account_id or exists(select 1 from app_private.denshin_attendance a where a.pin_id=dp.id and a.account_id=new.account_id and a.state<>'left') order by dp.id for update;
  for p in select * from app_private.denshin_pins where owner_id=new.account_id and deleted_at is null and expires_at>t order by id loop
   perform app_private.denshin_notify(p.id,p.revision+1,'pin_closed',t);
   update app_private.denshin_pins set deleted_at=t,host_arrived=false,revision=revision+1 where id=p.id;
   update app_private.denshin_attendance set state='left',revision=revision+1,updated_at=t where pin_id=p.id and state<>'left';
  end loop;
  update app_private.denshin_attendance set state='left',revision=revision+1,updated_at=t where account_id=new.account_id and state<>'left';
  delete from app_private.notifications where recipient=new.account_id;
 end if;return null;end $$;
create trigger denshin_member_stopped after update of active on app_private.members for each row execute function app_private.denshin_member_stopped();
alter function app_private.cleanup() rename to cleanup_before_denshin;
create function app_private.cleanup() returns void language plpgsql security definer set search_path='' as $$
begin
 perform app_private.cleanup_before_denshin();
 delete from app_private.denshin_pins where least(expires_at,coalesce(deleted_at,expires_at))+interval '24 hours'<=clock_timestamp();
 delete from app_private.denshin_daily_usage where day<(clock_timestamp() at time zone 'Asia/Tokyo')::date;
end $$;
create or replace function public.street_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare code text; status text;
begin
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>4096 then
  raise exception 'invalid_input' using errcode='PT422';
 end if;
 return app_private.street_api(operation,payload);
exception when others then
 code:=sqlerrm;
 if code in ('unauthorized','login_required') then status:='PT401';
 elsif code in ('membership_required','posting_restricted') then status:='PT403';
 elsif code='not_found' then status:='PT404';
 elsif code in ('rate_limited','daily_limit','active_limit') then status:='PT429';
 elsif code in ('full','not_recruiting','invalid_transition','participants_present','confirmation_required','inactive_tag','area_unpublished','attempt_expired','conflict','tag_changed','wrong_writer','inactive_visit','area_changed','stale_observation') then status:='PT409';
 elsif code in ('invalid_reason','invalid_seq','invalid_accuracy','invalid_cell','invalid_verdict','unknown_operation','invalid_input') or sqlstate in ('22P02','22007','22008','22003') then code:='invalid_input';status:='PT422';
 else code:='request_failed';status:='PT503'; end if;
 raise exception using message=code,errcode=status;
end $$;

revoke all on all functions in schema app_private from public,anon,authenticated;
commit;
