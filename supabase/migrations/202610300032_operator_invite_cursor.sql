begin;
create or replace function app_private.operator_api(operation text,payload jsonb default '{}'::jsonb)
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
  select coalesce(jsonb_agg(x order by x.created_at desc,x.id desc),'[]'::jsonb) into result from (
   select i.id,i.issuer,p.display_name as issuer_name,i.used_by,q.display_name as recipient_name,
    i.created_at,i.expires_at,i.used_at,i.revoked_at
   from app_private.invitations i left join app_private.profiles p on p.account_id=i.issuer
    left join app_private.profiles q on q.account_id=i.used_by
   where (payload->>'before') is null or i.created_at<(payload->>'before')::timestamptz
    or (i.created_at=(payload->>'before')::timestamptz and i.id<(payload->>'before_id')::uuid)
   order by i.created_at desc,i.id desc limit 100
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
commit;
