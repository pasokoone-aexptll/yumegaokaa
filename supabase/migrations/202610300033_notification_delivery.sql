begin;
alter table app_private.notification_outbox
 add column lease uuid,
 add column lease_until timestamptz,
 add column simulated_at timestamptz;

create function app_private.notification_sendable(nid uuid, t timestamptz)
returns boolean language sql stable set search_path='' as $$
 select exists (
  select 1 from app_private.notifications n
  join app_private.events e on e.id=n.event_id
  join app_private.members m on m.account_id=n.recipient
  join app_private.registrations r on r.event_id=e.id and r.account_id=n.recipient
  where n.id=nid and m.active and m.withdrawn_at is null and r.joined
  and ((n.kind='changed' and e.canceled_at is null and e.ends_at>t)
    or (n.kind='canceled' and e.canceled_at is not null and e.canceled_at+interval '24 hours'>t))
  and not exists(select 1 from app_private.notifications newer
    where newer.event_id=n.event_id and newer.recipient=n.recipient
    and newer.event_revision>n.event_revision)
 )
$$;
revoke all on function app_private.notification_sendable(uuid,timestamptz) from public,anon,authenticated;

-- Local simulation only. A simulated result must never masquerade as APNs delivery.
create function public.notification_delivery(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare job app_private.notification_outbox%rowtype; n app_private.notifications%rowtype;
 t timestamptz:=clock_timestamp();
begin
 if auth.role() is distinct from 'service_role' then raise exception 'unauthorized';end if;
 if operation='claim' then
  delete from app_private.notification_outbox o
   where not app_private.notification_sendable(o.notification_id,t);
  select * into job from app_private.notification_outbox o
   where o.delivered_at is null and o.simulated_at is null and o.next_attempt_at<=t
   and (o.lease_until is null or o.lease_until<=t)
   order by o.next_attempt_at,o.notification_id for update skip locked limit 1;
  if not found then return '{}'::jsonb;end if;
  update app_private.notification_outbox set lease=gen_random_uuid(),lease_until=t+interval '1 minute',attempts=attempts+1
   where notification_id=job.notification_id returning * into job;
 else
  select * into job from app_private.notification_outbox
   where notification_id=(payload->>'id')::uuid and lease=(payload->>'lease')::uuid
   and lease_until>t and simulated_at is null and delivered_at is null for update;
  if not found then return '{"active":false}'::jsonb;end if;
 end if;
 if not app_private.notification_sendable(job.notification_id,clock_timestamp()) then
  delete from app_private.notification_outbox where notification_id=job.notification_id;
  return '{"active":false}'::jsonb;
 end if;
 if operation in ('claim','recheck') then
  select * into n from app_private.notifications where id=job.notification_id;
  -- No names, event text, coordinates or participant list in the delivery payload.
  return jsonb_build_object('active',true,'id',n.id,'lease',job.lease,
   'event_id',n.event_id,'recipient',n.recipient,'kind',n.kind);
 elsif operation='simulate' then
  update app_private.notification_outbox set simulated_at=t,lease=null,lease_until=null
   where notification_id=job.notification_id;
  return '{"simulated":true}'::jsonb;
 elsif operation='retry' then
  update app_private.notification_outbox set lease=null,lease_until=null,
   next_attempt_at=t+make_interval(secs=>least(300,30*least(attempts,10)))
   where notification_id=job.notification_id;
  return '{"retry":true}'::jsonb;
 end if;
 raise exception 'invalid_input';
end $$;
revoke all on function public.notification_delivery(text,jsonb) from public,anon,authenticated;
grant execute on function public.notification_delivery(text,jsonb) to service_role;
commit;
