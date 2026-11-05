begin;
create or replace function app_private.execute_chat_command(kind text,body jsonb,actor uuid,t timestamptz,command_id uuid)
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
   if not exists(select 1 from app_private.messages where author_id=target and street_id=(execute_chat_command.body->>'street_id')::uuid
     and deleted_at is null and created_at>t-interval '30 days') then raise exception 'invalid_mentions'; end if;
   insert into app_private.message_mentions values(mid,target);
   perform pg_advisory_xact_lock(hashtextextended('mention:'||target::text,0));
   if exists(select 1 from app_private.notifications n where n.recipient=target and n.kind='mention' and created_at>t-interval '5 minutes') then continue; end if;
   insert into app_private.notifications(message_id,recipient,kind,created_at) values(mid,target,'mention',t) returning id into notice;
   insert into app_private.notification_outbox(notification_id) values(notice);
 end loop;
 return result;
end $$;
commit;
