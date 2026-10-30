begin;
create or replace function app_private.street_icon_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;street uuid;
 i app_private.street_icons%rowtype; own_path text; daily_path text;t timestamptz;
begin
 if operation not in ('street_icon_get','street_icon_prepare','street_icon_publish','street_icon_remove') then
  return app_private.account_access_api(operation,payload);
 end if;
 if not public.avatar_member() then raise exception 'membership_required';end if;
 -- Serialize contribution changes with withdrawal and each other.
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 street:=(payload->>'street_id')::uuid;
 if not exists(select 1 from app_private.streets where id=street) then raise exception 'not_found';end if;
 t:=clock_timestamp();
 if operation='street_icon_prepare' then
  -- Reuse unfinished uploads; preparing alone never takes down the published image.
  select * into i from app_private.street_icons where owner_id=uid and street_id=street and not active and removed_at is null and created_at>t-interval '24 hours' order by created_at desc limit 1;
  if not found then
   insert into app_private.street_icons(street_id,owner_id,path) values(street,uid,gen_random_uuid()::text||'.jpg') returning * into i;
  end if;
  return jsonb_build_object('id',i.id,'upload_path',i.path);
 elsif operation='street_icon_publish' then
  select * into i from app_private.street_icons where id=(payload->>'id')::uuid and owner_id=uid and street_id=street and removed_at is null for update;
  if not found or (not i.active and i.created_at<=clock_timestamp()-interval '24 hours') then raise exception 'not_found';end if;
  if not exists(select 1 from storage.objects where bucket_id='street-icons' and name=i.path and (metadata->>'size')::bigint<=2097152 and metadata->>'mimetype'='image/jpeg') then raise exception 'invalid_input';end if;
  update app_private.street_icons set active=false,removed_at=t where owner_id=uid and street_id=street and active and id<>i.id;
  update app_private.street_icons set active=true where id=i.id;
 elsif operation='street_icon_remove' then
  -- Target-specific deletion: a delayed retry cannot remove a replacement.
  update app_private.street_icons set active=false,removed_at=coalesce(removed_at,t)
   where id=(payload->>'id')::uuid and owner_id=uid and street_id=street;
 end if;
 select * into i from app_private.street_icons where owner_id=uid and street_id=street and active and removed_at is null;
 daily_path:=app_private.my_daily_icon(uid,street,t);
 return jsonb_build_object('contribution_id',i.id,'contribution_path',i.path,'daily_path',daily_path,
  'day',(t at time zone 'Asia/Tokyo')::date,'next_shuffle_at',(((t at time zone 'Asia/Tokyo')::date+1)::timestamp at time zone 'Asia/Tokyo'));
end $$;
create or replace function public.street_icon_access(object_name text, writing boolean default false)
returns boolean language plpgsql volatile security definer set search_path='' as $$
declare item app_private.street_icons%rowtype;
begin
 if not public.avatar_member() then return false;end if;
 if writing then
  -- Keep write authorization and metadata insertion in one transaction with
  -- removal/publication. A request waiting behind removal must recheck it.
  select * into item from app_private.street_icons
   where path=object_name and owner_id=auth.uid() for update;
  if not found then return false;end if;
  return item.removed_at is null and not item.active and item.created_at>clock_timestamp()-interval '24 hours'
    and exists(select 1 from app_private.members where account_id=item.owner_id and active);
 end if;
 return exists(select 1 from app_private.street_icons i join app_private.members m on m.account_id=i.owner_id
  where i.path=object_name and i.removed_at is null and m.active and (i.active or (i.owner_id=auth.uid() and i.created_at>clock_timestamp()-interval '24 hours')));
end $$;
revoke all on function public.street_icon_access(text,boolean) from public,anon;
grant execute on function public.street_icon_access(text,boolean) to authenticated;
create or replace function public.icon_cleanup(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item app_private.street_icons%rowtype;t timestamptz:=clock_timestamp();
begin
 if auth.role()<>'service_role' then raise exception 'forbidden';end if;
 if operation='claim' then
  select * into item from app_private.street_icons where not active and (removed_at is not null or created_at<=t-interval '24 hours')
   and (cleanup_until is null or cleanup_until<=t) order by removed_at for update skip locked limit 1;
  if not found then return '{}'::jsonb;end if;
  update app_private.street_icons set removed_at=coalesce(removed_at,t),cleanup_lease=gen_random_uuid(),cleanup_until=t+interval '5 minutes'
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
