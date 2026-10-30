begin;
alter table app_private.sticker_drafts add column replaces_tag uuid references app_private.tags;
create unique index sticker_one_replacement on app_private.sticker_drafts(replaces_tag) where phase<>'published';
create or replace function app_private.execute_command(kind text,body jsonb,actor uuid,t timestamptz,command_id uuid)
returns jsonb language plpgsql set search_path='' as $$
declare replacement uuid;street uuid;tag uuid;title text;lon double precision;lat double precision;draft_id uuid;tag_rev bigint;phase text:='draft';
begin
 if kind<>'sticker_create' then return app_private.execute_pin_command(kind,body,actor,t,command_id);end if;
 perform app_private.require_operator();
 street:=(body->>'street_id')::uuid;title:=btrim(body->>'title');lon:=(body->>'longitude')::double precision;lat:=(body->>'latitude')::double precision;
 if title is null or char_length(title) not between 1 and 50 or lon is null or lon not between -180 and 180 or lat is null or lat not between -90 and 90 then raise exception 'invalid_input';end if;
 perform 1 from app_private.streets where id=street for update;if not found then raise exception 'not_found';end if;
 tag:=(body->>'tag_id')::uuid;
 replacement:=(body->>'replaces_tag')::uuid;
 if replacement is not null then
  if tag is not null then raise exception 'invalid_input';end if;
  perform 1 from app_private.tags tg join app_private.placements p on p.tag_id=tg.id where tg.id=replacement and tg.street_id=street and not tg.retired for update of tg;
  if not found then raise exception 'not_found';end if;
 end if;
 if exists(select 1 from app_private.sticker_drafts d where d.phase<>'published' and (d.tag_id=coalesce(replacement,tag) or d.replaces_tag=coalesce(replacement,tag))) then raise exception 'conflict';end if;
 if tag is null then
  tag:=gen_random_uuid();tag_rev:=1;
  insert into app_private.tags(id,street_id) values(tag,street);
 else
  select revision into tag_rev from app_private.tags where id=tag and street_id=street and not retired for update;
  if not found then raise exception 'not_found';end if;
  -- Moving an existing sticker stops new check-ins before physical work.
  update app_private.tags set active=false,revision=revision+1 where id=tag returning revision into tag_rev;
  phase:='written';
 end if;
 insert into app_private.sticker_drafts(tag_id,street_id,creator,title,longitude,latitude,phase,tag_revision,replaces_tag)
 values(tag,street,actor,title,lon,lat,phase,tag_rev,replacement) returning id into draft_id;
 insert into app_private.operator_audit(actor,action,target) values(actor,'sticker_prepare',tag);
 return jsonb_build_object('id',draft_id,'tag_id',tag);
end $$;
create or replace function app_private.area_publication_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid;street uuid;version bigint;ids uuid[];selected jsonb;hull extensions.geometry;
 publication app_private.area_publications%rowtype;draft_row app_private.sticker_drafts%rowtype;t timestamptz:=clock_timestamp();result jsonb;tag uuid;
