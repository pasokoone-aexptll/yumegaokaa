begin;
create table app_private.invitations(
 id uuid primary key default gen_random_uuid(), issuer uuid not null references app_private.members,
 code_hash bytea not null unique, created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default clock_timestamp()+interval '7 days',
 used_by uuid, used_at timestamptz, revoked_at timestamptz
);
revoke all on app_private.invitations from public,anon,authenticated;
alter function app_private.street_api(text,jsonb) rename to profile_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
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
  if (select count(*) from app_private.invitations where issuer=uid and created_at>t-interval '7 days')>=5 then raise exception 'rate_limited';end if;
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
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
