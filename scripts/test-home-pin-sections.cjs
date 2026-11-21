const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('../apps/mobile/node_modules/typescript');
const exported = {};
vm.runInNewContext(ts.transpile(fs.readFileSync('apps/mobile/src/lib/homePinSections.ts','utf8'), {module:ts.ModuleKind.CommonJS}), {exports:exported});
const pins = [
  {id:'planned', attendance:'planned', recruiting:true},
  {id:'arrived', attendance:'arrived', recruiting:true},
  {id:'left', attendance:'left', recruiting:true},
  {id:'plain', attendance:'left', recruiting:false},
];
const sections = () => JSON.parse(JSON.stringify(exported.homePinSections(pins)));
assert.deepEqual(sections().map(s => [s.title, s.items.map(p => p.id)]), [['参加中',['planned','arrived']],['募集中',['left']],['PIN / 予約募集',['plain']]]);
pins[0].attendance = 'left';
pins[1].attendance = 'left';
assert.equal(sections().some(s => s.title === '参加中'), false);
assert.equal(exported.homePinSections([]).length, 0);
console.log('PASS: active attendance grouped once, cancellation removes section, empty sections hidden');
