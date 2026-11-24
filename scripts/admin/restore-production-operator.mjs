// Run only after the owner has completed fresh OTP authentication on the device.
// Email is supplied via environment, never committed or printed. No consent is synthesized.
import {execFileSync} from 'node:child_process';
import {writeFileSync,unlinkSync} from 'node:fs';
const email=process.env.DENSHIN_OPERATOR_EMAIL;
if(!email || !/^[^\s@]+@[^\s@]+$/.test(email)) throw Error('Set DENSHIN_OPERATOR_EMAIL to the verified owner email.');
const path=`/private/tmp/denshin-operator-${process.pid}.sql`;
const literal="'"+email.replaceAll("'","''")+"'";
const sql=`begin;
set local lock_timeout='10s';
lock table app_private.members,app_private.operators in share row exclusive mode;
do $$ declare u uuid; begin
 if exists(select 1 from app_private.operators) then raise exception 'operator_already_exists';end if;
 select id into strict u from auth.users where lower(email)=lower(${literal}) and email_confirmed_at is not null;
 if not exists(select 1 from auth.sessions where user_id=u) then raise exception 'owner_login_required';end if;
 insert into app_private.members(account_id) values(u) on conflict do nothing;
 insert into app_private.profiles(account_id,display_name) values(u,'運営') on conflict do nothing;
 insert into app_private.operators(account_id,active) values(u,true);
 update app_private.sticker_drafts set creator=u where creator='00000000-0000-0000-0000-000000000000';
 update app_private.area_publications set operator_id=u where operator_id='00000000-0000-0000-0000-000000000000';
end $$;
commit;
select count(*) as operator_count from app_private.operators;`;
writeFileSync(path,sql,{mode:0o600});
try {
 execFileSync('npx',['supabase','db','query','--linked','--project-ref','kchsbjayfdwjjbevqlop','--file',path],{stdio:['ignore','pipe','pipe']});
 console.log('Operator restored; personal consent, profile images, and MFA must be completed on device.');
} catch {throw Error('Operator restore failed; verify fresh OTP session and existing operator count.');}
finally{unlinkSync(path);}
