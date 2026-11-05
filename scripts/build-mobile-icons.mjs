// Adapt the reviewed Kubai exporter at build time; no browser runtime ships in the app.
// Original engine/export copyright (c) 2026 Kubai087; see icons/yumegaoka-ui/LICENSE.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
const root=path.resolve('icons/yumegaoka-ui');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'yumegaoka-motion-'));
try {
 let source=fs.readFileSync(path.join(root,'scripts/export.mjs'),'utf8');
 source=source.replace("const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');",`const root = ${JSON.stringify(root)};`);
 source=source.replace('const list = opts.only.length ? opts.only : ORDER;', 'const list = (opts.only.length ? opts.only : ORDER).flatMap(name => Array.from({length: 13}, (_, frame) => ({name, frame})));');
 source=source.replace('list.map((name) => {','list.map(({name, frame}) => {');
 source=source.replace("if (opts.state === 'hover') { inst.hover = 1; inst.cur = targetOf(inst); render(inst); }",'const from = inst.cur; inst.hover = 1; inst.cur = interp(from, targetOf(inst), frame / 12); render(inst);');
 source=source.replace('return { name, svg: svg.outerHTML };','return { name: name + "--" + frame, svg: svg.outerHTML };');
 const exporter=path.join(temporary,'export.mjs');fs.writeFileSync(exporter,source);
 execFileSync(process.execPath,[exporter,'--only',manifest.map(x=>x.name).join(','),'--out',path.join(temporary,'frames'),'--size','28'],{stdio:'inherit'});
 const frames=Object.fromEntries(manifest.map(item=>[item.name,Array.from({length:13},(_,i)=>fs.readFileSync(path.join(temporary,'frames',`${item.name}--${i}.svg`),'utf8'))]));
 const out='apps/mobile/src/components/icons';fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify(frames));
 fs.copyFileSync(path.join(root,'LICENSE'),path.join(out,'LICENSE'));
 console.log('Generated 26 icons × 13 original-motion frames');
} finally {fs.rmSync(temporary,{recursive:true,force:true});}
