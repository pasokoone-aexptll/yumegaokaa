begin;
create or replace function app_private.account_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;r app_private.withdrawal_requests%rowtype;t timestamptz;e record;
begin
 if operation not in ('withdraw_prepare','withdraw_confirm') then return app_private.avatar_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid for update;
 if not found then raise exception 'membership_required';end if;t:=clock_timestamp();
 if operation='withdraw_prepare' then
  if not exists(select 1 from app_private.members where account_id=uid and active and withdrawn_at is null) then raise exception 'membership_required';end if;
  insert into app_private.withdrawal_requests(account_id) values(uid) returning * into r;
  return jsonb_build_object('id',r.id,'accept_until',r.accept_until);
 end if;
 select * into r from app_private.withdrawal_requests where id=(payload->>'id')::uuid and account_id=uid for update;
 if not found then raise exception 'not_found';end if;
 if r.completed_at is not null then return '{"withdrawn":true}'::jsonb;end if;
 if r.accept_until<=t then raise exception 'attempt_expired';end if;
 if not exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a where a->>'method'='otp'
  and (a->>'timestamp')::numeric>=ceil(extract(epoch from r.issued_at))
  and (a->>'timestamp')::numeric<=extract(epoch from t)+2) then raise exception 'unauthorized';end if;
 -- Lock the union in ID order before the membership trigger cancels hosted events.
 perform 1 from app_private.events ev where ev.host_id=uid or exists(select 1 from app_private.registrations rr where rr.event_id=ev.id and rr.account_id=uid) order by ev.id for update;
 update app_private.members set active=false,withdrawn_at=t where account_id=uid;
 update app_private.operators set active=false where account_id=uid;
 delete from app_private.profiles where account_id=uid;
 update app_private.messages set author_id=null where author_id=uid;
 update app_private.arrival_logs set account_id=null where account_id=uid;
 delete from app_private.registrations where account_id=uid;
 delete from app_private.notifications where recipient=uid;
 update app_private.invitations set revoked_at=coalesce(revoked_at,t) where issuer=uid and used_at is null;
 delete from app_private.chat_restrictions where account_id=uid;
 delete from app_private.invite_policies where account_id=uid;
 delete from app_private.blocks where owner_id=uid or target_id=uid;
 update app_private.withdrawal_requests set completed_at=t where id=r.id;
 insert into app_private.account_cleanup_jobs(account_id) values(uid) on conflict(account_id) do nothing;
 return '{"withdrawn":true}'::jsonb;
end $$;
-- Apply the approved cleanup to accounts withdrawn before this migration.
delete from app_private.chat_restrictions r using app_private.members m
 where r.account_id=m.account_id and m.withdrawn_at is not null;
delete from app_private.invite_policies p using app_private.members m
 where p.account_id=m.account_id and m.withdrawn_at is not null;
delete from app_private.notifications n using app_private.members m
 where n.recipient=m.account_id and m.withdrawn_at is not null;
commit;
