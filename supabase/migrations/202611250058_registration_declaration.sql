begin;
-- Intentionally empty until the published documents and their version are approved.
create table app_private.registration_policy (
 singleton boolean primary key default true check(singleton),
 version text not null check(length(version) between 1 and 100),
 terms_url text not null check(terms_url like 'https://%'),
 privacy_url text not null check(privacy_url like 'https://%')
);
create table app_private.registration_declarations (
 account_id uuid primary key references auth.users(id) on delete cascade,
 age_band text not null check(age_band in ('13_17','18_plus')),
 guardian_declared boolean not null,
 policy_version text not null,
 declared_at timestamptz not null default clock_timestamp(),
 method text not null default 'self_declaration' check(method='self_declaration'),
 check(guardian_declared=(age_band='13_17'))
);
alter table app_private.registration_policy enable row level security;
alter table app_private.registration_declarations enable row level security;
revoke all on app_private.registration_policy,app_private.registration_declarations from public,anon,authenticated;

alter function app_private.invitation_api(text,jsonb) rename to invitation_api_before_age;
create function app_private.invitation_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid;
 p app_private.registration_policy%rowtype; result jsonb; band text;
begin
 if operation not in ('registration_policy','invite_accept') then return app_private.invitation_api_before_age(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 if operation='registration_policy' then
  select * into p from app_private.registration_policy where singleton;
  if not found then return '{"available":false}'::jsonb;end if;
  return jsonb_build_object('available',true,'version',p.version,'terms_url',p.terms_url,'privacy_url',p.privacy_url);
 end if;
 -- Same parent lock as invitation acceptance. Retries preserve the original declaration.
 perform 1 from auth.users where id=uid for update;
 if exists(select 1 from app_private.members where account_id=uid) then
  return app_private.invitation_api_before_age(operation,payload);
 end if;
 select * into p from app_private.registration_policy where singleton for share;
 if not found then raise exception 'conflict';end if;
 band:=payload->>'age_band';
 if band is null or band not in ('13_17','18_plus') then raise exception 'invalid_input';end if;
 if payload->>'policy_version' is distinct from p.version then raise exception 'conflict';end if;
 if band='13_17' and payload->'guardian_declared' is distinct from 'true'::jsonb then raise exception 'invalid_input';end if;
 if band='18_plus' and payload->'guardian_declared' is distinct from 'false'::jsonb then raise exception 'invalid_input';end if;
 result:=app_private.invitation_api_before_age(operation,payload);
 insert into app_private.registration_declarations(account_id,age_band,guardian_declared,policy_version)
 values(uid,band,band='13_17',p.version);
 return result;
end $$;
revoke all on function app_private.invitation_api(text,jsonb),app_private.invitation_api_before_age(text,jsonb) from public,anon,authenticated;

-- Minimal retention: remove this self-declaration when membership is withdrawn.
create function app_private.clear_registration_declaration() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.withdrawn_at is not null then delete from app_private.registration_declarations where account_id=new.account_id;end if;
 return new;
end $$;
create trigger clear_registration_declaration after update of withdrawn_at on app_private.members
for each row execute function app_private.clear_registration_declaration();
revoke all on function app_private.clear_registration_declaration() from public,anon,authenticated;
commit;
