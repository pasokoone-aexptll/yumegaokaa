begin;
create table app_private.reports(
 id uuid primary key default gen_random_uuid(),reporter uuid not null references app_private.members,
 target_kind text not null check(target_kind in ('message','recruitment','event')),target_id uuid not null,
 subject_id uuid not null,reason text not null check(reason in ('spam','harassment','other')),
 description text not null check(char_length(description)<=1000),evidence jsonb not null,
 created_at timestamptz not null default clock_timestamp(),resolved_at timestamptz,resolution text
);
create unique index report_open_once on app_private.reports(reporter,target_kind,target_id) where resolved_at is null;
revoke all on app_private.reports from public,anon,authenticated;
alter function app_private.street_api(text,jsonb) rename to operator_api;
create function app_private.street_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
<<api>>
declare uid uuid:=auth.uid();sid uuid:=(auth.jwt()->>'session_id')::uuid;t timestamptz:=clock_timestamp();
 target uuid;kind text;subject uuid;proof jsonb;r app_private.reports%rowtype;result jsonb;reason text;description text;
begin
 if operation not in ('report_create','operator_reports','operator_report_resolve','operator_message_delete') then return app_private.operator_api(operation,payload);end if;
 if operation<>'report_create' then
  uid:=app_private.require_operator();
  if operation='operator_reports' then
   select coalesce(jsonb_agg(x order by x.created_at),'[]'::jsonb) into result from(
    select rp.id,rp.target_kind,rp.target_id,rp.reason,rp.description,rp.evidence,rp.created_at,
     rp.created_at+interval '90 days'<=t as review_due
    from app_private.reports rp where rp.resolved_at is null and rp.created_at+interval '180 days'>t
    order by created_at limit 100
   )x;
   return jsonb_build_object('items',result);
  end if;
  select * into r from app_private.reports where id=(payload->>'id')::uuid for update;
  if not found or (r.resolved_at is null and r.created_at+interval '180 days'<=t) or r.resolved_at+interval '30 days'<=t then raise exception 'not_found';end if;
  if operation='operator_message_delete' then
   if r.target_kind<>'message' then raise exception 'invalid_input';end if;
   update app_private.messages set body=null,deleted_at=t where id=r.target_id and deleted_at is null;
   if found then insert into app_private.operator_audit(actor,action,target) values(uid,'message_delete',r.target_id);end if;
   return '{"deleted":true}'::jsonb;
  end if;
  reason:=payload->>'resolution';
  if reason is null or reason not in ('handled','no_action') then raise exception 'invalid_input';end if;
  if r.resolved_at is null then
   update app_private.reports set resolved_at=t,resolution=api.reason where id=r.id;
   insert into app_private.operator_audit(actor,action,target) values(uid,'report_resolve',r.id);
  end if;
  return '{"resolved":true}'::jsonb;
 end if;
 if uid is null or sid is null or not exists(select 1 from auth.sessions where id=sid and user_id=uid) then raise exception 'unauthorized';end if;
 perform 1 from app_private.members where account_id=uid and active for update;
 if not found then raise exception 'membership_required';end if;
 target:=(payload->>'target_id')::uuid;kind:=payload->>'target_kind';reason:=payload->>'reason';description:=coalesce(payload->>'description','');
 if kind is null or kind not in ('message','recruitment','event') or reason is null or reason not in ('spam','harassment','other') or char_length(description)>1000 then raise exception 'invalid_input';end if;
 select * into r from app_private.reports where reporter=uid and target_kind=kind and target_id=target and resolved_at is null;
 if found then return jsonb_build_object('id',r.id);end if;
 -- Bound evidence ingestion; no body is accepted from the reporting client.
 if(select count(*) from app_private.request_limits where account_id=uid and app_private.request_limits.kind='report' and at>t-interval '1 minute')>=10 then raise exception 'rate_limited';end if;
 if kind='message' then
  select author_id,jsonb_build_object('body',body,'created_at',created_at,'street_id',street_id)
   into subject,proof from app_private.messages where id=target and deleted_at is null and created_at>t-interval '30 days';
 elsif kind='event' then
  select host_id,jsonb_build_object('title',title,'description',e.description,'street_id',street_id,'starts_at',starts_at,'ends_at',ends_at)
   into subject,proof from app_private.events e where id=target and canceled_at is null and ends_at>t;
 else
  select v.account_id,jsonb_build_object('title',p.title,'street_id',v.street_id,'created_at',p.created_at)
   into subject,proof from app_private.recruitments p join app_private.visits v on v.id=p.visit_id
   where p.id=target and p.ended_at is null and p.expires_at>t and v.ended_at is null and v.expires_at>t;
 end if;
 if subject is null then raise exception 'not_found';end if;
 insert into app_private.reports(reporter,target_kind,target_id,subject_id,reason,description,evidence)
 values(uid,kind,target,subject,reason,description,proof) returning * into r;
 insert into app_private.request_limits values(uid,'report',t);
 return jsonb_build_object('id',r.id);
end $$;
revoke all on function app_private.street_api(text,jsonb) from public,anon,authenticated;
alter function app_private.cleanup() rename to cleanup_operators;
create function app_private.cleanup() returns void language plpgsql security definer set search_path='' as $$
begin
 perform app_private.cleanup_operators();
 delete from app_private.reports where (resolved_at is null and created_at+interval '180 days'<=clock_timestamp())
 or resolved_at+interval '30 days'<=clock_timestamp();
end $$;
revoke all on function app_private.cleanup() from public,anon,authenticated;
commit;
