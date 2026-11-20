import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';

test('outgoing notice retains its own action until the next message enters', () => {
  const source = ts.transpileModule(readFileSync('apps/mobile/src/components/map/MapStatusBanner.ios.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const slots = []; let cursor = 0, finish;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], v => { slots[i] = v; }]; },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useEffect(fn) { fn(); },
  };
  const exports = {};
  new Function('require', 'exports', source)(id => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
    if (id === 'react-native') return { Animated: {
      View: 'AnimatedView',
      Value: class { setValue() {} interpolate() {} },
      timing: () => ({ start: cb => { finish = cb; }, stop() {} }),
    } };
    return { Notice: 'Notice' };
  }, exports);
  const render = props => { cursor = 0; return exports.MapStatusBanner(props).props.children.props; };
  render({ message: 'mode changed' });
  const retry = () => Promise.resolve();
  const next = { message: 'offline', actionLabel: 'retry', onAction: retry };
  const outgoing = render(next);
  assert.equal(outgoing.message, 'mode changed');
  assert.equal(outgoing.onAction, undefined);
  assert.equal(outgoing.actionLabel, undefined);
  finish({ finished: true });
  const incoming = render(next);
  assert.equal(incoming.message, 'offline');
  assert.equal(incoming.onAction, retry);
  assert.equal(incoming.actionLabel, 'retry');
});
