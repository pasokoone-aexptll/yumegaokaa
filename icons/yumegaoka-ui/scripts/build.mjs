// Build the review-only SVG delivery from the unmodified Kubai renderer/exporter.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const items = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
if (!process.argv.includes('--from-export')) execFileSync(process.execPath, [path.join(root, 'scripts/export.mjs'), '--only', items.map(x=>x.name).join(','), '--palette', '黑色', '--size', '24', '--pad', '0', '--out', path.join(root, 'raw-export')], {stdio:'inherit'});
fs.mkdirSync(path.join(root,'svg'),{recursive:true});
const rows = items.map((item,i)=>{
  const raw=fs.readFileSync(path.join(root,'raw-export',item.file),'utf8');
  // All new geometry uses currentColor; engine-generated unused paint servers are removed.
  const svg=raw.replace(/<defs>[\s\S]*?<\/defs>/g,'');
  if (/url\(|<script|<style|<text|<animate|filter=|#[0-9a-f]{3}/i.test(svg)) throw new Error('Unexpected dependency: '+item.file);
  if (!svg.includes('currentColor')) throw new Error('Missing recoloring: '+item.file);
  fs.writeFileSync(path.join(root,'svg',item.file),svg);
  return `<div class="row"><span class="num">${i+1}</span><span>${item.meaning}<small>${item.file}</small></span><span class="sample s24">${svg}</span><span class="sample s28">${svg}</span><span class="sample s24 dark">${svg}</span><span class="sample s28 blue">${svg}</span></div>`;
});
fs.writeFileSync(path.join(root,'preview.html'),`<!doctype html><html lang="ja"><meta charset="utf-8"><title>Yumegaoka UI icons</title><style>*{box-sizing:border-box}body{margin:0;padding:32px 40px;font:14px -apple-system,BlinkMacSystemFont,sans-serif;color:#23262d;background:#fff}h1{font-size:24px;margin:0 0 8px}p{color:#626773;margin:0 0 24px}.row{display:grid;grid-template-columns:32px 240px repeat(4,84px);align-items:center;min-height:54px;border-bottom:1px solid #eef0f2;gap:8px}small{display:block;color:#747984;font-size:11px;margin-top:3px}.num{color:#747984}.sample{height:44px;display:grid;place-items:center}.s24 svg{width:24px;height:24px}.s28 svg{width:28px;height:28px}.dark{background:#23262d;color:white}.blue{color:#2864dc}.head{font-size:12px;color:#626773;min-height:32px}</style><h1>Yumegaoka / UI icons</h1><p>22用途 · 静的SVG · currentColor · アプリ統合前レビュー</p><div class="row head"><span>#</span><span>用途 / ファイル名</span><span>24 px</span><span>28 px</span><span>24 px / 白</span><span>28 px / 青</span></div>${rows.join('')}</html>`);
console.log('22 monochrome SVGs checked; preview.html generated.');
