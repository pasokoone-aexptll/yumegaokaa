begin;
-- Only the authenticated issuer may retrieve their current invitation bearer token.
create table app_private.current_invitation_qr (
 invitation_id uuid primary key references app_private.invitations(id) on delete cascade,
 code text not null, issued_at timestamptz not null default clock_timestamp()
);
revoke all on app_private.current_invitation_qr from public,anon,authenticated;
-- Recover still-valid tokens from retained command receipts; never invent a token.
insert into app_private.current_invitation_qr(invitation_id,code)
select distinct on(i.id) i.id,c.result->>'code'
from app_private.invitations i join app_private.commands c on c.owner_id=i.issuer and c.kind='invite_create' and c.result->>'id'=i.id::text
where i.used_at is null and i.revoked_at is null and i.expires_at>clock_timestamp()
and sha256(convert_to(c.result->>'code','UTF8'))=i.code_hash
order by i.id,c.completed_at desc;

create function app_private.clear_invitation_qr() returns trigger language plpgsql set search_path='' as $$
begin
 if new.used_at is not null or new.revoked_at is not null then
  delete from app_private.current_invitation_qr where invitation_id=new.id;
 end if;
 return new;
end $$;
create trigger clear_invitation_qr after update of used_at,revoked_at on app_private.invitations for each row execute function app_private.clear_invitation_qr();
revoke all on function app_private.clear_invitation_qr() from public,anon,authenticated;

alter function app_private.invitation_api(text,jsonb) rename to invitation_api_before_current;
create function app_private.invitation_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; uid uuid:=auth.uid(); inv app_private.invitations%rowtype; token text; t timestamptz:=clock_timestamp();
begin
 if operation not in ('invite_create','invite_list') then return app_private.invitation_api_before_current(operation,payload);end if;
 -- Existing list path validates live session and locks the active issuer before invitation rows.
 result:=app_private.invitation_api_before_current('invite_list','{}');
 select * into inv from app_private.invitations where issuer=uid and used_at is null and revoked_at is null order by created_at desc limit 1 for update;
 if operation='invite_list' then
  if inv.id is not null and inv.expires_at>t then
   select code into token from app_private.current_invitation_qr where invitation_id=inv.id;
   if token is not null then result:=result||jsonb_build_object('current',jsonb_build_object('id',inv.id,'code',token,'issued_at',(select issued_at from app_private.current_invitation_qr where invitation_id=inv.id)));end if;
  end if;
  return result;
 end if;
 if payload->>'mode'='ensure' and inv.id is not null then
  select code into token from app_private.current_invitation_qr where invitation_id=inv.id;
  if token is not null and inv.expires_at>t then return jsonb_build_object('id',inv.id,'code',token,'expires_at',inv.expires_at);end if;
  raise exception 'invite_regeneration_required';
 end if;
 if exists(select 1 from app_private.invite_policies where account_id=uid and paused) then raise exception 'membership_required';end if;
 if inv.id is null then
  result:=app_private.invitation_api_before_current('invite_create','{}');
  insert into app_private.current_invitation_qr(invitation_id,code) values((result->>'id')::uuid,result->>'code');
  return result;
 end if;
 token:=gen_random_uuid()::text;
 -- Rotate in place: the original quota reservation and redeemed history are unchanged.
 update app_private.invitations set code_hash=sha256(convert_to(token,'UTF8')),expires_at=t+interval '7 days' where id=inv.id returning * into inv;
 insert into app_private.current_invitation_qr(invitation_id,code) values(inv.id,token) on conflict(invitation_id) do update set code=excluded.code,issued_at=t;
 -- Retire legacy extra unused invitations, never a redeemed invitation.
 update app_private.invitations set revoked_at=t where issuer=uid and id<>inv.id and used_at is null and revoked_at is null;
 return jsonb_build_object('id',inv.id,'code',token,'expires_at',inv.expires_at);
end $$;
revoke all on function app_private.invitation_api(text,jsonb) from public,anon,authenticated;

alter function app_private.execute_command(text,jsonb,uuid,timestamptz,uuid) rename to execute_command_before_current_qr;
create function app_private.execute_command(kind text,body jsonb,actor uuid,t timestamptz,command_id uuid) returns jsonb language plpgsql set search_path='' as $$
begin
 if kind='invite_create' then
  if actor is distinct from auth.uid() or body not in ('{}'::jsonb,'{"mode":"ensure"}'::jsonb) then raise exception 'invalid_input';end if;
  return app_private.invitation_api('invite_create',body);
 end if;
 return app_private.execute_command_before_current_qr(kind,body,actor,t,command_id);
end $$;
revoke all on function app_private.execute_command(text,jsonb,uuid,timestamptz,uuid) from public,anon,authenticated;
commit;
