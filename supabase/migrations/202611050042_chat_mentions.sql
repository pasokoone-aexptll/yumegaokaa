begin;
create table app_private.message_mentions (
 message_id uuid not null references app_private.messages on delete cascade,
 recipient uuid not null references app_private.members,
 primary key(message_id,recipient)
);
revoke all on app_private.message_mentions from public,anon,authenticated;
alter table app_private.notifications
 alter event_id drop not null, alter event_revision drop not null,
 add column message_id uuid references app_private.messages on delete cascade,
 drop constraint notifications_kind_check,
 add check ((kind='mention' and message_id is not null and event_id is null and event_revision is null)
 or (kind in ('changed','canceled') and event_id is not null and event_revision is not null and message_id is null));
create unique index one_message_notice on app_private.notifications(message_id,recipient) where message_id is not null;
create index recent_mention_notice on app_private.notifications(recipient,created_at desc) where kind='mention';

alter function app_private.execute_chat_command(text,jsonb,uuid,timestamptz,uuid) rename to execute_chat_without_mentions;
create function app_private.execute_chat_command(kind text,body jsonb,actor uuid,t timestamptz,command_id uuid)
returns jsonb language plpgsql set search_path='' as $$
declare
 result jsonb := app_private.execute_chat_without_mentions(kind,body,actor,t,command_id);
 targets jsonb := body->'mention_ids';
 target uuid;
 notice uuid;
 mid uuid := (result->>'id')::uuid;
begin
 if kind<>'chat_send' or targets is null then return result; end if;
 if jsonb_typeof(targets)<>'array' or jsonb_array_length(targets)>5 then raise exception 'invalid_mentions'; end if;
 for target in select distinct value::uuid from jsonb_array_elements_text(targets) order by 1 loop
   if target=actor or not exists(select 1 from app_private.members where account_id=target and active)
     or exists(select 1 from app_private.blocks where (owner_id,target_id) in ((actor,target),(target,actor))) then continue; end if;
   if not exists(select 1 from app_private.messages where author_id=target and street_id=(body->>'street_id')::uuid
     and deleted_at is null and created_at>t-interval '30 days') then raise exception 'invalid_mentions'; end if;
   insert into app_private.message_mentions values(mid,target);
   perform pg_advisory_xact_lock(hashtextextended('mention:'||target::text,0));
   if exists(select 1 from app_private.notifications where recipient=target and kind='mention' and created_at>t-interval '5 minutes') then continue; end if;
   insert into app_private.notifications(message_id,recipient,kind,created_at) values(mid,target,'mention',t) returning id into notice;
   insert into app_private.notification_outbox(notification_id) values(notice);
 end loop;
 return result;
end $$;

alter function app_private.notification_sendable(uuid,timestamptz) rename to event_notification_sendable;
create function app_private.notification_sendable(nid uuid,t timestamptz) returns boolean language sql stable set search_path='' as $$
 select app_private.event_notification_sendable(nid,t) or exists(
   select 1 from app_private.notifications n join app_private.messages m on m.id=n.message_id
   join app_private.members a on a.account_id=m.author_id and a.active
   join app_private.members r on r.account_id=n.recipient and r.active
   where n.id=nid and m.deleted_at is null and m.created_at>t-interval '30 days'
   and not exists(select 1 from app_private.blocks where (owner_id,target_id) in ((a.account_id,r.account_id),(r.account_id,a.account_id))))
$$;
alter function app_private.event_api(text,jsonb) rename to event_api_without_mentions;
create function app_private.event_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb := app_private.event_api_without_mentions(operation,payload); additions jsonb;
begin
 if operation='notification_list' then
   select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'kind',n.kind,'message_id',n.message_id,
    'title',coalesce(p.display_name,'名前未設定'),'created_at',n.created_at,'read',n.read_at is not null)
    order by n.created_at desc),'[]'::jsonb) into additions from app_private.notifications n
    join app_private.messages m on m.id=n.message_id left join app_private.profiles p on p.account_id=m.author_id
    where n.recipient=auth.uid() and n.kind='mention' and app_private.notification_sendable(n.id,clock_timestamp());
   return jsonb_set(result,'{items}',(result->'items') || additions);
 elsif operation='chat_list' then
   select coalesce(jsonb_agg(entry.item || jsonb_build_object('mentions',(
     select coalesce(jsonb_agg(coalesce(p.display_name,'名前未設定') order by mm.recipient),'[]'::jsonb)
     from app_private.message_mentions mm join app_private.members m on m.account_id=mm.recipient and m.active
     left join app_private.profiles p on p.account_id=mm.recipient
     where mm.message_id=(entry.item->>'id')::uuid and entry.item->>'kind'='text' and entry.item->>'deleted'='false'
     and not exists(select 1 from app_private.blocks where (owner_id,target_id) in ((auth.uid(),mm.recipient),(mm.recipient,auth.uid())))
   )) order by entry.ord),'[]'::jsonb) into additions
   from jsonb_array_elements(result->'items') with ordinality as entry(item,ord);
   return jsonb_set(result,'{items}',additions);
 end if;
 return result;
end $$;
revoke all on function app_private.execute_chat_command(text,jsonb,uuid,timestamptz,uuid),
 app_private.notification_sendable(uuid,timestamptz),app_private.event_api(text,jsonb) from public,anon,authenticated;
commit;
