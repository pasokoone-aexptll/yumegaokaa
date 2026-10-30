begin;
-- Wake-up only; no account, message, location, token or participant data.
create function app_private.gateway_changed() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform pg_notify('yumegaoka_gateway_changed','');
 return null;
end $$;
revoke all on function app_private.gateway_changed() from public,anon,authenticated;
do $$
declare table_name text;
begin
 foreach table_name in array array['visits','presence','messages','arrival_logs','events','recruitments','registrations','notifications','blocks','members','street_icons','streets','tags','areas'] loop
  execute format('create trigger gateway_changed after insert or update or delete on app_private.%I for each statement execute function app_private.gateway_changed()',table_name);
 end loop;
end $$;
create trigger gateway_session_changed after update or delete on auth.sessions
 for each statement execute function app_private.gateway_changed();
-- Direct Realtime policy remains until the mobile transport is switched in the
-- following deployment step. This migration alone does not enforce the gateway.
commit;
