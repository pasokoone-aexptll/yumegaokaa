begin;
-- Keep the existing consent gate and require server-verified operator MFA.
alter function app_private.report_api(text,jsonb) rename to report_api_before_pin_moderation;
create function app_private.report_api(operation text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid; r app_private.reports%rowtype; p app_private.denshin_pins%rowtype;
 t timestamptz:=clock_timestamp();
begin
 if operation<>'operator_denshin_delete' then
  return app_private.report_api_before_pin_moderation(operation,payload);
 end if;
 actor:=app_private.require_operator();
 select * into r from app_private.reports where id=(payload->>'id')::uuid;
 if not found or r.target_kind<>'denshin' or
  (r.resolved_at is null and r.created_at+interval '180 days'<=t) or
  r.resolved_at+interval '30 days'<=t then raise exception 'not_found';end if;
 -- Match member -> PIN ordering used by editing, suspension and withdrawal.
 perform 1 from app_private.members where account_id=r.subject_id for update;
 select * into p from app_private.denshin_pins where id=r.target_id for update;
 if not found then return '{"deleted":true}'::jsonb;end if;
 if p.deleted_at is null or p.body<>'削除済み' then
  if p.deleted_at is null and p.expires_at>t then
   perform app_private.denshin_notify(p.id,p.revision+1,'pin_closed',t);
  end if;
  update app_private.denshin_pins set body='削除済み',deleted_at=coalesce(deleted_at,t),
   recruiting=false,host_arrived=false,revision=revision+1 where id=p.id;
  update app_private.denshin_attendance set state='left',revision=revision+1,updated_at=t
   where pin_id=p.id and state<>'left';
  insert into app_private.operator_audit(actor,action,target) values(actor,'denshin_delete',p.id);
 end if;
 return '{"deleted":true}'::jsonb;
end $$;
revoke all on function app_private.report_api(text,jsonb),app_private.report_api_before_pin_moderation(text,jsonb) from public,anon,authenticated;
commit;
