// Rasterize the supplied Icon Composer layers for Android's adaptive/legacy icons.
// iOS-only optical glass and dynamic shadows stay native to iOS.
const fs = require('node:fs');
const path = require('node:path');
const Jimp = require('../apps/mobile/node_modules/jimp-compact');
const root = path.resolve(__dirname, '..');
async function main() {
  const icon = path.join(root, 'icons/yumegaoka.icon');
  const spec = JSON.parse(fs.readFileSync(path.join(icon, 'icon.json'), 'utf8'));
  const colors = spec.fill['linear-gradient'].map(value => value.split(':')[1].split(',').map(Number));
  const size = 1024;
  const background = new Jimp(size, size);
  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const rgba = colors[1].map((v, i) => Math.round(255 * (v * (1 - t) + colors[0][i] * t)));
    const color = Jimp.rgbaToInt(...rgba);
    for (let x = 0; x < size; x++) background.setPixelColor(color, x, y);
  }
  const source = await Jimp.read(path.join(icon, 'Assets', spec.groups[0].layers[0]['image-name']));
  // Keep the supplied aperture within the adaptive icon safe zone. The OS
  // controls the outer mask; do not bake in iOS rounded corners.
  const foreground = source.clone().cover(size, size);
  const monochrome = source.clone();
  monochrome.scan(0, 0, source.bitmap.width, source.bitmap.height, function (x, y, offset) {
    this.bitmap.data[offset] = 255;
    this.bitmap.data[offset + 1] = 255;
    this.bitmap.data[offset + 2] = 255;
    this.bitmap.data[offset + 3] = 255 - source.bitmap.data[offset + 3];
  });
  monochrome.cover(size, size);
  const out = path.join(root, 'apps/mobile/assets');
  await foreground.writeAsync(path.join(out, 'android-icon-foreground.png'));
  await background.writeAsync(path.join(out, 'android-icon-background.png'));
  await monochrome.writeAsync(path.join(out, 'android-icon-monochrome.png'));
  await background.clone().composite(foreground, 0, 0).writeAsync(path.join(out, 'android-icon.png'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
