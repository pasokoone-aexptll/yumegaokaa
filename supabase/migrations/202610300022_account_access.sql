begin;
alter function app_private.street_api(text,jsonb) rename to sticker_draft_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;m app_private.members%rowtype;
begin
 if operation<>'account_access' then return app_private.sticker_draft_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid and (not_after is null or not_after>clock_timestamp())) then raise exception 'unauthorized';end if;
 select * into m from app_private.members where account_id=uid;
 return jsonb_build_object('status',case when not found then 'unregistered' when m.withdrawn_at is not null then 'withdrawn' when not m.active then 'suspended' else 'active' end);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
