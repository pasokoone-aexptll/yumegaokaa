import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const babel = require('../apps/mobile/node_modules/@babel/core');
function compile(platform, filename = 'src/example.tsx') {
  return babel.transformSync('import { Text, TextInput, View } from "react-native"; export const Example = () => <View><Text>日本語 ABC</Text><TextInput /></View>;', {
    filename: path.resolve('apps/mobile', filename),
    configFile: path.resolve('apps/mobile/babel.config.cjs'),
    babelrc: false, caller: { name: 'metro', platform },
  }).code;
}
test('Android app Text and TextInput use the typography adapter, leaving View native', () => {
  const code = compile('android');
  assert.match(code, /AndroidTypography/);
  assert.match(code, /react-native/);
});
test('iOS and dependencies retain their original React Native primitives', () => {
  assert.doesNotMatch(compile('ios'), /AndroidTypography/);
  assert.doesNotMatch(compile('android', 'node_modules/example/index.tsx'), /AndroidTypography/);
});
test('typography adapter does not recursively redirect itself', () => {
  assert.doesNotMatch(compile('android', 'src/components/AndroidTypography.tsx'), /require\([^)]*AndroidTypography/);
});
