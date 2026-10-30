begin;
alter function app_private.street_api(text,jsonb) rename to account_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid;street uuid;d app_private.sticker_drafts%rowtype;name text;lon double precision;lat double precision;
begin
 if operation not in ('sticker_edit','sticker_cancel') then return app_private.account_api(operation,payload);end if;
 uid:=app_private.require_operator();
 select street_id into street from app_private.sticker_drafts where id=(payload->>'id')::uuid;
 if street is null then
  if operation='sticker_cancel' then return '{"canceled":true}'::jsonb;end if;
  raise exception 'not_found';
 end if;
 perform 1 from app_private.streets where id=street for update;
 select * into d from app_private.sticker_drafts where id=(payload->>'id')::uuid for update;
 if not found then raise exception 'not_found';end if;
 if d.phase='published' or d.updated_at<=clock_timestamp()-interval '7 days' then raise exception 'conflict';end if;
 if (payload->>'revision')::bigint is distinct from d.revision then raise exception 'conflict';end if;
 perform 1 from app_private.tags where id=d.tag_id and revision=d.tag_revision and not retired and not active for update;
 if not found then raise exception 'tag_changed';end if;
 if operation='sticker_cancel' then
  -- A moved installation remains suspended. A never-published ID is retired.
  update app_private.tags set revision=revision+1,retired=not exists(select 1 from app_private.placements where tag_id=d.tag_id) where id=d.tag_id;
  delete from app_private.sticker_drafts where id=d.id;
  insert into app_private.operator_audit(actor,action,target) values(uid,'sticker_cancel',d.tag_id);
  return '{"canceled":true}'::jsonb;
 end if;
 name:=btrim(payload->>'title');lon:=(payload->>'longitude')::double precision;lat:=(payload->>'latitude')::double precision;
 if name is null or char_length(name) not between 1 and 50 or lon is null or lon not between -180 and 180 or lat is null or lat not between -90 and 90 then raise exception 'invalid_input';end if;
 update app_private.sticker_drafts set title=name,longitude=lon,latitude=lat,
  phase=case when phase='installed' and (longitude<>lon or latitude<>lat) then 'verified' else phase end,
  revision=revision+1,updated_at=clock_timestamp() where id=d.id returning * into d;
 insert into app_private.operator_audit(actor,action,target) values(uid,'sticker_edit',d.tag_id);
 return to_jsonb(d);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
commit;
