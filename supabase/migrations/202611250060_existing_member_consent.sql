begin;
alter table app_private.registration_declarations add column terms_accepted boolean not null default false;
insert into app_private.registration_policy(singleton,version,terms_url,privacy_url)
values(true,'2026-11-25-v1','https://hello.dreamcloud.sh/terms/','https://hello.dreamcloud.sh/privacy/')
on conflict(singleton) do update set version=excluded.version,terms_url=excluded.terms_url,privacy_url=excluded.privacy_url;
create function app_private.has_current_consent(uid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from app_private.registration_declarations d join app_private.registration_policy p on p.singleton and p.version=d.policy_version where d.account_id=uid and d.terms_accepted)
$$;
revoke all on function app_private.has_current_consent(uuid) from public,anon,authenticated;
alter function app_private.street_api(text,jsonb) rename to street_api_before_consent;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid;
 p app_private.registration_policy%rowtype; m app_private.members%rowtype; result jsonb; band text;
begin
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid and (not_after is null or not_after>clock_timestamp())) then raise exception 'unauthorized';end if;
 if operation in ('consent_accept','invite_accept') then
  perform 1 from auth.users where id=uid for update;
  select * into m from app_private.members where account_id=uid for update;
  if operation='consent_accept' and (not found or not m.active or m.withdrawn_at is not null) then raise exception 'membership_required';end if;
  select * into p from app_private.registration_policy where singleton for share;
  if not found or payload->>'policy_version' is distinct from p.version then raise exception 'conflict';end if;
  band:=payload->>'age_band';
  if band is null or band not in ('13_17','18_plus') or payload->'terms_accepted' is distinct from 'true'::jsonb then raise exception 'invalid_input';end if;
  if payload->'guardian_declared' is distinct from to_jsonb(band='13_17') then raise exception 'invalid_input';end if;
  if operation='invite_accept' then result:=app_private.street_api_before_consent(operation,payload);else result:='{"accepted":true}'::jsonb;end if;
  insert into app_private.registration_declarations(account_id,age_band,guardian_declared,policy_version,terms_accepted)
  values(uid,band,band='13_17',p.version,true)
  on conflict(account_id) do update set age_band=excluded.age_band,guardian_declared=excluded.guardian_declared,
    policy_version=excluded.policy_version,terms_accepted=true,declared_at=clock_timestamp()
  where not app_private.registration_declarations.terms_accepted or app_private.registration_declarations.policy_version<>excluded.policy_version;
  return result;
 elsif operation='account_access' then
  result:=app_private.street_api_before_consent(operation,payload);
  if result->>'status'='active' and not app_private.has_current_consent(uid) then return result||'{"status":"consent_required"}'::jsonb;end if;
  return result;
 elsif operation in ('registration_policy','withdraw_prepare','withdraw_confirm','end_visit','time') then
  return app_private.street_api_before_consent(operation,payload);
 end if;
 if not app_private.has_current_consent(uid) then raise exception 'membership_required';end if;
 return app_private.street_api_before_consent(operation,payload);
end $$;
revoke all on function app_private.street_api(text,jsonb),app_private.street_api_before_consent(text,jsonb) from public,anon,authenticated;
create or replace function public.avatar_member() returns boolean language sql stable security definer set search_path='' as $$
 select app_private.has_current_consent(auth.uid()) and exists(select 1 from app_private.members m join auth.sessions s on s.user_id=m.account_id
 where m.account_id=auth.uid() and m.active and s.id=(auth.jwt()->>'session_id')::uuid and (s.not_after is null or s.not_after>now()))
$$;
commit;
