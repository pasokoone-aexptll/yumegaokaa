import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const device = process.argv[2];
if (!device || device.startsWith('-')) {
  throw Error('Usage: node scripts/ios-validation-release.mjs <iPhone device ID>');
}
const cwd = fileURLToPath(new URL('../apps/mobile', import.meta.url));
const env = { ...process.env, YUMEGAOKA_LOCAL_ENTRY: '1', YUMEGAOKA_VALIDATION_RELEASE: '1' };
function expo(args) {
  const result = spawnSync('npx', ['expo', ...args], { cwd, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// Reapply config/plugins before the one batched build. Do not delete generated projects.
expo(['prebuild', '--platform', 'ios']);
expo(['run:ios', '--configuration', 'Release', '--device', device, '--no-bundler']);
