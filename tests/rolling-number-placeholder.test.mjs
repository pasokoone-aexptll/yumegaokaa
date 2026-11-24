import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';

function harness(reduced = false) {
  const slots = [], effects = [];
  let cursor = 0, completion;
  const react = {
    useContext: () => reduced,
    useRef: value => slots[cursor++] ??= { current: value },
    useState(value) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value;
      return [slots[index], next => { slots[index] = next; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((v, i) => v !== slots[index][i])) {
        slots[index] = deps;
        effects.push(effect);
      }
    },
  };
  const animated = {
    Value: class { setValue() {} stopAnimation() {} interpolate(config) { return config; } },
    timing: () => ({ start: callback => { completion = callback; } }),
    Text: 'Animated.Text',
  };
  const exports = {};
  const source = ts.transpileModule(readFileSync('apps/mobile/src/components/denshin/RollingNumber.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'exports', source)(id => {
    if (id === 'react') return react;
    if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, ...props }), jsxs: (type, props) => ({ type, ...props }) };
    if (id === 'react-native') return { Animated: animated, StyleSheet: { create: v => v }, Text: 'Text', View: 'View' };
    return { ReducedIconMotion: {} };
  }, exports);
  return {
    render(props) { cursor = 0; const tree = exports.RollingNumber({ compact: true, light: true, ...props }); effects.splice(0).forEach(f => f()); return tree; },
    finish() { completion?.({ finished: true }); },
  };
}
function texts(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [ ...(tree.type === 'Text' || tree.type === 'Animated.Text' ? [tree] : []), ...[tree.children].flat(Infinity).flatMap(texts) ];
}

test('placeholder zero rolls into a black typed zero, then deletion restores grey', () => {
  const h = harness();
  h.render({ value: 0, placeholder: true }); h.finish();
  for (const placeholder of [false, true]) {
    h.render({ value: 0, placeholder });
    const layers = texts(h.render({ value: 0, placeholder }));
    assert.equal(layers.length, 2);
    assert.equal(layers[0].type, 'Animated.Text');
    const colors = layers.map(t => Object.assign({}, ...t.style.flat(Infinity)).color);
    assert.deepEqual(colors, placeholder ? ['black', 'rgba(0,0,0,0.3)'] : ['rgba(0,0,0,0.3)', 'black']);
    assert.deepEqual(layers[1].style.at(-1).transform[0].translateY.outputRange, [30, 0]);
    h.finish();
    assert.equal(texts(h.render({ value: 0, placeholder })).length, 1);
  }
});

test('reduced motion displays the typed zero without rolling layers', () => {
  const h = harness(true);
  h.render({ value: 0, placeholder: true }); h.finish();
  h.render({ value: 0, placeholder: false });
  const layers = texts(h.render({ value: 0, placeholder: false }));
  assert.equal(layers.length, 1);
  assert.equal(layers[0].type, 'Text');
  assert.equal(Object.assign({}, ...layers[0].style.flat(Infinity)).color, 'black');
});
