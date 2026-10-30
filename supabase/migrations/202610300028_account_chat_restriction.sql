begin;
create or replace function app_private.account_access_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;m app_private.members%rowtype;restricted_until timestamptz;t timestamptz:=clock_timestamp();
begin
 if operation<>'account_access' then return app_private.sticker_draft_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid and (not_after is null or not_after>t)) then raise exception 'unauthorized';end if;
 select * into m from app_private.members where account_id=uid;
 if not found then return jsonb_build_object('status','unregistered','chat_restricted_until',null);end if;
 select until_at into restricted_until from app_private.chat_restrictions where account_id=uid and until_at>t;
 return jsonb_build_object('status',case when m.withdrawn_at is not null then 'withdrawn' when not m.active then 'suspended' else 'active' end,'chat_restricted_until',restricted_until);
end $$;
revoke all on function app_private.account_access_api(text,jsonb) from public,anon,authenticated;
commit;
