begin;
alter table app_private.messages add column stay_level smallint check (stay_level between 1 and 4);
create function app_private.capture_message_level() returns trigger language plpgsql set search_path='' as $$
begin
  select case
    when new.created_at >= v.started_at + interval '120 minutes' then 4
    when new.created_at >= v.started_at + interval '60 minutes' then 3
    when new.created_at >= v.started_at + interval '30 minutes' then 2
    else 1 end into new.stay_level
  from app_private.visits v where v.street_id=new.street_id and v.account_id=new.author_id
    and v.started_at<=new.created_at and v.expires_at>new.created_at and v.ended_at is null;
  return new;
end $$;
create trigger capture_message_level before insert on app_private.messages
 for each row execute function app_private.capture_message_level();

alter function app_private.chat_read_api(text,jsonb) rename to chat_read_without_levels;
create function app_private.chat_read_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  result jsonb := app_private.chat_read_without_levels(operation,payload);
  items jsonb;
begin
  if operation <> 'chat_list' then return result; end if;
  select coalesce(jsonb_agg(entry.item || jsonb_build_object('stay_level',m.stay_level) order by entry.ord),'[]'::jsonb)
    into items from jsonb_array_elements(result->'items') with ordinality as entry(item,ord)
    left join app_private.messages m on entry.item->>'kind'='text' and m.id=(entry.item->>'id')::uuid;
  return jsonb_set(result,'{items}',items);
end $$;
revoke all on function app_private.chat_read_api(text,jsonb), app_private.capture_message_level() from public,anon,authenticated;
commit;
