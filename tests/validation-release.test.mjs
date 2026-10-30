import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
function compile(path) {
  return ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
}
const configSource = compile('apps/mobile/app.config.ts');
const runtimeSource = compile('apps/mobile/src/lib/development.ts');
function config(env) {
  const exports = {};
  new Function('exports', 'process', configSource)(exports, { env });
  return exports.default({ config: {
    name: '夢ヶ丘', plugins: ['react-native-nfc-manager'],
    ios: { entitlements: { 'com.apple.developer.nfc.readersession.formats': ['NDEF'] } },
  } });
}
function runtime(debug, extra, url) {
  const exports = {};
  new Function('exports', 'require', '__DEV__', runtimeSource)(exports,
    id => id === 'expo-constants' ? { __esModule: true, default: { expoConfig: { extra } } } : { url }, debug);
  return exports.localEntry;
}
test('Release substitute requires both validation flag and local API', () => {
  const local = { YUMEGAOKA_LOCAL_ENTRY: '1', YUMEGAOKA_VALIDATION_RELEASE: '1', EXPO_PUBLIC_SUPABASE_URL: 'http://192.168.1.2:54321' };
  const result = config(local);
  assert.equal(result.name, '夢ヶ丘 検証用');
  assert.equal(result.ios.entitlements['com.apple.developer.nfc.readersession.formats'], undefined);
  assert.ok(!result.plugins.includes('react-native-nfc-manager'));
  assert.equal(runtime(false, result.extra, local.EXPO_PUBLIC_SUPABASE_URL), true);
  assert.equal(runtime(false, { localEntry: true }, local.EXPO_PUBLIC_SUPABASE_URL), false);
  assert.equal(runtime(false, result.extra, 'https://project.supabase.co'), false);
  for (const url of ['https://project.supabase.co', 'http://172.32.1.2', 'file:///tmp/local']) {
    assert.throws(() => config({ ...local, EXPO_PUBLIC_SUPABASE_URL: url }));
  }
  assert.throws(() => config({ ...local, YUMEGAOKA_LOCAL_ENTRY: '0' }));
  const production = config({});
  assert.equal(production.extra.validationRelease, false);
  assert.ok(production.plugins.includes('react-native-nfc-manager'));
});
