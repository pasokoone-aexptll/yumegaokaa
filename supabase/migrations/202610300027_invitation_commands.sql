begin;
alter function app_private.execute_command(text,jsonb,uuid,timestamptz,uuid) rename to execute_sticker_command;
create function app_private.execute_command(kind text,body jsonb,actor uuid,t timestamptz,command_id uuid)
returns jsonb language plpgsql set search_path='' as $$
begin
 if kind='invite_create' then
  if actor is distinct from auth.uid() or body<>'{}'::jsonb then raise exception 'invalid_input';end if;
  return app_private.invitation_api('invite_create','{}'::jsonb);
 end if;
 return app_private.execute_sticker_command(kind,body,actor,t,command_id);
end $$;
revoke all on function app_private.execute_command(text,jsonb,uuid,timestamptz,uuid) from public,anon,authenticated;
create or replace function app_private.command_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;t timestamptz; c app_private.commands%rowtype; body jsonb; h bytea;response jsonb;
begin
 if operation not in ('command_prepare','command_execute','command_status','command_cancel') then return app_private.chat_read_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 t:=clock_timestamp();
 if operation='command_prepare' then
  if payload->>'kind' is null or payload->>'kind' not in ('chat_send','event_create','recruitment_create','sticker_create','invite_create') then raise exception 'invalid_input';end if;
  -- Preparation abuse bound is above every user-facing creation rate.
  if(select count(*) from app_private.commands where owner_id=uid and issued_at>t-interval '1 minute')>=120 then raise exception 'rate_limited';end if;
  insert into app_private.commands(owner_id,kind,issued_at,accept_until) values(uid,payload->>'kind',t,t+interval '10 minutes') returning * into c;
  return jsonb_build_object('id',c.id,'accept_until',c.accept_until);
 end if;
 select * into c from app_private.commands where id=(payload->>'id')::uuid and owner_id=uid for update;
 if not found then raise exception 'not_found';end if;
 if operation='command_status' then return jsonb_build_object('completed',c.completed_at is not null,'result',c.result,'accept_until',c.accept_until,'expired',c.accept_until<=t,'canceled',c.canceled_at is not null);end if;
 if operation='command_cancel' then
  if c.completed_at is not null then return jsonb_build_object('completed',true,'result',c.result);end if;
  update app_private.commands set canceled_at=coalesce(canceled_at,t) where id=c.id;
  return '{"completed":false,"canceled":true}'::jsonb;
 end if;
 if c.canceled_at is not null then raise exception 'attempt_expired';end if;
 body:=payload->'body';
 if body is null or jsonb_typeof(body)<>'object' then raise exception 'invalid_input';end if;
 h:=sha256(convert_to(body::text,'UTF8'));
 if c.completed_at is not null then
  if c.body_hash<>h then raise exception 'conflict';end if;
  return c.result;
 end if;
 if c.accept_until<=t then raise exception 'attempt_expired';end if;
 response:=app_private.execute_command(c.kind,body,uid,t,c.id);
 update app_private.commands set body_hash=h,result=response,completed_at=t where id=c.id;
 return response;
end $$;
alter function app_private.street_api(text,jsonb) rename to presence_icons_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if operation='invite_create' then raise exception 'invalid_input';end if;
 return app_private.presence_icons_api(operation,payload);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
