begin;
create or replace function app_private.member_operations_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid;target uuid;result jsonb;lim integer;paused boolean;reason text;active boolean;
begin
 if operation not in ('operator_members','operator_member_state','operator_invite_policy') then return app_private.report_api(operation,payload);end if;
 if operation<>'operator_members' then
  target:=(payload->>'account_id')::uuid;
  -- Multiple account parents use stable order, including the operator parent.
  perform 1 from app_private.members where account_id in (auth.uid(),target) order by account_id for update;
 end if;
 uid:=app_private.require_operator();
 if operation='operator_members' then
  select coalesce(jsonb_agg(x order by x.account_id),'[]'::jsonb) into result from (
   select m.account_id,m.active,m.withdrawn_at,coalesce(p.display_name,'名前未設定') display_name,
    coalesce(ip.weekly_limit,5) weekly_limit,coalesce(ip.paused,false) invite_paused,
    case when cr.until_at>clock_timestamp() then cr.until_at end chat_restricted_until
   from app_private.members m left join app_private.profiles p on p.account_id=m.account_id
    left join app_private.invite_policies ip on ip.account_id=m.account_id
    left join app_private.chat_restrictions cr on cr.account_id=m.account_id
   where payload->>'after' is null or m.account_id>(payload->>'after')::uuid
   order by m.account_id limit 100
  )x;
  return jsonb_build_object('items',result);
 end if;
 reason:=btrim(payload->>'reason');
 if target is null or reason is null or char_length(reason) not between 1 and 500 then raise exception 'invalid_input';end if;
 perform 1 from app_private.members where account_id=target;
 if not found then raise exception 'not_found';end if;
 if operation='operator_member_state' then
  active:=(payload->>'active')::boolean;
  if active is null or target=uid or exists(select 1 from app_private.members where account_id=target and withdrawn_at is not null) then raise exception 'invalid_input';end if;
  update app_private.members m set active=(payload->>'active')::boolean where m.account_id=target and m.active is distinct from (payload->>'active')::boolean;
  if found then insert into app_private.operator_audit(actor,action,target,reason) values(uid,case when active then 'member_restore' else 'member_stop' end,target,reason);end if;
 else
  lim:=(payload->>'weekly_limit')::integer;paused:=(payload->>'paused')::boolean;
  if lim is null or lim not between 0 and 1000 or paused is null then raise exception 'invalid_input';end if;
  insert into app_private.invite_policies(account_id,weekly_limit,paused) values(target,lim,paused)
   on conflict(account_id) do update set weekly_limit=excluded.weekly_limit,paused=excluded.paused;
  insert into app_private.operator_audit(actor,action,target,reason) values(uid,'invite_policy',target,reason);
 end if;
 return '{"updated":true}'::jsonb;
end $$;
commit;
