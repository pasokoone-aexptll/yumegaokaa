begin;

create index arrival_log_member_street_time
  on app_private.arrival_logs (account_id, street_id, created_at desc);

-- Check-in serializes writers on the member row before creating a visit.
-- Suppressing this insert never suppresses the visit or changes its start time.
create function app_private.limit_arrival_interval() returns trigger
language plpgsql set search_path='' as $$
begin
  if exists (
    select 1 from app_private.arrival_logs
    where account_id = new.account_id and street_id = new.street_id
      and created_at > new.created_at - interval '10 minutes'
  ) then return null; end if;
  return new;
end $$;
revoke all on function app_private.limit_arrival_interval() from public,anon,authenticated;
create trigger limit_arrival_interval before insert on app_private.arrival_logs
  for each row execute function app_private.limit_arrival_interval();
commit;
