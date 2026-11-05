// Export the 26 review icons through the unchanged Kubai SVG exporter.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const items=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
if(!process.argv.includes('--preview-only')) execFileSync(process.execPath,[path.join(root,'scripts/export.mjs'),'--only',items.map(x=>x.name).join(','),'--palette','彩色','--size','24','--out',path.join(root,'svg')],{stdio:'inherit'});
const rows=items.map((x,i)=>`<div class="row"><span class="num">${i+1}</span><span>${x.meaning}<small>${x.file}</small></span><img width="24" height="24" src="svg/${x.file}"><img width="28" height="28" src="svg/${x.file}"><span class="dark"><img width="28" height="28" src="svg/${x.file}"></span></div>`).join('');
fs.writeFileSync(path.join(root,'preview.html'),`<!doctype html><html lang="ja"><meta charset="utf-8"><title>Yumegaoka — 26 UI icons</title><style>*{box-sizing:border-box}body{margin:0;padding:28px 36px;background:#fff;color:#23262d;font:14px -apple-system,BlinkMacSystemFont,sans-serif}h1{font-size:23px;margin:0 0 8px}p{color:#707682;margin:0 0 18px}.row{display:grid;grid-template-columns:28px 235px 68px 68px 68px;gap:12px;align-items:center;height:49px;border-bottom:1px solid #edf0f4}.num,small{color:#747984}small{display:block;font-size:11px;margin-top:3px}.dark{display:grid;place-items:center;width:52px;height:42px;background:#242830;border-radius:8px}.row>img{justify-self:center}.head{font-size:12px;color:#747984;height:32px}</style><h1>Yumegaoka / 26 UI icons</h1><p>静的SVG · 24px / 28px · <a href="index.html">アニメーションと配色切替</a></p><div class="row head"><span>#</span><span>用途 / SVG</span><span>24 px</span><span>28 px</span><span>28 px / 暗</span></div>${rows}</html>`);
console.log('26 SVG preview rows generated.');
