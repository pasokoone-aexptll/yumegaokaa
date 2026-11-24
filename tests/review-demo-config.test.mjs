import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReviewDemoConfig as validate} from '../scripts/lib/review-demo-config.mjs';
const ref='abcdefghijklmnopqrst';
const config={projectRef:ref,supabaseUrl:`https://${ref}.supabase.co`,gatewayUrl:'wss://review.example.test',streetId:'22222222-2222-4222-8222-222222222222',authentication:'password',pushEnabled:false};
const options={productionGatewayUrl:'wss://production.example.test',approvedProjectRef:ref};
test('explicitly approved separate demo config is accepted',()=>assert.equal(validate(config,options).authentication,'password'));
test('production, unapproved targets, insecure endpoints and credentials are refused',()=>{
 for(const patch of [{projectRef:'kchsbjayfdwjjbevqlop'},{supabaseUrl:'https://kchsbjayfdwjjbevqlop.supabase.co'},{supabaseUrl:`https://${ref}.supabase.co.evil.test`},{gatewayUrl:'wss://production.example.test/ws'},{gatewayUrl:'ws://review.example.test'},{gatewayUrl:'wss://user:secret@review.example.test'},{pushEnabled:true},{password:'secret'}]) assert.throws(()=>validate({...config,...patch},options));
 assert.throws(()=>validate(config,{...options,approvedProjectRef:undefined}));
});
