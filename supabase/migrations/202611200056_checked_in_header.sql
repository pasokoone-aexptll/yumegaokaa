begin;
-- The header reflects all active visits, independently of the ten-minute map
-- observations. Only anonymous pool images and expiry groups leave the server.
-- Ghost membership remains included in the existing street headcount; no names,
-- account IDs, per-user flags, or coordinates are added to the header payload.
alter function app_private.street_api(text,jsonb) rename to street_api_before_header;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; st uuid; t timestamptz; person uuid; groups jsonb;
begin
 result:=app_private.street_api_before_header(operation,payload);
 if operation<>'get_presence_snapshot' then return result;end if;
 st:=(payload->>'street_id')::uuid;
 t:=(result->>'server_time')::timestamptz;
 for person in select distinct v.account_id from app_private.visits v
  join app_private.members m on m.account_id=v.account_id and m.active
  where v.street_id=st and v.ended_at is null and v.expires_at>t order by v.account_id
 loop perform app_private.my_daily_icon(person,st,t);end loop;
 select coalesce(jsonb_agg(jsonb_build_object('expires_at',expires_at,'icons',icons) order by expires_at),'[]'::jsonb)
 into groups from (
  select v.expires_at,jsonb_agg(i.path order by i.path nulls last) icons
  from app_private.visits v join app_private.members m on m.account_id=v.account_id and m.active
  left join app_private.daily_street_icons d on d.account_id=v.account_id and d.street_id=st and d.day=(t at time zone 'Asia/Tokyo')::date
  left join app_private.street_icons i on i.id=d.icon_id and i.active and i.removed_at is null
   and exists(select 1 from app_private.members owner where owner.account_id=i.owner_id and owner.active)
  where v.street_id=st and v.ended_at is null and v.expires_at>t group by v.expires_at
 ) header;
 return result||jsonb_build_object('checked_in_icon_groups',groups);
end $$;
revoke all on function app_private.street_api(text,jsonb),app_private.street_api_before_header(text,jsonb) from public,anon,authenticated;
commit;
