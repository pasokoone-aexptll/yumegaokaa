// npm install --prefix /tmp/android-svg-render @resvg/resvg-js
// Render only Android assets; the supplied SVG is the source of truth.
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require(process.env.RESVG_MODULE || '/tmp/android-svg-render/node_modules/@resvg/resvg-js');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'apps/mobile/assets');
const svg = fs.readFileSync(path.join(out, 'android-icon-source.svg'), 'utf8');
function render(source, name) {
  fs.writeFileSync(path.join(out, name), new Resvg(source, { fitTo: { mode: 'width', value: 1024 } }).render().asPng());
}
render(svg, 'android-icon.png');
// Adaptive icons crop the outer third. Add this inset so the visible result
// preserves the supplied SVG's 136 x 136 proportions instead of magnifying it.
const adaptive = svg.replace('viewBox="0 0 136 136"', 'viewBox="-34 -34 204 204"')
  .replace('M151.723 154H-15V-19H151.723V154Z', 'M250 250H-100V-100H250V250Z')
  .replace('<g clip-path="url(#clip0_843_151)">', '<g>');
render(adaptive, 'android-icon-foreground.png');
const defs = svg.match(/<defs>[\s\S]*<\/defs>/)[0];
render(`<svg width="136" height="136" xmlns="http://www.w3.org/2000/svg"><rect width="136" height="136" fill="url(#paint1_linear_843_151)"/>${defs}</svg>`, 'android-icon-background.png');
const silhouette = adaptive.replace(/<rect[^>]+\/>/, '').replace('M250 250H-100V-100H250V250Z', '').replace('fill="url(#paint1_linear_843_151)"', 'fill="white"');
render(silhouette, 'android-icon-monochrome.png');
