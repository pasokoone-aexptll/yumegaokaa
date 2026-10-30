begin;
alter table app_private.profiles add column avatar_path text,add column avatar_updated_at timestamptz;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',false,2097152,array['image/jpeg']) on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/jpeg'];
create function public.avatar_member() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from app_private.members m join auth.sessions s on s.user_id=m.account_id
 where m.account_id=auth.uid() and m.active and s.id=(auth.jwt()->>'session_id')::uuid
 and (s.not_after is null or s.not_after>now()))
$$;
revoke all on function public.avatar_member() from public,anon;
grant execute on function public.avatar_member() to authenticated;
create policy avatar_read on storage.objects for select to authenticated using(bucket_id='avatars' and public.avatar_member());
create policy avatar_insert on storage.objects for insert to authenticated with check(bucket_id='avatars' and name=auth.uid()::text||'/avatar.jpg' and public.avatar_member());
create policy avatar_update on storage.objects for update to authenticated using(bucket_id='avatars' and name=auth.uid()::text||'/avatar.jpg' and public.avatar_member())
with check(bucket_id='avatars' and name=auth.uid()::text||'/avatar.jpg' and public.avatar_member());
create policy avatar_delete on storage.objects for delete to authenticated using(bucket_id='avatars' and name=auth.uid()::text||'/avatar.jpg' and public.avatar_member());
alter function app_private.street_api(text,jsonb) rename to area_publication_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;path text;
begin
 if operation<>'profile_avatar_set' then return app_private.area_publication_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 path:=uid::text||'/avatar.jpg';
 if not exists(select 1 from storage.objects where bucket_id='avatars' and name=path and (metadata->>'size')::bigint<=2097152 and metadata->>'mimetype'='image/jpeg') then raise exception 'invalid_input';end if;
 update app_private.profiles set avatar_path=path,avatar_updated_at=clock_timestamp() where account_id=uid;
 if not found then raise exception 'invalid_input';end if;
 return app_private.profile_api('profile_get','{}'::jsonb);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
create or replace function app_private.profile_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid:=(auth.jwt()->>'session_id')::uuid; result jsonb; name text;
begin
 if operation not in ('profile_get','profile_save') then
  return app_private.presence_api(operation,payload);
 end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 if operation='profile_save' then
  name:=btrim(payload->>'display_name');
  if name is null or char_length(name) not between 1 and 50 then raise exception 'invalid_input';end if;
  insert into app_private.profiles(account_id,display_name) values(uid,name)
  on conflict(account_id) do update set display_name=excluded.display_name,updated_at=clock_timestamp();
 end if;
 select jsonb_build_object('display_name',display_name,'avatar_path',avatar_path,'avatar_updated_at',avatar_updated_at,'avatar_upload_path',uid::text||'/avatar.jpg') into result from app_private.profiles where account_id=uid;
 return coalesce(result,jsonb_build_object('display_name','','avatar_upload_path',uid::text||'/avatar.jpg'));
end $$;
create or replace function app_private.chat_read_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid; t timestamptz:=clock_timestamp(); result jsonb; target uuid; street uuid;
begin
 if operation not in ('chat_list','chat_delete','block_set','block_list') then return app_private.invitation_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 if operation='block_set' then
  target:=(payload->>'account_id')::uuid;
  if target is null or target=uid or not exists(select 1 from app_private.members where account_id=target) then raise exception 'invalid_input';end if;
  if (payload->>'blocked')::boolean then insert into app_private.blocks values(uid,target) on conflict do nothing;
  else delete from app_private.blocks where owner_id=uid and target_id=target;end if;
  return '{"updated":true}'::jsonb;
 elsif operation='block_list' then
  select coalesce(jsonb_agg(jsonb_build_object('account_id',b.target_id,'display_name',coalesce(p.display_name,'名前未設定'))),'[]'::jsonb) into result from app_private.blocks b left join app_private.profiles p on p.account_id=b.target_id where b.owner_id=uid;
  return jsonb_build_object('items',result);
 elsif operation='chat_delete' then
  update app_private.messages set body=null,deleted_at=coalesce(deleted_at,t) where id=(payload->>'id')::uuid and author_id=uid;
  if not found then raise exception 'not_found';end if;
  return '{"deleted":true}'::jsonb;
 end if;
 street:=(payload->>'street_id')::uuid;
 if not exists(select 1 from app_private.streets where id=street) then raise exception 'not_found';end if;
 if(select count(*) from app_private.request_limits where account_id=uid and kind='chat_read' and at>t-interval '10 seconds')>=5 then raise exception 'rate_limited';end if;
 insert into app_private.request_limits values(uid,'chat_read',t);
 -- Cursor includes the UUID tie breaker; no offset drift when new posts arrive.
 with feed as (
 select id,author_id,body,created_at,deleted_at,'text' kind from app_private.messages where street_id=street
 union all
 select id,account_id,null,created_at,null,'arrival' from app_private.arrival_logs where street_id=street
 ), page as (
 select f.*,p.avatar_path,p.avatar_updated_at,coalesce(p.display_name,'名前未設定') display_name from feed f left join app_private.profiles p on p.account_id=f.author_id
 where f.created_at>t-interval '30 days'
 and not exists(select 1 from app_private.blocks b where b.owner_id=uid and b.target_id=f.author_id)
 and (payload->>'before_at' is null or (f.created_at,f.id)<((payload->>'before_at')::timestamptz,(payload->>'before_id')::uuid))
 order by f.created_at desc,f.id desc limit 50
 ) select coalesce(jsonb_agg(jsonb_build_object('id',id,'author_id',author_id,'display_name',display_name,'avatar_path',avatar_path,'avatar_updated_at',avatar_updated_at,'body',body,'created_at',created_at,'deleted',deleted_at is not null,'kind',kind,'mine',author_id=uid) order by created_at desc,id desc),'[]'::jsonb) into result from page;
 return jsonb_build_object('items',result,'server_time',t);
end $$;
commit;
