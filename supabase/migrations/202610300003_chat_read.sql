begin;
create table app_private.messages(
 id uuid primary key default gen_random_uuid(), street_id uuid not null references app_private.streets,
 author_id uuid not null references app_private.members, body text,
 created_at timestamptz not null default clock_timestamp(),deleted_at timestamptz,
 check((deleted_at is null and char_length(body) between 1 and 500) or (deleted_at is not null and body is null))
);
create index messages_page on app_private.messages(street_id,created_at desc,id desc);
create table app_private.blocks(
 owner_id uuid not null references app_private.members, target_id uuid not null references app_private.members,
 primary key(owner_id,target_id),check(owner_id<>target_id)
);
create table app_private.request_limits(
 account_id uuid not null references app_private.members, kind text not null, at timestamptz not null default clock_timestamp()
);
create index request_limits_recent on app_private.request_limits(account_id,kind,at);
revoke all on app_private.messages,app_private.blocks,app_private.request_limits from public,anon,authenticated;
alter function app_private.street_api(text,jsonb) rename to invitation_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
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
 select f.*,coalesce(p.display_name,'名前未設定') display_name from feed f left join app_private.profiles p on p.account_id=f.author_id
 where f.created_at>t-interval '30 days'
 and not exists(select 1 from app_private.blocks b where b.owner_id=uid and b.target_id=f.author_id)
 and (payload->>'before_at' is null or (f.created_at,f.id)<((payload->>'before_at')::timestamptz,(payload->>'before_id')::uuid))
 order by f.created_at desc,f.id desc limit 50
 ) select coalesce(jsonb_agg(jsonb_build_object('id',id,'author_id',author_id,'display_name',display_name,'body',body,'created_at',created_at,'deleted',deleted_at is not null,'kind',kind,'mine',author_id=uid) order by created_at desc,id desc),'[]'::jsonb) into result from page;
 return jsonb_build_object('items',result,'server_time',t);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
create trigger message_changed after insert or update or delete on app_private.messages for each row execute function app_private.changed();
commit;
