begin;
create table app_private.push_devices (
 id uuid primary key default gen_random_uuid(),
 account_id uuid not null references app_private.members,
 session_id uuid not null references auth.sessions on delete cascade,
 environment text not null check(environment in ('sandbox','production')),
 token text not null check(token ~ '^[0-9a-f]+$' and length(token) between 2 and 512 and length(token)%2=0),
 registered_at timestamptz not null default clock_timestamp(),
 unique(environment,token), unique(session_id,environment)
);
create table app_private.push_attempts (
 notification_id uuid not null references app_private.notifications on delete cascade,
 device_id uuid not null references app_private.push_devices on delete cascade,
 state text not null default 'pending' check(state in ('pending','accepted','failed')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default clock_timestamp(),
 lease uuid, lease_until timestamptz,
 primary key(notification_id,device_id)
);
revoke all on app_private.push_devices,app_private.push_attempts from public,anon,authenticated;
create function public.push_registration(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;
 env text:=payload->>'environment';tok text:=lower(payload->>'token');d app_private.push_devices%rowtype;
begin
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid and (not_after is null or not_after>clock_timestamp())) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid for update;
 if not found then raise exception 'membership_required';end if;
 if operation='remove' then
  delete from app_private.push_devices where session_id=sid and account_id=uid;
  return '{"removed":true}'::jsonb;
 end if;
 if operation<>'register' or env is null or env not in ('sandbox','production') or tok is null or tok !~ '^[0-9a-f]+$' or length(tok) not between 2 and 512 or length(tok)%2<>0 then raise exception 'invalid_input';end if;
 if not exists(select 1 from app_private.members where account_id=uid and active and withdrawn_at is null) then raise exception 'membership_required';end if;
 -- Serialize token ownership changes, without exposing a token lookup endpoint.
 perform pg_advisory_xact_lock(hashtextextended(env||':'||tok,0));
 select * into d from app_private.push_devices where environment=env and token=tok for update;
 if found and d.account_id=uid and d.session_id=sid then
  update app_private.push_devices set registered_at=clock_timestamp() where id=d.id;
 else
  delete from app_private.push_devices where (environment=env and token=tok) or (session_id=sid and environment=env);
  insert into app_private.push_devices(account_id,session_id,environment,token) values(uid,sid,env,tok);
 end if;
 return '{"registered":true}'::jsonb;
end $$;
revoke all on function public.push_registration(text,jsonb) from public,anon;
grant execute on function public.push_registration(text,jsonb) to authenticated;

create function app_private.remove_stopped_push_devices() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not new.active or new.withdrawn_at is not null then
  delete from app_private.push_devices where account_id=new.account_id;
 end if;
 return null;
end $$;
create trigger remove_stopped_push_devices after update of active,withdrawn_at on app_private.members
 for each row execute function app_private.remove_stopped_push_devices();
revoke all on function app_private.remove_stopped_push_devices() from public,anon,authenticated;

create function public.push_delivery(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp();j app_private.push_attempts%rowtype;
 d app_private.push_devices%rowtype;n app_private.notifications%rowtype;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'unauthorized';end if;
 if operation='claim' then
  if payload->>'environment' is null or payload->>'environment' not in ('sandbox','production') then raise exception 'invalid_input';end if;
  delete from app_private.push_devices dev using auth.sessions s where dev.session_id=s.id and s.not_after<=t;
  insert into app_private.push_attempts(notification_id,device_id)
   select notice.id,dev.id from app_private.notifications notice join app_private.push_devices dev on dev.account_id=notice.recipient
   where dev.environment=payload->>'environment' and app_private.notification_sendable(notice.id,t)
   on conflict do nothing;
  select a.* into j from app_private.push_attempts a join app_private.push_devices dev on dev.id=a.device_id
   where a.state='pending' and a.next_attempt_at<=clock_timestamp() and (a.lease_until is null or a.lease_until<=t)
    and dev.environment=payload->>'environment'
   order by a.next_attempt_at,a.notification_id,a.device_id for update of a skip locked limit 1;
  if not found then return '{}'::jsonb;end if;
  update app_private.push_attempts set lease=gen_random_uuid(),lease_until=t+interval '1 minute',attempts=attempts+1
   where notification_id=j.notification_id and device_id=j.device_id returning * into j;
 else
  select * into j from app_private.push_attempts where notification_id=(payload->>'id')::uuid and device_id=(payload->>'device_id')::uuid
   and lease=(payload->>'lease')::uuid and lease_until>t and state='pending' for update;
  if not found then return '{"active":false}'::jsonb;end if;
 end if;
 select * into d from app_private.push_devices where id=j.device_id;
 if not found or not exists(select 1 from auth.sessions where id=d.session_id and user_id=d.account_id and (not_after is null or not_after>t))
  or not app_private.notification_sendable(j.notification_id,t) then
  delete from app_private.push_attempts where notification_id=j.notification_id and device_id=j.device_id;
  return '{"active":false}'::jsonb;
 end if;
 if operation in ('claim','recheck') then
  select * into n from app_private.notifications where id=j.notification_id;
  return jsonb_build_object('active',true,'id',n.id,'event_id',n.event_id,'kind',n.kind,'device_id',d.id,'lease',j.lease,
   'token',d.token,'environment',d.environment,'registered_at',d.registered_at,
   'expires_at',(select case when canceled_at is null then ends_at else canceled_at+interval '24 hours' end from app_private.events where id=n.event_id));
 elsif operation='invalid_token' then
  -- A late invalid-token response must not remove a newer registration.
  delete from app_private.push_devices where id=d.id and registered_at=(payload->>'registered_at')::timestamptz
   and (payload->>'invalidated_at' is null or registered_at<=(payload->>'invalidated_at')::timestamptz);
  if found then return '{"removed":true}'::jsonb;end if;
  update app_private.push_attempts set lease=null,lease_until=null,next_attempt_at=t+interval '30 seconds'
   where notification_id=j.notification_id and device_id=j.device_id;
 elsif operation in ('accepted','failed') then
  update app_private.push_attempts set state=operation,lease=null,lease_until=null
   where notification_id=j.notification_id and device_id=j.device_id;
 elsif operation='retry' then
  update app_private.push_attempts set lease=null,lease_until=null,
   next_attempt_at=t+make_interval(secs=>least(300,30*least(attempts,10)))
   where notification_id=j.notification_id and device_id=j.device_id;
 else raise exception 'invalid_input';end if;
 return '{"updated":true}'::jsonb;
end $$;
revoke all on function public.push_delivery(text,jsonb) from public,anon,authenticated;
grant execute on function public.push_delivery(text,jsonb) to service_role;
commit;
