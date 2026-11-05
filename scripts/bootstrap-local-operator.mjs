// Reproducible local operator; never usable against a hosted project.
import { execFileSync } from 'node:child_process';
import pg from 'pg';
const email=process.argv[2] ?? 'iphone-validation@example.test';
if(!/^[^\s@]+@[^\s@]+$/.test(email))throw Error('Invalid development email');
const env=JSON.parse(execFileSync('npx',['--no-install','supabase','status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
if(new URL(env.API_URL).hostname!=='127.0.0.1'||new URL(env.DB_URL).hostname!=='127.0.0.1')throw Error('Local only');
const db=new pg.Client({connectionString:env.DB_URL});
await db.connect();
try {
 let id=(await db.query('select id from auth.users where lower(email)=lower($1)',[email])).rows[0]?.id;
 if(!id){
  const response=await fetch(env.API_URL+'/auth/v1/admin/users',{method:'POST',headers:{apikey:env.SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,email_confirm:true})});
  if(!response.ok)throw Error('Local auth creation failed: '+response.status);
  id=(await response.json()).id;
 }
 await db.query('begin');
 await db.query('insert into app_private.members(account_id) values($1) on conflict(account_id) do update set active=true',[id]);
 await db.query('insert into app_private.profiles(account_id,display_name) values($1,$2) on conflict(account_id) do nothing',[id,'開発運営']);
 await db.query('insert into app_private.operators(account_id,active) values($1,true) on conflict(account_id) do update set active=true',[id]);
 await db.query('commit');
 console.log('Local operator ready: '+email+' (OTP login; street icon onboarding and operator MFA remain required)');
}catch(error){await db.query('rollback').catch(()=>{});throw error;}finally{await db.end();}
