import { execFileSync } from "node:child_process";
import pg from "pg";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
const env=JSON.parse(execFileSync("npx",["supabase","status","-o","json"],{encoding:"utf8",stdio:["ignore","pipe","ignore"]}));
if(new URL(env.API_URL).hostname!=="127.0.0.1")throw Error("UI fixture is local-only");
const db=new pg.Client({connectionString:env.DB_URL});await db.connect();
try {
 const peerMessage=process.argv.includes("--peer-message");
 const email=peerMessage ? "iphone-peer@example.test" : "iphone-validation@example.test";
 let user=(await db.query("select id from auth.users where email=$1",[email])).rows[0];
 if(!user){
  const r=await fetch(env.API_URL+"/auth/v1/admin/users",{method:"POST",headers:{apikey:env.SERVICE_ROLE_KEY,Authorization:"Bearer "+env.SERVICE_ROLE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,email_confirm:true})});
  if(!r.ok)throw Error("Local fixture creation failed: "+r.status);
  user=await r.json();
 }
 await db.query("insert into app_private.members(account_id) values($1) on conflict do nothing",[user.id]);
 if(process.argv.includes("--registered-fixture") || process.argv.includes("--host-event") || peerMessage) {
  // Prepare an already-registered account for navigation tests. This does not
  // stand in for testing the native picker or first-time onboarding.
  const headers={apikey:env.PUBLISHABLE_KEY,Authorization:"Bearer "+env.SERVICE_ROLE_KEY,"Content-Type":"application/json"};
  const generated=await fetch(env.API_URL+"/auth/v1/admin/generate_link",{method:"POST",headers,body:JSON.stringify({type:"magiclink",email})});
  if(!generated.ok)throw Error("Fixture authentication preparation failed");
  const link=await generated.json();
  const verified=await fetch(env.API_URL+"/auth/v1/verify",{method:"POST",headers,body:JSON.stringify({type:"magiclink",token_hash:link.hashed_token})});
  if(!verified.ok)throw Error("Fixture authentication failed");
  const auth=await verified.json();
  headers.Authorization="Bearer "+auth.access_token;
  const rpc=async(operation,payload={})=>{
   const response=await fetch(env.API_URL+"/rest/v1/rpc/street_api",{method:"POST",headers,body:JSON.stringify({operation,payload})});
   if(!response.ok)throw Error("Fixture RPC failed: "+operation+" "+response.status);
   return response.json();
  };
  const dir=await mkdtemp(join(tmpdir(),"yumegaoka-ui-avatar-"));
  try {
   await rpc("profile_save",{display_name:peerMessage ? "UI別の参加者" : "実機確認"});
   const street_id="11111111-1111-4111-8111-111111111111";
   const state=await rpc("street_icon_get",{street_id});
   if(!state.contribution_id){
    execFileSync("sips",["-s","format","jpeg","apps/mobile/assets/icon.png","--out",join(dir,"icon.jpg")],{stdio:"ignore"});
    const pending=await rpc("street_icon_prepare",{street_id});
    const upload=await fetch(env.API_URL+"/storage/v1/object/street-icons/"+pending.upload_path,{method:"POST",headers:{...headers,"Content-Type":"image/jpeg","x-upsert":"true"},body:await readFile(join(dir,"icon.jpg"))});
    if(!upload.ok)throw Error("Fixture image upload failed");
    await rpc("street_icon_publish",{street_id,id:pending.id});
   }
   if(peerMessage) {
    const receipt=await rpc("command_prepare",{kind:"chat_send"});
    await rpc("command_execute",{id:receipt.id,body:{street_id,body:"UI peer message for report and block"}});
   }
   if(process.argv.includes("--host-event")) {
    const title="UI host workflow";
    const list=await rpc("event_list",{street_id,mine_only:true});
    for(const event of list.items.filter(item=>item.title===title && item.mine)) {
     const current=await rpc("event_get",{id:event.id});
     await rpc("event_cancel",{id:event.id,revision:current.revision});
    }
    const receipt=await rpc("command_prepare",{kind:"event_create"});
    const created=await rpc("command_execute",{id:receipt.id,body:{street_id,title,description:"運営UI試験",longitude:139.7109,latitude:35.7295,starts_at:new Date(Date.now()+3600000).toISOString(),ends_at:new Date(Date.now()+7200000).toISOString(),capacity:20}});
    await rpc("event_register",{id:created.id,joined:true,revision:0});
    if(process.argv.includes("--notify-change")) {
     const current=await rpc("event_get",{id:created.id});
     await rpc("event_edit",{...current,ends_at:new Date(Date.parse(current.ends_at)+300000).toISOString()});
    }
   }
  } finally {
   await rm(dir,{recursive:true,force:true});
   await fetch(env.API_URL+"/auth/v1/logout?scope=local",{method:"POST",headers});
  }
 }
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
