begin;
-- A recruitment expires independently of its parent visit.
create or replace function app_private.cleanup() returns void language plpgsql security definer set search_path='' as $$
declare owner_id uuid; v app_private.visits%rowtype; t timestamptz;
begin
 for owner_id in select account_id from app_private.members order by account_id loop
  perform 1 from app_private.members where account_id=owner_id for update;
  t:=clock_timestamp();
  for v in select * from app_private.visits where account_id=owner_id and ended_at is null and expires_at<=t for update loop
   perform app_private.end_visit(v.id,'expired',v.expires_at);
  end loop;
  delete from app_private.presence p using app_private.visits vv where p.visit_id=vv.id and vv.account_id=owner_id and p.expires_at<=t;
  delete from app_private.attempts where account_id=owner_id and accept_until+interval '24 hours'<=t;
  delete from app_private.recruitments r using app_private.visits vv where r.visit_id=vv.id and vv.account_id=owner_id and least(r.expires_at,r.ended_at,vv.expires_at,vv.ended_at)+interval '24 hours'<=t;
  delete from app_private.visits where account_id=owner_id and ended_at+interval '24 hours'<=t;
 end loop;
 delete from app_private.arrival_logs where created_at+interval '30 days'<=clock_timestamp();
end $$;
commit;
