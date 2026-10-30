begin;
create table app_private.commands (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references app_private.members,
 kind text not null,issued_at timestamptz not null default clock_timestamp(),
 accept_until timestamptz not null default clock_timestamp()+interval '10 minutes',
 body_hash bytea,result jsonb,completed_at timestamptz,
 check((completed_at is null)=(result is null))
);
create table app_private.chat_restrictions (
 account_id uuid primary key references app_private.members,until_at timestamptz not null
);
revoke all on app_private.commands,app_private.chat_restrictions from public,anon,authenticated;
create function app_private.execute_command(kind text,body jsonb,actor uuid,t timestamptz,command_id uuid)
returns jsonb language plpgsql set search_path='' as $$
declare message_id uuid; text_body text; street uuid;
begin
 if kind='chat_send' then
  street:=(body->>'street_id')::uuid;text_body:=btrim(body->>'body');
  if text_body is null or char_length(text_body) not between 1 and 500 then raise exception 'invalid_input';end if;
  if not exists(select 1 from app_private.streets where id=street) then raise exception 'not_found';end if;
  if not exists(select 1 from app_private.profiles where account_id=actor) then raise exception 'invalid_input';end if;
  if exists(select 1 from app_private.chat_restrictions where account_id=actor and until_at>t) then raise exception 'membership_required';end if;
  if(select count(*) from app_private.request_limits l where l.account_id=actor and l.kind='chat_write' and l.at>t-interval '10 seconds')>=5
  or(select count(*) from app_private.request_limits l where l.account_id=actor and l.kind='chat_write' and l.at>t-interval '1 minute')>=20 then raise exception 'rate_limited';end if;
  insert into app_private.request_limits values(actor,'chat_write',t);
  insert into app_private.messages(street_id,author_id,body,created_at) values(street,actor,text_body,t) returning id into message_id;
  return jsonb_build_object('id',message_id);
 end if;
 raise exception 'unknown_operation';
end $$;
revoke all on function app_private.execute_command(text,jsonb,uuid,timestamptz,uuid) from public,anon,authenticated;
alter function app_private.street_api(text,jsonb) rename to chat_read_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;t timestamptz; c app_private.commands%rowtype; body jsonb; h bytea;response jsonb;
begin
 if operation not in ('command_prepare','command_execute','command_status') then return app_private.chat_read_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 t:=clock_timestamp();
 if operation='command_prepare' then
  if payload->>'kind' not in ('chat_send','event_create','recruitment_create') then raise exception 'invalid_input';end if;
  -- Preparation abuse bound is above every user-facing creation rate.
  if(select count(*) from app_private.commands where owner_id=uid and issued_at>t-interval '1 minute')>=120 then raise exception 'rate_limited';end if;
  insert into app_private.commands(owner_id,kind,issued_at,accept_until) values(uid,payload->>'kind',t,t+interval '10 minutes') returning * into c;
  return jsonb_build_object('id',c.id,'accept_until',c.accept_until);
 end if;
 select * into c from app_private.commands where id=(payload->>'id')::uuid and owner_id=uid for update;
 if not found then raise exception 'not_found';end if;
 if operation='command_status' then return jsonb_build_object('completed',c.completed_at is not null,'result',c.result,'accept_until',c.accept_until,'expired',c.accept_until<=t);end if;
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
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
