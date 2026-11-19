begin;
-- Revoked, never-redeemed invitations release their reservation. Redeemed
-- invitations still consume the rolling-week allowance, even after revocation.
-- Keep recipient suspension, issuer locks, QR rotation and command receipts unchanged.
-- The issuer may revoke only their own invitation, including its redeemed membership.
create or replace function app_private.invitation_api_before_quota(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare initial_recipient uuid; uid uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid; inv app_private.invitations%rowtype; code text; result jsonb; t timestamptz:=clock_timestamp();
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
 if operation='invite_revoke' then
  select * into inv from app_private.invitations where id=(payload->>'id')::uuid and issuer=uid;
  if not found then raise exception 'not_found';end if;
  initial_recipient:=inv.used_by;
  perform 1 from app_private.members where account_id in (uid,inv.used_by) order by account_id for update;
  if not exists(select 1 from app_private.members where account_id=uid and active) then raise exception 'membership_required';end if;
  select * into inv from app_private.invitations where id=inv.id and issuer=uid for update;
  if inv.used_by is distinct from initial_recipient then raise exception 'invitation_changed_retry' using errcode='40001';end if;
  if inv.revoked_at is not null then return '{"revoked":true}'::jsonb;end if;
  -- A concurrent accept locks the issuer first, so the reread includes its recipient.
  if inv.used_by is not null then
   if inv.used_by=uid then raise exception 'invalid_input';end if;
   update app_private.members set active=false where account_id=inv.used_by and active;
  end if;
  update app_private.invitations set revoked_at=t where id=inv.id;
  return jsonb_build_object('revoked',true,'recipient_suspended',inv.used_by is not null);
 end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 if operation='invite_create' then
  if exists(select 1 from app_private.invite_policies where account_id=uid and paused) then raise exception 'membership_required';end if;
  if (select count(*) from app_private.invitations where issuer=uid and created_at>t-interval '7 days' and (used_at is not null or revoked_at is null))>=coalesce((select weekly_limit from app_private.invite_policies where account_id=uid),5) then raise exception 'rate_limited';end if;
  code:=gen_random_uuid()::text;
  insert into app_private.invitations(issuer,code_hash) values(uid,sha256(convert_to(code,'UTF8'))) returning * into inv;
  return jsonb_build_object('id',inv.id,'code',code,'expires_at',inv.expires_at);
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'created_at',created_at,'expires_at',expires_at,'used',used_at is not null,'revoked',revoked_at is not null,'recipient_name',(select display_name from app_private.profiles where account_id=used_by)) order by created_at desc),'[]'::jsonb) into result
 from app_private.invitations where issuer=uid;
 return jsonb_build_object('items',result);
end $$;

create or replace function app_private.invitation_api_before_current(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; uid uuid:=auth.uid(); quota integer; paused boolean; used bigint;
begin
 result:=app_private.invitation_api_before_quota(operation,payload);
 if operation<>'invite_list' then return result;end if;
 select weekly_limit,ip.paused into quota,paused from app_private.invite_policies ip where account_id=uid;
 quota:=coalesce(quota,5);
 select count(*) into used from app_private.invitations where issuer=uid and created_at>clock_timestamp()-interval '7 days' and (used_at is not null or revoked_at is null);
 return result||jsonb_build_object('remaining',case when coalesce(paused,false) then 0 else greatest(0,quota-used) end,'weekly_limit',quota,
  'issuer_name',(select display_name from app_private.profiles where account_id=uid));
end $$;
revoke all on function app_private.invitation_api_before_current(text,jsonb) from public,anon,authenticated;
commit;
