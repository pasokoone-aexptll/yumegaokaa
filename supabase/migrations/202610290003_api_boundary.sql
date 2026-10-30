begin;
-- Keep internal exceptions out of the public HTTP response. All data mutation
-- remains in the same transaction as the authenticated dispatcher.
alter function public.street_api(text,jsonb) set schema app_private;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
create function public.street_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare code text; status text;
begin
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>4096 then
  raise exception 'invalid_input' using errcode='PT422';
 end if;
 return app_private.street_api(operation,payload);
exception when others then
 code:=sqlerrm;
 if code in ('unauthorized','login_required') then status:='PT401';
 elsif code='membership_required' then status:='PT403';
 elsif code='not_found' then status:='PT404';
 elsif code='rate_limited' then status:='PT429';
 elsif code in ('inactive_tag','area_unpublished','attempt_expired','conflict','tag_changed','wrong_writer','inactive_visit','area_changed','stale_observation') then status:='PT409';
 elsif code in ('invalid_reason','invalid_seq','invalid_accuracy','invalid_cell','invalid_verdict','unknown_operation','invalid_input') or sqlstate in ('22P02','22007','22008','22003') then code:='invalid_input';status:='PT422';
 else code:='request_failed';status:='PT503'; end if;
 raise exception using message=code,errcode=status;
end $$;
revoke all on function public.street_api(text,jsonb) from public,anon;
grant execute on function public.street_api(text,jsonb) to authenticated;
-- Private broadcast carries no identifiers, observations, counts or locations.
create function app_private.changed() returns trigger language plpgsql security definer set search_path='' as $$
declare street uuid;
begin
 if tg_table_name='presence' then
  select street_id into street from app_private.visits where id=coalesce(new.visit_id,old.visit_id);
 else street:=coalesce(new.street_id,old.street_id); end if;
 if street is not null then perform realtime.send('{}'::jsonb,'changed','street:'||street::text,true);end if;
 return null;
end $$;
revoke all on function app_private.changed() from public,anon,authenticated;
create trigger presence_changed after insert or update or delete on app_private.presence for each row execute function app_private.changed();
create trigger visit_changed after insert or update or delete on app_private.visits for each row execute function app_private.changed();
create function public.can_receive_street() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from app_private.members m join auth.sessions s on s.user_id=m.account_id
 where m.account_id=auth.uid() and m.active and s.id=(auth.jwt()->>'session_id')::uuid)
 and exists(select 1 from app_private.streets where 'street:'||id::text=realtime.topic())
$$;
revoke all on function public.can_receive_street() from public,anon;
grant execute on function public.can_receive_street() to authenticated;
create policy street_broadcast_read on realtime.messages for select to authenticated using(public.can_receive_street());
commit;
