// One-time reset approved 2026-11-25. Defaults to a rollback-only rehearsal.
// Credentials and user identifiers never enter stdout or the evidence file.
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
const ref = 'kchsbjayfdwjjbevqlop';
const execute = process.argv.includes('--execute-approved-reset');
const resume = process.argv.includes('--resume-barrier');
if (execute && existsSync('/private/tmp/denshin-reset-result.json')) throw Error('This reset has already completed. Do not delete newly recreated accounts.');
const preserved = ['area_publications','areas','placements','registration_policy','sticker_drafts','streets','tags'];
const cleared = ['account_cleanup_jobs','arrival_logs','attempts','blocks','chat_restrictions','commands','current_invitation_qr','daily_street_icons','denshin_attendance','denshin_daily_usage','denshin_pins','events','field_trial_grant','icon_enrollments','invitations','invite_policies','members','message_mentions','messages','notification_outbox','notifications','operator_audit','operators','presence','profiles','push_attempts','push_devices','recruitments','registration_declarations','registrations','reports','request_limits','street_icons','visit_counts','visits','withdrawal_requests'];
const all = [...preserved,...cleared].sort();
const sqlPath = `/private/tmp/denshin-reset-${process.pid}.sql`;
function query(sql) {
  writeFileSync(sqlPath, sql, {mode:0o600});
  try {
    return JSON.parse(execFileSync('npx',['supabase','db','query','--linked','--project-ref',ref,'--file',sqlPath],{encoding:'utf8',stdio:['ignore','pipe','pipe']})).rows;
  } catch { throw Error('Database operation failed; inspect maintenance state before retrying.'); }
  finally { unlinkSync(sqlPath); }
}
const fingerprint = `select jsonb_build_object(${preserved.map(t=>`'${t}',(select jsonb_build_object('count',count(*),'hash',md5(coalesce(jsonb_agg(${t==='sticker_drafts'?"to_jsonb(t)-'creator'":t==='area_publications'?"to_jsonb(t)-'operator_id'":"to_jsonb(t)"} order by to_jsonb(t)->>'id')::text,'[]'))) from app_private.${t} t)`).join(',')}) as value;`;
const truncate = `truncate table ${cleared.map(t=>'app_private.'+t).join(',')};
-- No old user ID is retained as the installation owner. New verified operator claims these.
update app_private.sticker_drafts set creator='00000000-0000-0000-0000-000000000000';
update app_private.area_publications set operator_id='00000000-0000-0000-0000-000000000000';`;
const barrier = `create function app_private.reset_maintenance_guard() returns trigger language plpgsql set search_path='' as $$begin
 if current_setting('app.reset_authorized',true) is distinct from '20261125' then raise exception 'maintenance_in_progress'; end if;
 if TG_OP='DELETE' then return old; end if; return new;
end$$;
revoke all on function app_private.reset_maintenance_guard() from public,anon,authenticated;
${all.map(t=>`create trigger reset_maintenance before insert or update or delete on app_private.${t} for each row execute function app_private.reset_maintenance_guard();`).join('\n')}
create trigger reset_maintenance before insert on auth.users for each statement execute function app_private.reset_maintenance_guard();
create trigger reset_maintenance before insert or update on storage.objects for each statement execute function app_private.reset_maintenance_guard();`;
const unblock = `${all.map(t=>`drop trigger reset_maintenance on app_private.${t};`).join('\n')}
drop trigger reset_maintenance on auth.users;
drop trigger reset_maintenance on storage.objects;
drop function app_private.reset_maintenance_guard();`;
const tx = body=>`begin; set local lock_timeout='10s'; set local statement_timeout='45s'; ${body}`;
const tables = query("select tablename from pg_tables where schemaname='app_private' order by tablename;").map(r=>r.tablename);
if(JSON.stringify(tables)!==JSON.stringify(all)) throw Error('Schema changed; reset allowlist needs review.');
const before = query(fingerprint)[0].value;
if (!resume) {
const trial = query(tx(`${barrier} set local app.reset_authorized='20261125'; ${truncate} ${fingerprint} rollback;`))[0].value;
if(JSON.stringify(before)!==JSON.stringify(trial)) throw Error('Preserved settings differ in rehearsal.');
console.log('Rollback rehearsal passed: 36 user tables cleared, 7 installation/policy tables preserved.');
}
if(execute) {
  const keys=JSON.parse(execFileSync('npx',['supabase','projects','api-keys','--project-ref',ref,'-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  const key=keys.find(k=>k.name==='service_role')?.api_key;
  if(!key) throw Error('Missing admin key');
  async function api(path,method,body) {
    const r=await fetch(`https://${ref}.supabase.co${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
    if(!r.ok) throw Error(`Admin API failed: ${method} status ${r.status}`);
    return r.status===204?null:r.json();
  }
  // Freeze signup, all application writes (including workers), and image uploads.
  if (resume) {
    query(tx(`${unblock} ${barrier} commit;`));
  } else {
    writeFileSync('/private/tmp/denshin-reset-before.json',JSON.stringify(before),{mode:0o600});
    query(tx(`${barrier} commit;`));
  }
  console.log('Maintenance write barrier enabled.');
  // On failure deliberately leave the barrier in place: do not reopen a partial reset.
  const objects=query('select bucket_id,name from storage.objects order by bucket_id,name;');
  const users=query('select id from auth.users order by id;');
  if(users.length>8||objects.length>11||objects.some(o=>!['avatars','street-icons'].includes(o.bucket_id))) throw Error('Reset scope grew; maintenance remains enabled.');
  for(const bucket of ['avatars','street-icons']) {
    const prefixes=objects.filter(o=>o.bucket_id===bucket).map(o=>o.name);
    if(prefixes.length) await api(`/storage/v1/object/${bucket}`,'DELETE',{prefixes});
  }
  query(tx(`set local app.reset_authorized='20261125'; ${truncate} commit;`));
  for(const user of users) await api(`/auth/v1/admin/users/${user.id}`,'DELETE',{should_soft_delete:false});
  const counts=query(`select jsonb_build_object('auth_users',(select count(*) from auth.users),'auth_sessions',(select count(*) from auth.sessions),'auth_identities',(select count(*) from auth.identities),'auth_mfa_factors',(select count(*) from auth.mfa_factors),'storage_objects',(select count(*) from storage.objects),${cleared.map(t=>`'${t}',(select count(*) from app_private.${t})`).join(',')}) value;`)[0].value;
  const after=query(fingerprint)[0].value;
  if(Object.values(counts).some(n=>n!==0)||JSON.stringify(before)!==JSON.stringify(after)) throw Error('Verification failed; maintenance remains enabled.');
  query(tx(`${unblock} commit;`));
  const evidence={at:new Date().toISOString(),project:ref,counts,preserved:after,maintenanceRemoved:true,installationOwner:'unassigned; operator OTP/MFA recreation pending', resumed:resume, fingerprintBaseline:resume?'after atomic application-data reset; initial rollback rehearsal passed':'before reset'};
  writeFileSync('/private/tmp/denshin-reset-result.json',JSON.stringify(evidence,null,2),{mode:0o600});
  console.log(JSON.stringify(evidence,null,2));
}
