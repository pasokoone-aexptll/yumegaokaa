begin;
create function public.fcm_registration(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;
 env constant text:='fcm';tok text:=payload->>'token';d app_private.push_devices%rowtype;
begin
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid and (not_after is null or not_after>clock_timestamp())) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid for update;
 if not found then raise exception 'membership_required';end if;
 if operation='remove' then
  delete from app_private.push_devices where session_id=sid and account_id=uid and environment='fcm';
  return '{"removed":true}'::jsonb;
 end if;
 if operation<>'register' or tok is null or length(tok) not between 20 and 4096 or tok !~ '^[A-Za-z0-9_:-]+$' then raise exception 'invalid_input';end if;
 if not exists(select 1 from app_private.members where account_id=uid and active and withdrawn_at is null) then raise exception 'membership_required';end if;
 -- Serialize token ownership changes, without exposing a token lookup endpoint.
 perform pg_advisory_xact_lock(hashtextextended(env||':'||tok,0));
 select * into d from app_private.push_devices where environment=env and token=tok for update;
 if found and d.account_id=uid and d.session_id=sid then
  update app_private.push_devices set registered_at=clock_timestamp() where id=d.id;
 else
  delete from app_private.push_devices where (environment=env and token=tok) or (session_id=sid and environment=env);
  insert into app_private.push_devices(account_id,session_id,environment,token) values(uid,sid,env,tok);
 end if;
 return '{"registered":true}'::jsonb;
end $$;
revoke all on function public.fcm_registration(text,jsonb) from public,anon;
grant execute on function public.fcm_registration(text,jsonb) to authenticated;
create or replace function public.push_registration(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;
 env text:=payload->>'environment';tok text:=lower(payload->>'token');d app_private.push_devices%rowtype;
begin
 -- Compatibility for the first field APK, which registered FCM via this endpoint.
 if env='fcm' then return public.fcm_registration(operation,payload); end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid and (not_after is null or not_after>clock_timestamp())) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid for update;
 if not found then raise exception 'membership_required';end if;
 if operation='remove' then
  delete from app_private.push_devices where session_id=sid and account_id=uid;
  return '{"removed":true}'::jsonb;
 end if;
 if operation<>'register' or env is null or env not in ('sandbox','production') or tok is null or tok !~ '^[0-9a-f]+$' or length(tok) not between 2 and 512 or length(tok)%2<>0 then raise exception 'invalid_input';end if;
 if not exists(select 1 from app_private.members where account_id=uid and active and withdrawn_at is null) then raise exception 'membership_required';end if;
 -- Serialize token ownership changes, without exposing a token lookup endpoint.
 perform pg_advisory_xact_lock(hashtextextended(env||':'||tok,0));
 select * into d from app_private.push_devices where environment=env and token=tok for update;
 if found and d.account_id=uid and d.session_id=sid then
  update app_private.push_devices set registered_at=clock_timestamp() where id=d.id;
 else
  delete from app_private.push_devices where (environment=env and token=tok) or (session_id=sid and environment=env);
  insert into app_private.push_devices(account_id,session_id,environment,token) values(uid,sid,env,tok);
 end if;
 return '{"registered":true}'::jsonb;
end $$;
-- Both senders use the same transactional lease queue. Each public worker
-- endpoint only claims or acknowledges its own provider's devices.
alter function public.push_delivery(text,jsonb) set schema app_private;
revoke all on function app_private.push_delivery(text,jsonb) from public,anon,authenticated,service_role;

create function public.fcm_delivery(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception 'unauthorized';end if;
 if operation='claim' then
   payload:=jsonb_set(payload,'{environment}','"fcm"'::jsonb);
 elsif not exists(select 1 from app_private.push_devices where id=(payload->>'device_id')::uuid and environment='fcm') then
   return '{"active":false}'::jsonb;
 end if;
 return app_private.push_delivery(operation,payload);
end $$;
create function public.push_delivery(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception 'unauthorized';end if;
 if operation='claim' and coalesce(payload->>'environment','') not in ('sandbox','production') then
   raise exception 'invalid_input';
 elsif operation<>'claim' and not exists(select 1 from app_private.push_devices where id=(payload->>'device_id')::uuid and environment in ('sandbox','production')) then
   return '{"active":false}'::jsonb;
 end if;
 return app_private.push_delivery(operation,payload);
end $$;
revoke all on function public.fcm_delivery(text,jsonb),public.push_delivery(text,jsonb) from public,anon,authenticated;
grant execute on function public.fcm_delivery(text,jsonb),public.push_delivery(text,jsonb) to service_role;
commit;
