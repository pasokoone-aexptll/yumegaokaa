begin;
create function app_private.membership_stopped() returns trigger language plpgsql security definer set search_path='' as $$
declare v record;
begin
 if old.active and not new.active then
  for v in select id from app_private.visits where account_id=new.account_id and ended_at is null order by id for update loop
   perform app_private.end_visit(v.id,'banned',clock_timestamp());
  end loop;
 end if;
 return null;
end $$;
revoke all on function app_private.membership_stopped() from public,anon,authenticated;
create trigger membership_stopped after update of active on app_private.members for each row execute function app_private.membership_stopped();
commit;
