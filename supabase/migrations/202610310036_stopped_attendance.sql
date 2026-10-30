begin;
create or replace function app_private.host_membership_stopped() returns trigger language plpgsql security definer set search_path='' as $$
declare e record;t timestamptz:=clock_timestamp();
begin
 if old.active and not new.active then
  -- Same parent lock order as registration/edit/withdrawal. The member row
  -- is already locked, so a concurrent join by this account cannot pass.
  perform 1 from app_private.events ev
   where ev.host_id=new.account_id or exists (
    select 1 from app_private.registrations rr
    where rr.event_id=ev.id and rr.account_id=new.account_id and rr.joined)
   order by ev.id for update;
  for e in select id,revision from app_private.events where host_id=new.account_id and canceled_at is null and ends_at>t order by id for update loop
   update app_private.events set canceled_at=t,revision=revision+1 where id=e.id;
   delete from app_private.notifications where event_id=e.id;
   insert into app_private.notifications(event_id,event_revision,recipient,kind)
   select e.id,e.revision+1,r.account_id,'canceled' from app_private.registrations r where r.event_id=e.id and r.joined;
   insert into app_private.notification_outbox(notification_id)
   select id from app_private.notifications where event_id=e.id and event_revision=e.revision+1;
  end loop;
  -- Keep a revision tombstone: old join requests must not resurrect attendance.
  update app_private.registrations set joined=false,revision=revision+1
   where account_id=new.account_id and joined;
  -- Match voluntary cancellation, including cascaded outbox deletion.
  delete from app_private.notifications where recipient=new.account_id;
 end if;
 return null;
end $$;
commit;
