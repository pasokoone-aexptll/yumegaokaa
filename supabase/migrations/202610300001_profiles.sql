begin;
create table app_private.profiles (
 account_id uuid primary key references app_private.members(account_id),
 display_name text not null check(char_length(btrim(display_name)) between 1 and 50),
 updated_at timestamptz not null default now()
);
revoke all on app_private.profiles from public,anon,authenticated;
-- Extend the same private dispatcher so native authentication and the public
-- error boundary remain shared with the existing presence workflow.
alter function app_private.street_api(text,jsonb) rename to presence_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid; result jsonb; name text;
begin
 if operation not in ('profile_get','profile_save') then
  return app_private.presence_api(operation,payload);
 end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 if operation='profile_save' then
  name:=btrim(payload->>'display_name');
  if name is null or char_length(name) not between 1 and 50 then raise exception 'invalid_input';end if;
  insert into app_private.profiles(account_id,display_name) values(uid,name)
  on conflict(account_id) do update set display_name=excluded.display_name,updated_at=clock_timestamp();
 end if;
 select jsonb_build_object('display_name',display_name) into result from app_private.profiles where account_id=uid;
 return coalesce(result,'{"display_name":""}'::jsonb);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
