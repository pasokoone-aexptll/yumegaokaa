import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
function load(file, modules = {}) {
  const result = {};
  const jsx = (type, props) => ({ type, props });
  new Function('require', 'exports', ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText)(id => id === 'react/jsx-runtime' ? { jsx, jsxs: jsx, Fragment: 'Fragment' } : modules[id] ?? {}, result);
  return result;
}
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
test('Android operator list exposes pagination and identifies empty/used invitations', () => {
  const { OperatorForm } = load('apps/mobile/src/components/settings/OperatorForm.tsx', {
    'react-native': { Text: 'Text', View: 'View', Switch: 'Switch', Alert: {} },
    '../DetailUI': { DetailRow: 'DetailRow', Section: 'Section' },
    '../icons/SuperAsset': { SuperAsset: 'SuperAsset' },
  });
  let calls = 0;
  const data = { invites: [], more: true, busy: false, next: () => { calls++; } };
  const tree = nodes(OperatorForm({ data, open() {} }));
  assert.ok(tree.some(n => n.props?.title === '招待はありません'));
  const more = tree.find(n => n.props?.title === '続きを表示');
  assert.ok(more, 'later invitations must remain reachable on Android');
  more.props.onPress();
  assert.equal(calls, 1);
  const used = nodes(OperatorForm({ data: { ...data, busy: true, invites: [{ id: 'used', used_at: 'today', recipient_name: null }] }, open() {} }));
  assert.ok(used.some(n => n.type === 'Text' && n.props.children.includes('参加済み')));
  assert.equal(used.find(n => n.type === 'Switch').props.disabled, true);
  assert.equal(used.find(n => n.props?.title === '続きを表示').props.disabled, true);
});
test('Android glass fallback keeps a visible surface and does not leak unsupported native props', () => {
  const { GlassView } = load('apps/mobile/src/components/map/PlatformGlass.android.tsx', { 'react-native': { View: 'View' } });
  const element = GlassView({ colorScheme: 'dark', tintColor: '#AF52DE', glassEffectStyle: 'regular', isInteractive: true, style: { borderRadius: 24 }, children: 'count', accessibilityLabel: '人数' });
  assert.equal(element.props.style[0].backgroundColor, '#AF52DE');
  assert.equal(element.props.style[1].borderRadius, 24);
  assert.equal(element.props.children, 'count');
  assert.equal(element.props.accessibilityLabel, '人数');
  assert.equal('tintColor' in element.props, false);
  assert.equal('glassEffectStyle' in element.props, false);
  assert.ok(GlassView({ colorScheme: 'dark' }).props.style[0].backgroundColor);
});
