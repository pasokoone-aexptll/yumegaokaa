begin;
-- Report the same sliding-week allowance that invite_create enforces.
alter function app_private.invitation_api(text,jsonb) rename to invitation_api_before_quota;
create function app_private.invitation_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; uid uuid:=auth.uid(); quota integer; paused boolean; used bigint;
begin
 result:=app_private.invitation_api_before_quota(operation,payload);
 if operation<>'invite_list' then return result;end if;
 select weekly_limit,ip.paused into quota,paused from app_private.invite_policies ip where account_id=uid;
 quota:=coalesce(quota,5);
 select count(*) into used from app_private.invitations where issuer=uid and created_at>clock_timestamp()-interval '7 days';
 return result||jsonb_build_object('remaining',case when coalesce(paused,false) then 0 else greatest(0,quota-used) end,'weekly_limit',quota,
  'issuer_name',(select display_name from app_private.profiles where account_id=uid));
end $$;
revoke all on function app_private.invitation_api(text,jsonb) from public,anon,authenticated;
commit;
