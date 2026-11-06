begin;
alter function app_private.street_api(text,jsonb) rename to before_entry_map_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare config jsonb; info jsonb;
begin
 if operation <> 'get_entry_map' then
   return app_private.before_entry_map_api(operation,payload);
 end if;
 -- Reuse the session and membership checks of the existing config endpoint.
 config := app_private.before_entry_map_api('get_street_config',payload);
 select jsonb_build_object('name',s.name,'boundary',extensions.st_asgeojson(
   extensions.st_transform(a.polygon,'+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs','+proj=longlat +datum=WGS84 +no_defs'))::jsonb,
   'places',coalesce((select jsonb_agg(jsonb_build_object('title',p.title,'longitude',p.longitude,'latitude',p.latitude) order by p.title,p.tag_id)
     from app_private.placements p join app_private.tags t on t.id=p.tag_id
     where p.street_id=s.id and t.active and not t.retired),'[]'::jsonb))
 into info from app_private.streets s join app_private.areas a on a.street_id=s.id and a.version=s.area_version
 where s.id=(config->>'street_id')::uuid;
 return coalesce(info,jsonb_build_object('name',config->>'name','boundary',null,'places','[]'::jsonb));
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
