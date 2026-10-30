begin;
alter table app_private.messages alter column author_id drop not null;
alter table app_private.arrival_logs alter column account_id drop not null;
alter table app_private.members add column withdrawn_at timestamptz;
create table app_private.withdrawal_requests(
 id uuid primary key default gen_random_uuid(),account_id uuid not null references app_private.members,
 issued_at timestamptz not null default clock_timestamp(),accept_until timestamptz not null default clock_timestamp()+interval '10 minutes',completed_at timestamptz
);
create table app_private.account_cleanup_jobs(
 id uuid primary key default gen_random_uuid(),account_id uuid not null unique,
 available_at timestamptz not null default clock_timestamp(),lease uuid,lease_until timestamptz,attempts integer not null default 0
);
revoke all on app_private.withdrawal_requests,app_private.account_cleanup_jobs from public,anon,authenticated;
create function public.avatar_readable(object_name text) returns boolean language sql stable security definer set search_path='' as $$
 select public.avatar_member() and (object_name=auth.uid()::text||'/avatar.jpg' or exists(
  select 1 from app_private.profiles p join app_private.members m on m.account_id=p.account_id
  where p.avatar_path=object_name and m.active
 ))
$$;
revoke all on function public.avatar_readable(text) from public,anon;grant execute on function public.avatar_readable(text) to authenticated;
alter policy avatar_read on storage.objects using(bucket_id='avatars' and public.avatar_readable(name));
alter function app_private.street_api(text,jsonb) rename to avatar_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;r app_private.withdrawal_requests%rowtype;t timestamptz;e record;
begin
 if operation not in ('withdraw_prepare','withdraw_confirm') then return app_private.avatar_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid for update;
 if not found then raise exception 'membership_required';end if;t:=clock_timestamp();
 if operation='withdraw_prepare' then
  if not exists(select 1 from app_private.members where account_id=uid and active and withdrawn_at is null) then raise exception 'membership_required';end if;
  insert into app_private.withdrawal_requests(account_id) values(uid) returning * into r;
  return jsonb_build_object('id',r.id,'accept_until',r.accept_until);
 end if;
 select * into r from app_private.withdrawal_requests where id=(payload->>'id')::uuid and account_id=uid for update;
 if not found then raise exception 'not_found';end if;
 if r.completed_at is not null then return '{"withdrawn":true}'::jsonb;end if;
 if r.accept_until<=t then raise exception 'attempt_expired';end if;
 if not exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a where a->>'method'='otp'
  and (a->>'timestamp')::numeric>=ceil(extract(epoch from r.issued_at))
  and (a->>'timestamp')::numeric<=extract(epoch from t)+2) then raise exception 'unauthorized';end if;
 -- Lock the union in ID order before the membership trigger cancels hosted events.
 perform 1 from app_private.events ev where ev.host_id=uid or exists(select 1 from app_private.registrations rr where rr.event_id=ev.id and rr.account_id=uid) order by ev.id for update;
 update app_private.members set active=false,withdrawn_at=t where account_id=uid;
 update app_private.operators set active=false where account_id=uid;
 delete from app_private.profiles where account_id=uid;
 update app_private.messages set author_id=null where author_id=uid;
 update app_private.arrival_logs set account_id=null where account_id=uid;
 delete from app_private.registrations where account_id=uid;
 delete from app_private.notifications where recipient=uid;
 update app_private.invitations set revoked_at=coalesce(revoked_at,t) where issuer=uid;
 delete from app_private.blocks where owner_id=uid or target_id=uid;
 update app_private.withdrawal_requests set completed_at=t where id=r.id;
 insert into app_private.account_cleanup_jobs(account_id) values(uid) on conflict(account_id) do nothing;
 return '{"withdrawn":true}'::jsonb;
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
-- Credentials remain in the local server worker, never in the app.
create function public.maintenance_jobs(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare job app_private.account_cleanup_jobs%rowtype;t timestamptz:=clock_timestamp();
begin
 if auth.role() is distinct from 'service_role' then raise exception 'unauthorized';end if;
 if operation='claim' then
  select * into job from app_private.account_cleanup_jobs where available_at<=t and (lease_until is null or lease_until<=t) order by available_at for update skip locked limit 1;
  if not found then return '{}'::jsonb;end if;
  update app_private.account_cleanup_jobs set lease=gen_random_uuid(),lease_until=t+interval '5 minutes',attempts=attempts+1 where id=job.id returning * into job;
  return jsonb_build_object('id',job.id,'account_id',job.account_id,'lease',job.lease);
 elsif operation='finish' then
  delete from app_private.account_cleanup_jobs where id=(payload->>'id')::uuid and lease=(payload->>'lease')::uuid;
  return '{"finished":true}'::jsonb;
 elsif operation='retry' then
  update app_private.account_cleanup_jobs set available_at=t+interval '5 minutes',lease=null,lease_until=null where id=(payload->>'id')::uuid and lease=(payload->>'lease')::uuid;
  return '{"scheduled":true}'::jsonb;
 elsif operation='cleanup' then
  perform app_private.cleanup();
  delete from app_private.withdrawal_requests where accept_until+interval '24 hours'<=t;
  delete from app_private.area_publications where accept_until+interval '24 hours'<=t;
  return '{"cleaned":true}'::jsonb;
 end if;
 raise exception 'invalid_input';
end $$;
revoke all on function public.maintenance_jobs(text,jsonb) from public,anon,authenticated;
grant execute on function public.maintenance_jobs(text,jsonb) to service_role;
create or replace function app_private.member_operations_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid;target uuid;result jsonb;lim integer;paused boolean;reason text;active boolean;
begin
 if operation not in ('operator_members','operator_member_state','operator_invite_policy') then return app_private.report_api(operation,payload);end if;
 if operation<>'operator_members' then
  target:=(payload->>'account_id')::uuid;
  -- Multiple account parents use stable order, including the operator parent.
  perform 1 from app_private.members where account_id in (auth.uid(),target) order by account_id for update;
 end if;
 uid:=app_private.require_operator();
 if operation='operator_members' then
  select coalesce(jsonb_agg(x order by x.account_id),'[]'::jsonb) into result from (
   select m.account_id,m.active,coalesce(p.display_name,'名前未設定') display_name,
    coalesce(ip.weekly_limit,5) weekly_limit,coalesce(ip.paused,false) invite_paused
   from app_private.members m left join app_private.profiles p on p.account_id=m.account_id
    left join app_private.invite_policies ip on ip.account_id=m.account_id
   where payload->>'after' is null or m.account_id>(payload->>'after')::uuid
   order by m.account_id limit 100
  )x;
  return jsonb_build_object('items',result);
 end if;
 reason:=btrim(payload->>'reason');
 if target is null or reason is null or char_length(reason) not between 1 and 500 then raise exception 'invalid_input';end if;
 perform 1 from app_private.members where account_id=target;
 if not found then raise exception 'not_found';end if;
 if operation='operator_member_state' then
  active:=(payload->>'active')::boolean;
  if active is null or target=uid or exists(select 1 from app_private.members where account_id=target and withdrawn_at is not null) then raise exception 'invalid_input';end if;
  update app_private.members m set active=(payload->>'active')::boolean where m.account_id=target and m.active is distinct from (payload->>'active')::boolean;
  if found then insert into app_private.operator_audit(actor,action,target,reason) values(uid,case when active then 'member_restore' else 'member_stop' end,target,reason);end if;
 else
  lim:=(payload->>'weekly_limit')::integer;paused:=(payload->>'paused')::boolean;
  if lim is null or lim not between 0 and 1000 or paused is null then raise exception 'invalid_input';end if;
  insert into app_private.invite_policies(account_id,weekly_limit,paused) values(target,lim,paused)
   on conflict(account_id) do update set weekly_limit=excluded.weekly_limit,paused=excluded.paused;
  insert into app_private.operator_audit(actor,action,target,reason) values(uid,'invite_policy',target,reason);
 end if;
 return '{"updated":true}'::jsonb;
end $$;
commit;