begin
 if operation not in ('sticker_preview','sticker_publish','sticker_suspend','placement_list') then return app_private.sticker_preparation_api(operation,payload);end if;
 uid:=app_private.require_operator();
 if operation='sticker_publish' then
  select street_id into street from app_private.area_publications where id=(payload->>'id')::uuid and operator_id=uid;
 elsif operation='sticker_suspend' then
  select street_id into street from app_private.tags where id=(payload->>'tag_id')::uuid;
 else street:=(payload->>'street_id')::uuid;end if;
 select area_version into version from app_private.streets where id=street for update;
 if not found then raise exception 'not_found';end if;
 t:=clock_timestamp();
 if operation='placement_list' then
  select coalesce(jsonb_agg(x order by x.title),'[]'::jsonb) into result from(
   select p.tag_id,p.title,p.longitude,p.latitude,t.active,t.retired,t.revision from app_private.placements p join app_private.tags t on t.id=p.tag_id where p.street_id=street
  )x;return jsonb_build_object('items',result,'area_version',version);
 elsif operation='sticker_suspend' then
  tag:=(payload->>'tag_id')::uuid;
  perform 1 from app_private.tags where id=tag and revision=(payload->>'revision')::bigint for update;
  if not found then raise exception 'conflict';end if;
  update app_private.tags set active=false,revision=revision+1 where id=tag;
  insert into app_private.operator_audit(actor,action,target) values(uid,'sticker_suspend',tag);
  return jsonb_build_object('suspended',true,'area_version',version);
 elsif operation='sticker_preview' then
  if jsonb_typeof(payload->'draft_ids') is distinct from 'array' then raise exception 'invalid_input';end if;
  select coalesce(array_agg(distinct v::uuid),'{}'::uuid[]) into ids from jsonb_array_elements_text(payload->'draft_ids') x(v);
  if cardinality(ids)>100 then raise exception 'invalid_input';end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'revision',revision,'tag_id',tag_id,'tag_revision',tag_revision,'replaces_tag',replaces_tag,'replacement_revision',(select revision from app_private.tags where id=replaces_tag)) order by id),'[]'::jsonb)
  into selected from app_private.sticker_drafts where id=any(ids) and street_id=street and phase='installed' and updated_at>t-interval '7 days';
  if jsonb_array_length(selected)<>cardinality(ids) then raise exception 'conflict';end if;
  if exists(select 1 from app_private.sticker_drafts d join app_private.tags t on t.id=d.tag_id where d.id=any(ids) and (t.retired or t.active or t.revision<>d.tag_revision)) then raise exception 'tag_changed';end if;
  if exists(select 1 from app_private.sticker_drafts d left join app_private.tags old on old.id=d.replaces_tag where d.id=any(ids) and d.replaces_tag is not null and (old.id is null or old.retired)) then raise exception 'tag_changed';end if;
  with points as(
   select p.longitude,p.latitude from app_private.placements p join app_private.tags tg on tg.id=p.tag_id
   where p.street_id=street and tg.active and not tg.retired and not exists(select 1 from app_private.sticker_drafts d where d.id=any(ids) and (d.tag_id=p.tag_id or d.replaces_tag=p.tag_id))
   union all select longitude,latitude from app_private.sticker_drafts where id=any(ids)
  ) select extensions.st_convexhull(extensions.st_collect(extensions.st_transform(extensions.st_makepoint(longitude,latitude),'+proj=longlat +datum=WGS84 +no_defs','+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs'))) into hull from points;
  if hull is null or extensions.geometrytype(hull)<>'POLYGON' or not extensions.st_isvalid(hull) or extensions.st_area(hull)<=0 then
   return jsonb_build_object('valid',false,'area_version',version);
  end if;
  insert into app_private.area_publications(street_id,operator_id,base_version,drafts,active_tags,polygon) values(street,uid,version,selected,(select coalesce(jsonb_agg(jsonb_build_array(id,revision) order by id),'[]'::jsonb) from app_private.tags where street_id=street and active),hull) returning * into publication;
  return jsonb_build_object('valid',true,'id',publication.id,'area_version',version,'boundary',extensions.st_asgeojson(extensions.st_transform(hull,'+proj=tmerc +lat_0=36 +lon_0=139.8333333333333 +k_0=0.9999 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs','+proj=longlat +datum=WGS84 +no_defs'))::jsonb);
 end if;
 select * into publication from app_private.area_publications where id=(payload->>'id')::uuid and operator_id=uid for update;
 if publication.published_version is not null then return jsonb_build_object('area_version',publication.published_version);end if;
 if publication.accept_until<=t then raise exception 'attempt_expired';end if;
 if publication.base_version<>version then raise exception 'area_changed';end if;
 -- The street parent serializes all tag preparation, suspension and publication.
 for draft_row in select dd.* from app_private.sticker_drafts dd join jsonb_array_elements(publication.drafts) x on dd.id=(x->>'id')::uuid order by dd.id for update of dd loop
  if draft_row.phase<>'installed' or draft_row.updated_at<=t-interval '7 days' or not exists(select 1 from jsonb_array_elements(publication.drafts) x where (x->>'id')::uuid=draft_row.id and (x->>'revision')::bigint=draft_row.revision) then raise exception 'conflict';end if;
  perform 1 from app_private.tags where id=draft_row.tag_id and revision=draft_row.tag_revision and not retired and not active for update;
  if not found then raise exception 'tag_changed';end if;
  if draft_row.replaces_tag is not null then
   perform 1 from app_private.tags old where old.id=draft_row.replaces_tag and not old.retired and old.revision=(select (x->>'replacement_revision')::bigint from jsonb_array_elements(publication.drafts) x where (x->>'id')::uuid=draft_row.id) for update;
   if not found then raise exception 'tag_changed';end if;
  end if;
 end loop;
 if (select count(*) from app_private.sticker_drafts where id in(select (x->>'id')::uuid from jsonb_array_elements(publication.drafts) x))<>jsonb_array_length(publication.drafts) then raise exception 'conflict';end if;
 -- A suspension after preview changes a tag revision even when no selected draft references it.
 -- Recompute the candidate through a fingerprint of all active tags, below.
 if (select coalesce(jsonb_agg(jsonb_build_array(id,revision) order by id),'[]'::jsonb) from app_private.tags where street_id=street and active) is distinct from publication.active_tags then raise exception 'tag_changed';end if;
 for draft_row in select * from app_private.sticker_drafts where id in(select (x->>'id')::uuid from jsonb_array_elements(publication.drafts) x) loop
  if draft_row.replaces_tag is not null then
   update app_private.tags set active=false,retired=true,revision=revision+1 where id=draft_row.replaces_tag;
   insert into app_private.operator_audit(actor,action,target) values(uid,'sticker_retire',draft_row.replaces_tag);
  end if;
  update app_private.tags set active=true,revision=revision+1 where id=draft_row.tag_id;
  insert into app_private.placements(tag_id,street_id,title,longitude,latitude,installed_at,revision)
  values(draft_row.tag_id,street,draft_row.title,draft_row.longitude,draft_row.latitude,t,draft_row.tag_revision+1)
  on conflict(tag_id) do update set title=excluded.title,longitude=excluded.longitude,latitude=excluded.latitude,installed_at=excluded.installed_at,revision=excluded.revision;
  update app_private.sticker_drafts set phase='published',revision=revision+1,updated_at=t where id=draft_row.id;
 end loop;
 insert into app_private.areas(street_id,version,polygon) values(street,version+1,publication.polygon);
 update app_private.streets set area_version=version+1 where id=street;
 update app_private.area_publications set published_version=version+1 where id=publication.id;
 insert into app_private.operator_audit(actor,action,target) values(uid,'area_publish',street);
 perform realtime.send('{}'::jsonb,'changed','street:'||street::text,true);
 return jsonb_build_object('area_version',version+1);
end $$;
commit;
