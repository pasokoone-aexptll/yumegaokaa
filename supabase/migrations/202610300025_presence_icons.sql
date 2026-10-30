begin;
alter function app_private.street_api(text,jsonb) rename to icon_enrollment_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare st app_private.streets%rowtype;t timestamptz;account uuid;cells jsonb;checked integer;present integer;
projection constant text := '+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs';
begin
 if operation<>'get_presence_snapshot' then return app_private.icon_enrollment_api(operation,payload);end if;
 if not public.avatar_member() then raise exception 'membership_required';end if;
 select * into st from app_private.streets where id=(payload->>'street_id')::uuid;
 if not found then raise exception 'not_found';end if;
 t:=clock_timestamp();
 -- Allocate privately, in a consistent order. The public aggregate exposes only images.
 for account in select distinct v.account_id from app_private.visits v
  join app_private.presence p on p.visit_id=v.id join app_private.members m on m.account_id=v.account_id
  where v.street_id=st.id and m.active and v.ended_at is null and v.expires_at>t and p.expires_at>t
  order by v.account_id
 loop perform app_private.my_daily_icon(account,st.id,t);end loop;
 -- Counts, expiry groups and image slots are derived from one SQL snapshot.
  with live as (
   select p.*,vv.street_id, vv.account_id from app_private.presence p join app_private.visits vv on vv.id=p.visit_id
   join app_private.members mm on mm.account_id=vv.account_id
   where vv.street_id=st.id and mm.active and vv.ended_at is null and vv.expires_at>t and p.expires_at>t
  ), illustrated as (
   select l.*,i.path icon_path from live l
   left join app_private.daily_street_icons d on d.account_id=l.account_id and d.street_id=l.street_id and d.day=(t at time zone 'Asia/Tokyo')::date
   left join app_private.street_icons i on i.id=d.icon_id and i.active and i.removed_at is null
     and exists(select 1 from app_private.members owner where owner.account_id=i.owner_id and owner.active)
  ), buckets as (
   select grid_version,area_version,cell_id,expires_at,count(*) n,jsonb_agg(icon_path order by icon_path) icons from illustrated group by 1,2,3,4
  ), groups as (
   select grid_version,area_version,cell_id,sum(n)::int n,
   jsonb_agg(jsonb_build_object('expires_at',expires_at,'count',n,'icons',icons) order by expires_at) expiry_groups
   from buckets group by 1,2,3
  ), located as (
   select g.*,extensions.st_transform(extensions.st_pointonsurface(extensions.st_intersection(ar.polygon,
     extensions.st_makeenvelope(split_part(cell_id,':',1)::int*100,split_part(cell_id,':',2)::int*100,
     split_part(cell_id,':',1)::int*100+100,split_part(cell_id,':',2)::int*100+100))),projection,'+proj=longlat +datum=WGS84 +no_defs') anchor
   from groups g join app_private.areas ar on ar.street_id=st.id and ar.version=g.area_version
  ) select
   (select count(*) from app_private.visits vv join app_private.members mm on mm.account_id=vv.account_id
     where vv.street_id=st.id and mm.active and vv.ended_at is null and vv.expires_at>t),
   (select count(*) from live),
   coalesce((select jsonb_agg(jsonb_build_object('grid_version',grid_version::text,'area_version',area_version::text,
    'cell_id',cell_id,'count',n,'expiry_groups',expiry_groups,'anchor',jsonb_build_object('longitude',extensions.st_x(anchor),'latitude',extensions.st_y(anchor)))) from located),'[]'::jsonb)
   into checked,present,cells;
  return jsonb_build_object('server_time',t,'street_id',st.id,'checked_in_count',checked,'presence_count',present,'cells',cells);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
