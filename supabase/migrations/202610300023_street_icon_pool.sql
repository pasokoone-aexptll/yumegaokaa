begin;
create table app_private.street_icons (
 id uuid primary key default gen_random_uuid(),
 street_id uuid not null references app_private.streets,
 owner_id uuid not null references app_private.members,
 path text not null unique,
 active boolean not null default false,
 created_at timestamptz not null default clock_timestamp(),
 removed_at timestamptz
);
create unique index street_icon_contribution on app_private.street_icons(owner_id,street_id) where active;
create table app_private.daily_street_icons (
 account_id uuid not null references app_private.members,
 street_id uuid not null references app_private.streets,
 day date not null,
 icon_id uuid references app_private.street_icons,
 primary key(account_id,street_id)
);
revoke all on app_private.street_icons,app_private.daily_street_icons from public,anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('street-icons','street-icons',false,2097152,array['image/jpeg']);
create function public.street_icon_access(object_name text, writing boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select public.avatar_member() and exists(
 select 1 from app_private.street_icons i join app_private.members m on m.account_id=i.owner_id
 where i.path=object_name and i.removed_at is null and m.active
 and case when writing then i.owner_id=auth.uid() and not i.active else i.active or i.owner_id=auth.uid() end)
$$;
revoke all on function public.street_icon_access(text,boolean) from public,anon;
grant execute on function public.street_icon_access(text,boolean) to authenticated;
create policy street_icon_read on storage.objects for select to authenticated using(bucket_id='street-icons' and public.street_icon_access(name,false));
create policy street_icon_insert on storage.objects for insert to authenticated with check(bucket_id='street-icons' and public.street_icon_access(name,true));
create policy street_icon_update on storage.objects for update to authenticated using(bucket_id='street-icons' and public.street_icon_access(name,true)) with check(bucket_id='street-icons' and public.street_icon_access(name,true));

create function app_private.my_daily_icon(uid uuid,street uuid,t timestamptz)
returns text language plpgsql security definer set search_path='' as $$
declare chosen uuid; result text; today date:=(t at time zone 'Asia/Tokyo')::date;
begin
 -- No historical daily rows; retain only the current assignment.
 select a.icon_id into chosen from app_private.daily_street_icons a
 join app_private.street_icons i on i.id=a.icon_id
 join app_private.members m on m.account_id=i.owner_id
 where a.account_id=uid and a.street_id=street and a.day=today and i.active and i.removed_at is null and m.active;
 if chosen is null then
  select i.id into chosen from app_private.street_icons i join app_private.members m on m.account_id=i.owner_id
   where i.street_id=street and i.active and i.removed_at is null and m.active order by random() limit 1;
  insert into app_private.daily_street_icons(account_id,street_id,day,icon_id) values(uid,street,today,chosen)
  on conflict(account_id,street_id) do update set day=excluded.day,icon_id=excluded.icon_id
  where app_private.daily_street_icons.day<>excluded.day or not exists(
    select 1 from app_private.street_icons i join app_private.members m on m.account_id=i.owner_id
    where i.id=app_private.daily_street_icons.icon_id and i.active and i.removed_at is null and m.active);
 end if;
 select i.path into result from app_private.daily_street_icons a join app_private.street_icons i on i.id=a.icon_id
 join app_private.members m on m.account_id=i.owner_id
 where a.account_id=uid and a.street_id=street and a.day=today and i.active and i.removed_at is null and m.active;
 return result;
end $$;
revoke all on function app_private.my_daily_icon(uuid,uuid,timestamptz) from public,anon,authenticated;
create function app_private.withdraw_street_icons() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.withdrawn_at is not null and old.withdrawn_at is null then
  update app_private.street_icons set active=false,removed_at=clock_timestamp() where owner_id=new.account_id and removed_at is null;
  delete from app_private.daily_street_icons where account_id=new.account_id;
 end if;
 return new;
end $$;
revoke all on function app_private.withdraw_street_icons() from public,anon,authenticated;
create trigger withdraw_street_icons after update of withdrawn_at on app_private.members for each row execute function app_private.withdraw_street_icons();

alter function app_private.street_api(text,jsonb) rename to account_access_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
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
  select * into i from app_private.street_icons where owner_id=uid and street_id=street and not active and removed_at is null order by created_at desc limit 1;
  if not found then
   insert into app_private.street_icons(street_id,owner_id,path) values(street,uid,gen_random_uuid()::text||'.jpg') returning * into i;
  end if;
  return jsonb_build_object('id',i.id,'upload_path',i.path);
 elsif operation='street_icon_publish' then
  select * into i from app_private.street_icons where id=(payload->>'id')::uuid and owner_id=uid and street_id=street and removed_at is null for update;
  if not found then raise exception 'not_found';end if;
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
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
