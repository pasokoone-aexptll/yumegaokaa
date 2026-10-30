begin;
create table app_private.icon_enrollments (
 account_id uuid not null references app_private.members,
 street_id uuid not null references app_private.streets,
 completed_at timestamptz not null default clock_timestamp(),
 primary key(account_id,street_id)
);
revoke all on app_private.icon_enrollments from public,anon,authenticated;
insert into app_private.icon_enrollments(account_id,street_id)
select owner_id,street_id from app_private.street_icons where active group by owner_id,street_id;
alter function app_private.street_api(text,jsonb) rename to street_icon_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;uid uuid:=auth.uid();street uuid;
begin
 result:=app_private.street_icon_api(operation,payload);
 if operation not in ('street_icon_get','street_icon_prepare','street_icon_publish','street_icon_remove') then return result;end if;
 street:=(payload->>'street_id')::uuid;
 if operation='street_icon_publish' then
  insert into app_private.icon_enrollments(account_id,street_id) values(uid,street) on conflict do nothing;
 end if;
 return result||jsonb_build_object('contributed',exists(select 1 from app_private.icon_enrollments where account_id=uid and street_id=street));
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
create function app_private.withdraw_icon_enrollment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.withdrawn_at is not null and old.withdrawn_at is null then
  delete from app_private.icon_enrollments where account_id=new.account_id;
 end if;
 return new;
end $$;
revoke all on function app_private.withdraw_icon_enrollment() from public,anon,authenticated;
create trigger withdraw_icon_enrollment after update of withdrawn_at on app_private.members for each row execute function app_private.withdraw_icon_enrollment();
commit;
