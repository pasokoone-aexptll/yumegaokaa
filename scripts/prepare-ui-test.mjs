import { execFileSync } from "node:child_process";
import pg from "pg";
const env=JSON.parse(execFileSync("npx",["supabase","status","-o","json"],{encoding:"utf8",stdio:["ignore","pipe","ignore"]}));
if(new URL(env.API_URL).hostname!=="127.0.0.1")throw Error("UI fixture is local-only");
const db=new pg.Client({connectionString:env.DB_URL});await db.connect();
try {
 const email="iphone-validation@example.test";
 let user=(await db.query("select id from auth.users where email=$1",[email])).rows[0];
 if(!user){
  const r=await fetch(env.API_URL+"/auth/v1/admin/users",{method:"POST",headers:{apikey:env.SERVICE_ROLE_KEY,Authorization:"Bearer "+env.SERVICE_ROLE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,email_confirm:true})});
  if(!r.ok)throw Error("Local fixture creation failed: "+r.status);
  user=await r.json();
 }
 await db.query("insert into app_private.members(account_id) values($1) on conflict do nothing",[user.id]);
 if(process.argv.includes("--onboarding")) {
  // Dedicated local-only code consumed by testInvitationOnboarding.
  await db.query("insert into app_private.invitations(issuer,code_hash,expires_at) values($1,sha256(convert_to('local-ui-onboarding-test','UTF8')),clock_timestamp()+interval '1 hour') on conflict(code_hash) do update set used_by=null,used_at=null,revoked_at=null,expires_at=excluded.expires_at",[user.id]);
 }
 if(process.argv.includes("--operator")) {
  await db.query("insert into app_private.operators(account_id) values($1) on conflict(account_id) do update set active=true",[user.id]);
  await db.query("update auth.sessions set factor_id=null,aal='aal1' where user_id=$1",[user.id]);
  await db.query("delete from auth.mfa_factors where user_id=$1",[user.id]);
 }
 if(process.argv.includes("--revoke-operator")) {
  await db.query("update app_private.operators set active=false where account_id=$1",[user.id]);
  await db.query("update auth.sessions set factor_id=null,aal='aal1' where user_id=$1",[user.id]);
  await db.query("delete from auth.mfa_factors where user_id=$1",[user.id]);
 }
 console.log("UI検証用ローカルアカウントを準備しました。本番・外部メールへの変更なし。");
}finally{await db.end();}
