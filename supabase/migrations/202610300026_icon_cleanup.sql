begin;
alter table app_private.street_icons add column cleanup_lease uuid,add column cleanup_until timestamptz;
create function public.icon_cleanup(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item app_private.street_icons%rowtype;t timestamptz:=clock_timestamp();
begin
 if auth.role()<>'service_role' then raise exception 'forbidden';end if;
 if operation='claim' then
  select * into item from app_private.street_icons where removed_at is not null and not active
   and (cleanup_until is null or cleanup_until<=t) order by removed_at for update skip locked limit 1;
  if not found then return '{}'::jsonb;end if;
  update app_private.street_icons set cleanup_lease=gen_random_uuid(),cleanup_until=t+interval '5 minutes'
   where id=item.id returning * into item;
  return jsonb_build_object('id',item.id,'path',item.path,'lease',item.cleanup_lease);
 elsif operation='finish' then
  select * into item from app_private.street_icons where id=(payload->>'id')::uuid and cleanup_lease=(payload->>'lease')::uuid
   and removed_at is not null and not active for update;
  if not found then return '{"finished":false}'::jsonb;end if;
  if exists(select 1 from storage.objects where bucket_id='street-icons' and name=item.path) then raise exception 'storage_not_deleted';end if;
  delete from app_private.daily_street_icons where icon_id=item.id;
  delete from app_private.street_icons where id=item.id;
  return '{"finished":true}'::jsonb;
 elsif operation='retry' then
  update app_private.street_icons set cleanup_lease=null,cleanup_until=t+interval '5 minutes'
  where id=(payload->>'id')::uuid and cleanup_lease=(payload->>'lease')::uuid;
  return '{"retry":true}'::jsonb;
 end if;
 raise exception 'invalid_input';
end $$;
revoke all on function public.icon_cleanup(text,jsonb) from public,anon,authenticated;
grant execute on function public.icon_cleanup(text,jsonb) to service_role;
commit;
