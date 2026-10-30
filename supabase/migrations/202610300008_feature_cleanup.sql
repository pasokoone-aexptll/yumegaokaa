begin;
alter function app_private.cleanup() rename to cleanup_presence;
create function app_private.cleanup() returns void language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp();
begin
 perform app_private.cleanup_presence();
 delete from app_private.messages where created_at+interval '30 days'<=t;
 delete from app_private.commands where accept_until+interval '24 hours'<=t;
 delete from app_private.request_limits where at+interval '7 days'<=t;
 delete from app_private.chat_restrictions where until_at<=t;
 -- Cascades remove registration links, notifications and unsent outbox rows.
 delete from app_private.events where coalesce(canceled_at,ends_at)+interval '24 hours'<=t;
end $$;
revoke all on function app_private.cleanup() from public,anon,authenticated;
commit;
