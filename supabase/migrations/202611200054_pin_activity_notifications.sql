begin;
-- 053 renamed the PIN dispatcher. PL/pgSQL argument qualification must follow
-- that name as well; otherwise every PIN mutation fails before saving.
do $$ begin
 execute replace(pg_get_functiondef('app_private.execute_command_before_current_qr(text,jsonb,uuid,timestamptz,uuid)'::regprocedure),
  'execute_command.body','execute_command_before_current_qr.body');
end $$;

-- Self-action receipts are inbox-only. They are not attendance-change alerts
-- and must survive leaving a PIN without entering the APNs outbox.
alter table app_private.notifications
 add column activity_pin_id uuid references app_private.denshin_pins on delete cascade,
 add column activity_command_id uuid,
 add column subject_body text;
alter table app_private.notifications drop constraint notification_target_shape;
alter table app_private.notifications add constraint notification_target_shape check (
 (activity_pin_id is null and activity_command_id is null and subject_body is null and (
  (kind='mention' and message_id is not null and event_id is null and event_revision is null and pin_id is null)
  or (kind in ('changed','canceled') and event_id is not null and event_revision is not null and message_id is null and pin_id is null)
  or (kind in ('pin_changed','pin_closed') and pin_id is not null and event_revision is not null and event_id is null and message_id is null)))
 or (kind in ('pin_created','pin_joined') and activity_pin_id is not null and activity_command_id is not null and subject_body is not null
  and pin_id is null and event_id is null and event_revision is null and message_id is null)
);
create unique index one_pin_activity_receipt on app_private.notifications(activity_command_id) where activity_command_id is not null;
create function app_private.pin_activity_receipt() returns trigger
language plpgsql security definer set search_path='' as $$
declare p app_private.denshin_pins%rowtype;
begin
 if new.kind='denshin_create' or (new.kind='denshin_attend' and exists(
  select 1 from app_private.denshin_attendance a where a.pin_id=(new.result->>'id')::uuid
   and a.account_id=new.owner_id and a.state='planned')) then
  select * into strict p from app_private.denshin_pins where id=(new.result->>'id')::uuid;
  insert into app_private.notifications(recipient,kind,created_at,activity_pin_id,activity_command_id,subject_body)
  values(new.owner_id,case when new.kind='denshin_create' then 'pin_created' else 'pin_joined' end,
   new.completed_at,p.id,new.id,p.body) on conflict do nothing;
 end if;
 return null;
end $$;
revoke all on function app_private.pin_activity_receipt() from public,anon,authenticated;
create trigger pin_activity_receipt after update of completed_at on app_private.commands
 for each row when (old.completed_at is null and new.completed_at is not null)
 execute function app_private.pin_activity_receipt();

alter function app_private.street_api(text,jsonb) rename to street_api_before_pin_activity;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; items jsonb; activity jsonb;
begin
 -- Reuse live-session, membership and recipient checks for every operation.
 result:=app_private.street_api_before_pin_activity(operation,payload);
 if operation<>'notification_list' then return result;end if;
 select coalesce(jsonb_agg(item || case when p.id is null then '{}'::jsonb else
  jsonb_build_object('title',p.body,'display_name',pr.display_name,'avatar_path',pr.avatar_path,'deleted',p.deleted_at is not null) end),'[]'::jsonb)
 into items from jsonb_array_elements(result->'items') item
 left join app_private.denshin_pins p on p.id=(item->>'pin_id')::uuid
 left join app_private.profiles pr on pr.account_id=p.owner_id;
 select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'pin_id',p.id,'kind',n.kind,'title',n.subject_body,
  'display_name',pr.display_name,'avatar_path',pr.avatar_path,'created_at',n.created_at,'read',n.read_at is not null)
  order by n.created_at desc),'[]'::jsonb) into activity
 from app_private.notifications n join app_private.denshin_pins p on p.id=n.activity_pin_id
 left join app_private.profiles pr on pr.account_id=p.owner_id
 where n.recipient=auth.uid() and n.created_at+interval '24 hours'>clock_timestamp()
 and not exists(select 1 from app_private.blocks b where b.owner_id=auth.uid() and b.target_id=p.owner_id);
 return jsonb_set(result,'{items}',items||activity);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;

alter function app_private.cleanup() rename to cleanup_before_pin_activity;
create function app_private.cleanup() returns void language plpgsql security definer set search_path='' as $$
begin
 perform app_private.cleanup_before_pin_activity();
 delete from app_private.notifications where activity_pin_id is not null and created_at+interval '24 hours'<=clock_timestamp();
end $$;
revoke all on function app_private.cleanup() from public,anon,authenticated;
commit;
