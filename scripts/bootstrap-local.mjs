// Initialize optional vendor schemas during a fresh local bootstrap, then keep
// client access behind our gateway. Historical migrations remain immutable.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const file='supabase/config.toml';
const original=readFileSync(file,'utf8');
if(!original.includes('project_id = "yumegaoka"'))throw Error('Wrong local project');
const bootstrap=original.replace(/(\[realtime\][\s\S]*?)enabled = false/, '$1enabled = true');
let status=1;
try {
 writeFileSync(file,bootstrap);
 status=spawnSync('npx',['--no-install','supabase','start','-x','studio,imgproxy,edge-runtime,logflare,vector,supavisor'],{stdio:'inherit'}).status ?? 1;
} finally {
 writeFileSync(file,original);
 // This container belongs only to this local project, never a cloud deployment.
 spawnSync('docker',['stop','supabase_realtime_yumegaoka'],{stdio:'ignore'});
}
process.exitCode=status;
