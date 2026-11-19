import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
const require = createRequire(new URL('../apps/mobile/package.json', import.meta.url));
const result = {};
new Function('require','exports',ts.transpileModule(readFileSync('apps/mobile/src/lib/inviteQR.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText)((id)=>id.includes('superassets')?JSON.parse(readFileSync('apps/mobile/src/components/icons/superassets.json','utf8')):require(id),result);
test('招待QRは専用schemeのUUIDだけを受け取る',()=>{
 const code='01234567-89ab-4cde-8fab-0123456789ab';
 assert.equal(result.parseInviteQR(result.invitePayload(code)),code);
 for (const bad of ['https://evil.test/?code='+code,'yumegaoka://invite?code=bad','yumegaoka://other?code='+code,'invalid']) assert.equal(result.parseInviteQR(bad),null);
 const svg=result.inviteSvg(code);
 assert.ok(svg.includes('fill="white"'));
 writeFileSync('/tmp/yumegaoka-invite-validation.svg',svg);
});
