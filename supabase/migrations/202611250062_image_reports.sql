begin;

-- Rotate the next upload destination when a profile photo is published. Existing
-- clients already ask profile_get for the destination before each upload.
alter table app_private.profiles add column next_avatar uuid not null default gen_random_uuid();
create index profiles_published_avatar on app_private.profiles(avatar_path) where avatar_path is not null;
create table app_private.retired_avatars (
 id uuid primary key default gen_random_uuid(), path text unique not null,
 lease uuid, available_at timestamptz not null default now()
);
alter table app_private.retired_avatars enable row level security;
revoke all on app_private.retired_avatars from public, anon, authenticated;

create function app_private.retire_avatar() returns trigger
language plpgsql set search_path='' as $$
begin
 if split_part(old.avatar_path,'/',1)=old.account_id::text and (tg_op='DELETE' or old.avatar_path is distinct from new.avatar_path) then
  insert into app_private.retired_avatars(path) values(old.avatar_path) on conflict do nothing;
 end if;
 return null;
end $$;
create trigger retire_avatar after update of avatar_path or delete on app_private.profiles
for each row execute function app_private.retire_avatar();

alter function app_private.avatar_api(text,jsonb) rename to avatar_api_before_versions;
create function app_private.avatar_api(operation text,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; p app_private.profiles%rowtype; dest text;
begin
 if operation not in ('profile_get','profile_save','profile_avatar_set') then
  return app_private.avatar_api_before_versions(operation,payload);
 end if;
 if operation='profile_avatar_set' then
  if not public.avatar_member() then raise exception 'membership_required'; end if;
  perform 1 from app_private.members where account_id=auth.uid() and active for update;
  select * into strict p from app_private.profiles where account_id=auth.uid() for update;
  dest:=p.account_id::text||'/'||p.next_avatar::text||'.jpg';
  if payload->>'path'=p.avatar_path then return app_private.avatar_api('profile_get','{}'); end if;
  if payload ? 'path' and payload->>'path' is distinct from dest then raise exception 'conflict'; end if;
  if not exists(select 1 from storage.objects where bucket_id='avatars' and name=dest
    and metadata->>'mimetype'='image/jpeg' and (metadata->>'size')::bigint between 1 and 2097152)
  then raise exception 'invalid_input'; end if;
  update app_private.profiles set avatar_path=dest, avatar_updated_at=clock_timestamp(),next_avatar=gen_random_uuid()
   where account_id=p.account_id;
  operation:='profile_get';
 end if;
 result:=app_private.avatar_api_before_versions(operation,payload);
 select * into p from app_private.profiles where account_id=auth.uid();
 if found then result:=result||jsonb_build_object('avatar_upload_path',p.account_id::text||'/'||p.next_avatar::text||'.jpg'); end if;
 return result;
end $$;
revoke all on function app_private.avatar_api(text,jsonb) from public,anon,authenticated;

create function public.avatar_pending(object_name text) returns boolean
language plpgsql volatile security definer set search_path='' as $$
declare p app_private.profiles%rowtype;
begin
 if not public.avatar_member() then return false; end if;
 select * into p from app_private.profiles where account_id=auth.uid() for update;
 return found and object_name=p.account_id::text||'/'||p.next_avatar::text||'.jpg';
end $$;
revoke all on function public.avatar_pending(text) from public,anon;
grant execute on function public.avatar_pending(text) to authenticated;
alter policy avatar_insert on storage.objects with check(bucket_id='avatars' and public.avatar_pending(name));
alter policy avatar_update on storage.objects using(bucket_id='avatars' and public.avatar_pending(name))
 with check(bucket_id='avatars' and public.avatar_pending(name));
alter policy avatar_delete on storage.objects using(bucket_id='avatars' and public.avatar_pending(name));
create or replace function public.avatar_readable(object_name text) returns boolean
language sql stable security definer set search_path='' as $$
 select public.avatar_member() and exists(select 1 from app_private.profiles p join app_private.members m using(account_id)
   where m.active and ((p.avatar_path=object_name and p.account_id::text=split_part(object_name,'/',1)) or (p.account_id=auth.uid()
   and object_name=p.account_id::text||'/'||p.next_avatar::text||'.jpg')))
$$;

alter table app_private.reports drop constraint reports_target_kind_check;
alter table app_private.reports add constraint reports_target_kind_check
 check(target_kind in ('message','denshin','recruitment','event','profile_image','street_image'));
create index report_image_path on app_private.reports(target_kind,(evidence->>'path'))
 where resolved_at is null;
create function app_private.image_under_review(kind text,object_name text) returns boolean
language sql stable set search_path='' as $$
 select exists(select 1 from app_private.reports r where r.target_kind=kind and r.evidence->>'path'=object_name
  and r.resolved_at is null and r.created_at>now()-interval '180 days' and not (r.evidence ? 'removed'))
$$;
-- Allow verified staff to inspect the reported version after a replacement.
create function public.report_image_readable(bucket text,object_name text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if bucket not in ('avatars','street-icons') or auth.jwt()->>'aal' is distinct from 'aal2'
   or not app_private.has_current_consent(auth.uid()) then return false; end if;
 perform app_private.require_operator();
 return app_private.image_under_review(case bucket when 'avatars' then 'profile_image' else 'street_image' end,object_name);
exception when raise_exception then return false;
end $$;
revoke all on function public.report_image_readable(text,text) from public,anon;
grant execute on function public.report_image_readable(text,text) to authenticated;
create policy operator_image_evidence on storage.objects for select to authenticated
 using(public.report_image_readable(bucket_id,name));

alter function app_private.report_api(text,jsonb) rename to report_api_before_images;
create function app_private.report_api(operation text,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare r app_private.reports%rowtype; actor uuid:=auth.uid(); kind text:=payload->>'target_kind';
 object_name text:=payload->>'path'; subject uuid; asset uuid; bucket text;
begin
 if operation='operator_image_delete' then
  actor:=app_private.require_operator();
  select * into r from app_private.reports where id=(payload->>'id')::uuid;
  if not found or r.target_kind not in ('profile_image','street_image') then raise exception 'not_found'; end if;
  -- Serialize with publication and withdrawal before locking a report.
  perform 1 from app_private.members where account_id=r.subject_id for update;
  select * into r from app_private.reports where id=(payload->>'id')::uuid for update;
  if not found or r.resolved_at is not null or r.created_at<=now()-interval '180 days' then raise exception 'not_found'; end if;
  if not (r.evidence ? 'removed') then
   if r.target_kind='profile_image' then
    update app_private.profiles set avatar_path=null,avatar_updated_at=clock_timestamp()
     where account_id=r.subject_id and avatar_path=r.evidence->>'path';
   else
    update app_private.street_icons set active=false,removed_at=coalesce(removed_at,clock_timestamp())
     where id=r.target_id and path=r.evidence->>'path';
   end if;
   update app_private.reports set evidence=evidence||'{"removed":true}' where target_kind=r.target_kind and target_id=r.target_id;
   insert into app_private.operator_audit(actor,action,target) values(actor,'image_delete',r.target_id);
  end if;
  return '{"deleted":true}'::jsonb;
 end if;
 if operation<>'report_create' or kind is null or kind not in ('profile_image','street_image') then
  return app_private.report_api_before_images(operation,payload);
 end if;
 if not public.avatar_member() then raise exception 'membership_required'; end if;
 if kind='profile_image' then
  bucket:='avatars';
  select account_id into subject from app_private.profiles where avatar_path=object_name and account_id::text=split_part(object_name,'/',1);
 else
  bucket:='street-icons';
  select owner_id,id into subject,asset from app_private.street_icons where path=object_name and active and removed_at is null;
 end if;
 if subject is null then
  select id into r.id from app_private.reports where reporter=actor and target_kind=kind and evidence->>'path'=object_name and resolved_at is null;
  if found then return jsonb_build_object('id',r.id); end if;
  raise exception 'not_found';
 end if;
 perform 1 from app_private.members where account_id in (actor,subject) order by account_id for update;
 if not public.avatar_member() or not exists(select 1 from app_private.members where account_id=subject and active) then raise exception 'membership_required'; end if;
 if kind='profile_image' then
  select o.id into asset from app_private.profiles p join storage.objects o on o.bucket_id=bucket and o.name=p.avatar_path
   where p.account_id=subject and p.avatar_path=object_name for share of p;
 else
  select id into asset from app_private.street_icons where path=object_name and active and removed_at is null for share;
 end if;
 if asset is null then raise exception 'not_found'; end if;
 select id into r.id from app_private.reports where reporter=actor and target_kind=kind and target_id=asset and resolved_at is null;
 if found then return jsonb_build_object('id',r.id); end if;
 if (select count(*) from app_private.request_limits where account_id=actor and request_limits.kind='report' and at>now()-interval '1 minute')>=10 then raise exception 'rate_limited'; end if;
 insert into app_private.reports(reporter,target_kind,target_id,subject_id,reason,description,evidence)
 values(actor,kind,asset,subject,payload->>'reason',coalesce(payload->>'description',''),jsonb_build_object('path',object_name))
 returning id into r.id;
 insert into app_private.request_limits values(actor,'report',clock_timestamp());
 return jsonb_build_object('id',r.id);
end $$;
revoke all on function app_private.report_api(text,jsonb),app_private.retire_avatar(),
 app_private.image_under_review(text,text) from public,anon,authenticated;

-- Old workers request street icons only. New workers explicitly opt into avatars.
alter function public.icon_cleanup(text,jsonb) rename to icon_cleanup_before_images;
revoke all on function public.icon_cleanup_before_images(text,jsonb) from public,anon,authenticated,service_role;
create function public.icon_cleanup(operation text,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare a app_private.retired_avatars%rowtype; i app_private.street_icons%rowtype;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'forbidden'; end if;
 if operation='claim' then
  if payload->>'include_avatars'='true' then
   select * into a from app_private.retired_avatars where available_at<=now()
    and not app_private.image_under_review('profile_image',path) order by available_at for update skip locked limit 1;
   if found then
    update app_private.retired_avatars set lease=gen_random_uuid(),available_at=now()+interval '5 minutes' where id=a.id returning * into a;
    return jsonb_build_object('id',a.id,'lease',a.lease,'path',a.path,'bucket','avatars');
   end if;
  end if;
  select * into i from app_private.street_icons where not active and (removed_at is not null or created_at<=now()-interval '24 hours')
   and (cleanup_until is null or cleanup_until<=now()) and not app_private.image_under_review('street_image',path)
   order by removed_at for update skip locked limit 1;
  if not found then return '{}'::jsonb; end if;
  update app_private.street_icons set removed_at=coalesce(removed_at,now()),cleanup_lease=gen_random_uuid(),cleanup_until=now()+interval '5 minutes'
   where id=i.id returning * into i;
  return jsonb_build_object('id',i.id,'lease',i.cleanup_lease,'path',i.path,'bucket','street-icons');
 elsif payload->>'bucket'='avatars' then
  select * into a from app_private.retired_avatars where id=(payload->>'id')::uuid and lease=(payload->>'lease')::uuid for update;
  if not found then raise exception 'conflict'; end if;
  if operation='finish' then
   if exists(select 1 from storage.objects where bucket_id='avatars' and name=a.path) then raise exception 'storage_not_deleted'; end if;
   delete from app_private.retired_avatars where id=a.id;
   return '{"finished":true}'::jsonb;
  elsif operation='retry' then
   update app_private.retired_avatars set lease=null,available_at=now()+interval '5 minutes' where id=a.id;
   return '{"retry":true}'::jsonb;
  end if;
  raise exception 'invalid_input';
 end if;
 return public.icon_cleanup_before_images(operation,payload);
end $$;
revoke all on function public.icon_cleanup(text,jsonb) from public,anon,authenticated;
grant execute on function public.icon_cleanup(text,jsonb) to service_role;
commit;
