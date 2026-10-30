begin;
create table app_private.operators (
 account_id uuid primary key references app_private.members, active boolean not null default true
);
create table app_private.operator_audit (
 id uuid primary key default gen_random_uuid(),actor uuid not null,
 action text not null,target uuid,created_at timestamptz not null default clock_timestamp()
);
revoke all on app_private.operators,app_private.operator_audit from public,anon,authenticated;
-- Neither a client flag nor MFA alone grants an operator role.
create function app_private.require_operator() returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;
begin
 if uid is null or sid is null then raise exception 'unauthorized';end if;
 perform 1 from app_private.members m join app_private.operators o on o.account_id=m.account_id
 where m.account_id=uid and m.active and o.active for share of m,o;
 if not found then raise exception 'membership_required';end if;
 if coalesce(auth.jwt()->>'aal','')<>'aal2' or not exists(
  select 1 from auth.sessions s join auth.mfa_factors f on f.id=s.factor_id and f.user_id=s.user_id
  where s.id=sid and s.user_id=uid and s.aal='aal2' and f.status='verified' and f.factor_type='totp'
  and (s.not_after is null or s.not_after>clock_timestamp())
 ) then raise exception 'unauthorized';end if;
 return uid;
end $$;
revoke all on function app_private.require_operator() from public,anon,authenticated;
alter function app_private.street_api(text,jsonb) rename to recruitment_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid; sid uuid:=(auth.jwt()->>'session_id')::uuid; result jsonb;target uuid;issuer_id uuid;
begin
 if operation='operator_status' then
  uid:=auth.uid();
  if uid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
  return jsonb_build_object('operator',exists(select 1 from app_private.operators o join app_private.members m using(account_id) where o.account_id=uid and o.active and m.active));
 end if;
 if operation not in ('operator_dashboard','operator_invites','operator_invite_revoke') then return app_private.recruitment_api(operation,payload);end if;
 uid:=app_private.require_operator();
 if operation='operator_dashboard' then
  return jsonb_build_object('active_members',(select count(*) from app_private.members where active),
   'active_invitations',(select count(*) from app_private.invitations where revoked_at is null and used_at is null and expires_at>clock_timestamp()));
 elsif operation='operator_invites' then
  select coalesce(jsonb_agg(x order by x.created_at desc),'[]'::jsonb) into result from (
   select i.id,i.issuer,p.display_name as issuer_name,i.used_by,q.display_name as recipient_name,
    i.created_at,i.expires_at,i.used_at,i.revoked_at
   from app_private.invitations i left join app_private.profiles p on p.account_id=i.issuer
    left join app_private.profiles q on q.account_id=i.used_by
   where (payload->>'before') is null or i.created_at<(payload->>'before')::timestamptz
   order by i.created_at desc limit 100
  ) x;
  return jsonb_build_object('items',result);
 end if;
 target:=(payload->>'id')::uuid;
 select issuer into issuer_id from app_private.invitations where id=target;
 if not found then raise exception 'not_found';end if;
 -- Same issuer -> invitation order as invite acceptance.
 perform 1 from app_private.members where account_id=issuer_id for share;
 update app_private.invitations set revoked_at=clock_timestamp() where id=target and revoked_at is null;
 if found then insert into app_private.operator_audit(actor,action,target) values(uid,'invite_revoke',target);end if;
 return '{"revoked":true}'::jsonb;
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
alter function app_private.cleanup() rename to cleanup_features;
create function app_private.cleanup() returns void language plpgsql security definer set search_path='' as $$
begin
 perform app_private.cleanup_features();
 delete from app_private.operator_audit where created_at+interval '90 days'<=clock_timestamp();
end $$;
revoke all on function app_private.cleanup() from public,anon,authenticated;
commit;
