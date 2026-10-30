begin;
create table app_private.invite_policies(
 account_id uuid primary key references app_private.members,
 weekly_limit integer not null default 5 check(weekly_limit between 0 and 1000),
 paused boolean not null default false
);
revoke all on app_private.invite_policies from public,anon,authenticated;
alter table app_private.operator_audit add column reason text;
-- Stopping membership already ends visits. Add host events without reviving on undo.
create function app_private.host_membership_stopped() returns trigger language plpgsql security definer set search_path='' as $$
declare e record;t timestamptz:=clock_timestamp();
begin
 if old.active and not new.active then
  for e in select id,revision from app_private.events where host_id=new.account_id and canceled_at is null and ends_at>t order by id for update loop
   update app_private.events set canceled_at=t,revision=revision+1 where id=e.id;
   delete from app_private.notifications where event_id=e.id;
   insert into app_private.notifications(event_id,event_revision,recipient,kind)
   select e.id,e.revision+1,r.account_id,'canceled' from app_private.registrations r where r.event_id=e.id and r.joined;
   insert into app_private.notification_outbox(notification_id)
   select id from app_private.notifications where event_id=e.id and event_revision=e.revision+1;
  end loop;
 end if;
 return null;
end $$;
create trigger host_membership_stopped after update of active on app_private.members for each row execute function app_private.host_membership_stopped();
revoke all on function app_private.host_membership_stopped() from public,anon,authenticated;
alter function app_private.street_api(text,jsonb) rename to report_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
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
  if active is null or target=uid then raise exception 'invalid_input';end if;
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
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
create or replace function app_private.invitation_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid; inv app_private.invitations%rowtype; code text; result jsonb; t timestamptz:=clock_timestamp();
begin
 if operation not in ('invite_create','invite_list','invite_accept','invite_revoke') then return app_private.profile_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 if operation='invite_accept' then
  -- Account parent serializes initial enrollment even before a membership exists.
  perform 1 from auth.users where id=uid for update;
  if exists(select 1 from app_private.members where account_id=uid) then
   if exists(select 1 from app_private.members where account_id=uid and active) then return '{"accepted":true}'::jsonb;end if;
   raise exception 'membership_required';
  end if;
  code:=btrim(payload->>'code');
  if code is null or length(code)>128 then raise exception 'invalid_input';end if;
  select * into inv from app_private.invitations where code_hash=sha256(convert_to(code,'UTF8'));
  if not found then raise exception 'invalid_input';end if;
  -- Lock issuer before invitation, matching revoke/create and membership stop.
  perform 1 from app_private.members where account_id=inv.issuer and active for share;
  if not found then raise exception 'membership_required';end if;
  select * into inv from app_private.invitations where id=inv.id for update;
  if not found or inv.used_at is not null or inv.revoked_at is not null or inv.expires_at<=t then raise exception 'invalid_input';end if;
  if not exists(select 1 from app_private.members where account_id=inv.issuer and active) then raise exception 'membership_required';end if;
  insert into app_private.members(account_id) values(uid);
  update app_private.invitations set used_by=uid,used_at=t where id=inv.id;
  return '{"accepted":true}'::jsonb;
 end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 if operation='invite_create' then
  if exists(select 1 from app_private.invite_policies where account_id=uid and paused) then raise exception 'membership_required';end if;
  if (select count(*) from app_private.invitations where issuer=uid and created_at>t-interval '7 days')>=coalesce((select weekly_limit from app_private.invite_policies where account_id=uid),5) then raise exception 'rate_limited';end if;
  code:=gen_random_uuid()::text;
  insert into app_private.invitations(issuer,code_hash) values(uid,sha256(convert_to(code,'UTF8'))) returning * into inv;
  return jsonb_build_object('id',inv.id,'code',code,'expires_at',inv.expires_at);
 elsif operation='invite_revoke' then
  update app_private.invitations set revoked_at=coalesce(revoked_at,t) where id=(payload->>'id')::uuid and issuer=uid;
  if not found then raise exception 'not_found';end if;
  return '{"revoked":true}'::jsonb;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'created_at',created_at,'expires_at',expires_at,'used',used_at is not null,'revoked',revoked_at is not null) order by created_at desc),'[]'::jsonb) into result
 from app_private.invitations where issuer=uid;
 return jsonb_build_object('items',result);
end $$;
commit;
