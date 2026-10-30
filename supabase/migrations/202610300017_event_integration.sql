begin;
create or replace function app_private.event_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;t timestamptz;e app_private.events%rowtype;r app_private.registrations%rowtype;result jsonb;desired boolean;expected bigint;new_start timestamptz;new_end timestamptz;lon double precision;lat double precision;cap integer;important boolean;
begin
 if operation not in ('event_list','event_get','event_register','event_edit','event_cancel','event_roster','notification_list','notification_read') then return app_private.command_api(operation,payload);end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;t:=clock_timestamp();
 if operation='event_list' then
  select coalesce(jsonb_agg(app_private.event_view(x.id,uid,t) order by x.starts_at),'[]'::jsonb) into result from app_private.events x
  where x.street_id=(payload->>'street_id')::uuid and x.ends_at>t and x.canceled_at is null
  and (coalesce((payload->>'mine_only')::boolean,false)=false or exists(select 1 from app_private.registrations rr where rr.event_id=x.id and rr.account_id=uid and rr.joined));
  return jsonb_build_object('items',result,'server_time',t);
 elsif operation='notification_list' then
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'event_id',n.event_id,'kind',n.kind,'title',ev.title,'created_at',n.created_at,'read',n.read_at is not null) order by n.created_at desc),'[]'::jsonb) into result
  from app_private.notifications n join app_private.events ev on ev.id=n.event_id where n.recipient=uid and coalesce(ev.canceled_at,ev.ends_at)+interval '24 hours'>t;
  return jsonb_build_object('items',result);
 elsif operation='notification_read' then
  update app_private.notifications set read_at=coalesce(read_at,t) where id=(payload->>'id')::uuid and recipient=uid;
  if not found then raise exception 'not_found';end if;return '{"read":true}'::jsonb;
 end if;
 select * into e from app_private.events where id=(payload->>'id')::uuid for update;
 if not found then raise exception 'not_found';end if;
 if operation='event_cancel' and e.host_id=uid and e.canceled_at is not null and (payload->>'revision')::bigint+1=e.revision then return jsonb_build_object('id',e.id,'revision',e.revision);end if;
 if e.ends_at<=t or e.canceled_at is not null then raise exception 'not_found';end if;
 if operation='event_get' then return app_private.event_view(e.id,uid,t);end if;
 if operation='event_register' then
  desired:=(payload->>'joined')::boolean;expected:=(payload->>'revision')::bigint;
  if desired is null or expected is null or expected<0 then raise exception 'invalid_input';end if;
  select * into r from app_private.registrations where event_id=e.id and account_id=uid;
  if found and r.revision=expected+1 and r.joined=desired then return app_private.event_view(e.id,uid,t);end if;
  if coalesce(r.revision,0)<>expected then raise exception 'conflict';end if;
  if desired and not coalesce(r.joined,false) and (select count(*) from app_private.registrations where event_id=e.id and joined)>=e.capacity then raise exception 'conflict';end if;
  insert into app_private.registrations(event_id,account_id,joined,revision) values(e.id,uid,desired,expected+1)
  on conflict(event_id,account_id) do update set joined=excluded.joined,revision=excluded.revision;
  if not desired then delete from app_private.notifications where event_id=e.id and recipient=uid;end if;
  return app_private.event_view(e.id,uid,t);
 end if;
 if e.host_id<>uid then
  if operation='event_roster' then perform app_private.require_operator();else raise exception 'membership_required';end if;
 end if;
 if operation='event_roster' then
  select coalesce(jsonb_agg(jsonb_build_object('account_id',rr.account_id,'display_name',coalesce(p.display_name,'名前未設定'))),'[]'::jsonb) into result from app_private.registrations rr left join app_private.profiles p on p.account_id=rr.account_id where rr.event_id=e.id and rr.joined;
  return jsonb_build_object('items',result);
 end if;
 if (payload->>'revision')::bigint is distinct from e.revision then raise exception 'conflict';end if;
 if operation='event_cancel' then
  update app_private.events set canceled_at=t,revision=revision+1 where id=e.id;
  delete from app_private.notifications where event_id=e.id;
  important:=true;
 else
  new_start:=(payload->>'starts_at')::timestamptz;new_end:=(payload->>'ends_at')::timestamptz;lon:=(payload->>'longitude')::double precision;lat:=(payload->>'latitude')::double precision;cap:=(payload->>'capacity')::integer;
  if new_start is null or new_end is null or not isfinite(new_start) or not isfinite(new_end) or new_end<=greatest(new_start,t) or new_end>new_start+interval '24 hours' or new_start>t+interval '90 days' or (e.starts_at>t and new_start<t) or cap is null or cap not between 1 and 100 or cap<(select count(*) from app_private.registrations where event_id=e.id and joined) or not app_private.inside_street(e.street_id,lon,lat) or payload->>'title' is null or char_length(btrim(payload->>'title')) not between 1 and 50 or char_length(coalesce(payload->>'description',''))>1000 then raise exception 'invalid_input';end if;
  if e.starts_at<=t and (new_start is distinct from e.starts_at or lon is distinct from e.longitude or lat is distinct from e.latitude or cap is distinct from e.capacity or payload->>'title' is distinct from e.title or coalesce(payload->>'description','') is distinct from e.description) then raise exception 'invalid_input';end if;
  important:=new_start<>e.starts_at or new_end<>e.ends_at or lon<>e.longitude or lat<>e.latitude;
  update app_private.events set title=btrim(payload->>'title'),description=coalesce(payload->>'description',''),starts_at=new_start,ends_at=new_end,longitude=lon,latitude=lat,capacity=cap,revision=revision+1 where id=e.id;
 end if;
 if important then
  insert into app_private.notifications(event_id,event_revision,recipient,kind)
  select e.id,e.revision+1,rr.account_id,case when operation='event_cancel' then 'canceled' else 'changed' end from app_private.registrations rr where rr.event_id=e.id and rr.joined;
  insert into app_private.notification_outbox(notification_id) select id from app_private.notifications where event_id=e.id and event_revision=e.revision+1;
 end if;
 return jsonb_build_object('id',e.id,'revision',e.revision+1);
end $$;
commit;
