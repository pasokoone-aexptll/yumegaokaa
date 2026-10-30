// Local-only integration. Do not log credentials, TOTP secrets, or email codes.
import {execFileSync} from 'node:child_process';
import {createHmac} from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
const env=JSON.parse(execFileSync('npx',['supabase','status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
assert.ok(new URL(env.API_URL).hostname==='127.0.0.1');
const email='mfa-'+Date.now()+'@example.test';
let user;
const db=new pg.Client({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});await db.connect();
async function auth(path,body,token){
 const response=await fetch(env.API_URL+'/auth/v1/'+path,{method:'POST',headers:{apikey:env.PUBLISHABLE_KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 assert.ok(response.ok,'Auth endpoint '+path.split('/')[0]+' HTTP '+response.status);return response.json();
}
async function rpc(token){
 return fetch(env.API_URL+'/rest/v1/rpc/street_api',{method:'POST',headers:{apikey:env.PUBLISHABLE_KEY,'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({operation:'operator_dashboard',payload:{}})});
}
function totp(secret){
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';
 for(const char of secret.toUpperCase().replace(/=+$/,'')){const index=alphabet.indexOf(char);assert.ok(index>=0);bits+=index.toString(2).padStart(5,'0');}
 const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
 const digest=createHmac('sha1',Buffer.from(bytes)).update(counter).digest(),offset=digest[19]&15;
 return String((digest.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');
}
try{
 await auth('otp',{email,create_user:true});
 let message;
 for(let i=0;i<10&&!message;i++){const list=await(await fetch('http://127.0.0.1:54324/api/v1/messages')).json();message=list.messages.find(m=>m.To.some(to=>to.Address===email));if(!message)await new Promise(r=>setTimeout(r,300));}
 assert.ok(message,'OTP delivery');
 const mail=await(await fetch('http://127.0.0.1:54324/api/v1/message/'+message.ID)).json();
 const code=(mail.Text+' '+mail.HTML).match(/\b\d{6}\b/)?.[0];assert.ok(code);
 const session=await auth('verify',{email,token:code,type:'email'});user=session.user.id;
 await db.query('insert into app_private.members(account_id) values($1)',[user]);
 await db.query('insert into app_private.operators(account_id) values($1)',[user]);
 assert.equal((await rpc(session.access_token)).status,401,'OTP only cannot operate');
 const factor=await auth('factors',{factor_type:'totp',friendly_name:'local disposable operator'},session.access_token);
 const challenge=await auth('factors/'+factor.id+'/challenge',{},session.access_token);
 const upgraded=await auth('factors/'+factor.id+'/verify',{challenge_id:challenge.id,code:totp(factor.totp.secret)},session.access_token);
 assert.equal((await rpc(upgraded.access_token)).status,200,'Actual MFA token passes operator guard');
 await db.query('update app_private.operators set active=false where account_id=$1',[user]);
 assert.equal((await rpc(upgraded.access_token)).status,403,'Revoked role rejected with still-valid JWT');
 console.log('実Auth統合成功: メールOTP→TOTP登録/検証→運営API→資格失効拒否。秘密は出力していません。');
}finally{
 if(user){await db.query('delete from app_private.operators where account_id=$1',[user]);await db.query('delete from app_private.members where account_id=$1',[user]);
 const removed=await fetch(env.API_URL+'/auth/v1/admin/users/'+user,{method:'DELETE',headers:{apikey:env.SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SERVICE_ROLE_KEY}});
 assert.ok(removed.ok,'Fixture auth cleanup');}
 await db.end();
}
