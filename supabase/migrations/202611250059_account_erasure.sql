begin;
-- No dependency on 058: registration declarations, when installed, cascade from Auth.
create function app_private.erase_withdrawal_reports() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.withdrawn_at is not null and old.withdrawn_at is null then
  delete from app_private.reports where reporter=new.account_id or subject_id=new.account_id;
 end if;
 return new;
end $$;
create trigger erase_withdrawal_reports after update of withdrawn_at on app_private.members
for each row execute function app_private.erase_withdrawal_reports();

-- Only the leased cleanup worker can prepare a withdrawn account for Auth hard deletion.
create function public.account_erasure(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare j app_private.account_cleanup_jobs%rowtype; u uuid; assets jsonb;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'unauthorized';end if;
 select * into j from app_private.account_cleanup_jobs where id=(payload->>'id')::uuid
 and lease=(payload->>'lease')::uuid and lease_until>clock_timestamp() for update;
 if not found then raise exception 'conflict';end if;
 u:=j.account_id;
 perform 1 from app_private.members where account_id=u for update;
 if exists(select 1 from app_private.members where account_id=u and (active or withdrawn_at is null)) then raise exception 'conflict';end if;
 update app_private.account_cleanup_jobs set lease_until=clock_timestamp()+interval '5 minutes' where id=j.id;
 select coalesce(jsonb_agg(jsonb_build_object('bucket',o.bucket_id,'path',o.name)),'[]'::jsonb) into assets
 from storage.objects o where o.owner_id=u::text
 or (o.bucket_id='avatars' and o.name=u::text||'/avatar.jpg')
 or (o.bucket_id='street-icons' and exists(select 1 from app_private.street_icons i where i.owner_id=u and i.path=o.name));
 if operation='assets' then return jsonb_build_object('assets',assets);end if;
 if operation<>'prepare_auth_delete' then raise exception 'invalid_input';end if;
 if jsonb_array_length(assets)>0 then raise exception 'storage_cleanup_pending';end if;
 -- Delete dependent records explicitly. Unknown future dependencies fail closed.
 delete from app_private.reports where reporter=u or subject_id=u;
 delete from app_private.message_mentions where recipient=u;
 delete from app_private.notifications where recipient=u;
 delete from app_private.push_devices where account_id=u;
 delete from app_private.denshin_attendance where account_id=u;
 delete from app_private.denshin_pins where owner_id=u;
 delete from app_private.denshin_daily_usage where account_id=u;
 delete from app_private.registrations where account_id=u;
 delete from app_private.events where host_id=u;
 delete from app_private.recruitments where visit_id in(select id from app_private.visits where account_id=u);
 delete from app_private.arrival_logs where account_id=u or source_visit_id in(select id from app_private.visits where account_id=u);
 delete from app_private.attempts where account_id=u;
 delete from app_private.visits where account_id=u;
 delete from app_private.messages where author_id=u;
 delete from app_private.blocks where owner_id=u or target_id=u;
 delete from app_private.request_limits where account_id=u;
 delete from app_private.commands where owner_id=u;
 delete from app_private.chat_restrictions where account_id=u;
 delete from app_private.profiles where account_id=u;
 delete from app_private.invite_policies where account_id=u;
 update app_private.invitations set used_by=null where used_by=u;
 delete from app_private.invitations where issuer=u;
 delete from app_private.daily_street_icons where account_id=u or icon_id in(select id from app_private.street_icons where owner_id=u);
 delete from app_private.street_icons where owner_id=u;
 delete from app_private.icon_enrollments where account_id=u;
 delete from app_private.operator_audit where actor=u or target=u;
 delete from app_private.operators where account_id=u;
 delete from app_private.withdrawal_requests where account_id=u;
 delete from app_private.sticker_drafts where creator=u;
 delete from app_private.area_publications where operator_id=u;
 if to_regclass('app_private.field_trial_grant') is not null then
  execute 'delete from app_private.field_trial_grant where account_id=$1' using u;
 end if;
 delete from auth.sessions where user_id=u;
 delete from app_private.members where account_id=u;
 return '{"prepared":true}'::jsonb;
end $$;
revoke all on function public.account_erasure(text,jsonb) from public,anon,authenticated;
grant execute on function public.account_erasure(text,jsonb) to service_role;

alter function public.maintenance_jobs(text,jsonb) rename to maintenance_jobs_before_erasure;
revoke all on function public.maintenance_jobs_before_erasure(text,jsonb) from public,anon,authenticated,service_role;
create function public.maintenance_jobs(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare j app_private.account_cleanup_jobs%rowtype;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'unauthorized';end if;
 if operation='finish' then
  select * into j from app_private.account_cleanup_jobs where id=(payload->>'id')::uuid and lease=(payload->>'lease')::uuid for update;
  if not found then raise exception 'conflict';end if;
  if exists(select 1 from auth.users where id=j.account_id) or exists(select 1 from app_private.members where account_id=j.account_id) then raise exception 'erasure_incomplete';end if;
 end if;
 return public.maintenance_jobs_before_erasure(operation,payload);
end $$;
revoke all on function public.maintenance_jobs(text,jsonb) from public,anon,authenticated;
grant execute on function public.maintenance_jobs(text,jsonb) to service_role;
-- Do not allow a still-valid Auth session to enroll again between DB purge and Auth deletion.
alter function app_private.invitation_api(text,jsonb) rename to invitation_api_before_erasure;
create function app_private.invitation_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if operation='invite_accept' and exists(select 1 from app_private.account_cleanup_jobs where account_id=auth.uid()) then raise exception 'unauthorized';end if;
 return app_private.invitation_api_before_erasure(operation,payload);
end $$;
revoke all on function app_private.invitation_api(text,jsonb) from public,anon,authenticated;
-- Requeue previous withdrawals, including already soft-deleted Auth users.
insert into app_private.account_cleanup_jobs(account_id)
select account_id from app_private.members where withdrawn_at is not null on conflict(account_id) do nothing;
commit;
