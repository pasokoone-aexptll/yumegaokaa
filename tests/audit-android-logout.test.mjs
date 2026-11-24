import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';

// Audit reproduction of the existing adapter, not a desired-behavior acceptance
// test. No native device, SecureStore instance, Supabase account or network is used.
const source = ts.transpileModule(
  readFileSync('apps/mobile/src/lib/platformAuth.android.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function harness(initialSession) {
  let session = initialSession;
  const calls = [];
  const client = {
    auth: {
      async getSession() { calls.push('auth.getSession'); return { data: { session }, error: null }; },
      async signOut(options) { calls.push(['auth.signOut', options]); session = null; return { error: null }; },
    },
    async rpc(operation, payload) {
      calls.push(['rpc', operation, payload]);
      return { data: operation === 'street_api' ? { visit: null } : {}, error: null };
    },
  };
  const modules = {
    'react-native': { DeviceEventEmitter: {}, PermissionsAndroid: {}, Platform: { OS: 'android', Version: 35 } },
    './visitObservation.android': {
      async stopObservation() { calls.push('stopObservation'); },
    },
    './observationTime': {},
    './modeDelivery': {},
    './streetGrid': {},
    'expo-modules-core': { requireNativeModule() { return {}; } },
    '@supabase/supabase-js': {
      createClient(url, key) { calls.push(['createClient', url, key]); return client; },
    },
    'expo-secure-store': {
      async getItemAsync() { throw Error('unexpected SecureStore read'); },
      async setItemAsync() { throw Error('unexpected SecureStore write'); },
      async deleteItemAsync(key) { calls.push(['SecureStore.delete', key]); },
    },
  };
  const exports = {};
  new Function('require', 'exports', source)((id) => {
    if (!(id in modules)) throw Error(`Unexpected dependency: ${id}`);
    return modules[id];
  }, exports);
  return { auth: exports.platformAuth, calls };
}

test('audit reproduction: logout with no Supabase session rejects before signOut', async () => {
  const { auth, calls } = harness(null);
  await auth.configure('https://review.example.test', 'fake-publishable-key');
  await assert.rejects(auth.logout(), { message: 'login_required' });
  assert.deepEqual(calls, [
    ['createClient', 'https://review.example.test', 'fake-publishable-key'],
    'stopObservation',
    'auth.getSession',
  ]);
  // In particular, neither remote cleanup nor the eventual signOut is reached.
  assert.equal(calls.some((entry) => Array.isArray(entry) && entry[0] === 'auth.signOut'), false);
});

test('audit control: logout with a present session reaches local signOut', async () => {
  const { auth, calls } = harness({ user: { id: 'fixture-account' }, access_token: 'fixture-token' });
  await auth.configure('https://review.example.test', 'fake-publishable-key');
  await auth.logout();
  assert.deepEqual(calls, [
    ['createClient', 'https://review.example.test', 'fake-publishable-key'],
    'stopObservation',
    'auth.getSession',
    ['SecureStore.delete', 'yumegaoka.attempt.review.example.test.fixture-account.mode'],
    ['rpc', 'street_api', { operation: 'get_my_visit', payload: {} }],
    ['rpc', 'fcm_registration', { operation: 'remove' }],
    ['auth.signOut', { scope: 'local' }],
  ]);
});
