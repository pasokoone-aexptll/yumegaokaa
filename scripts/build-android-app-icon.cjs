// Android-only assets from the supplied 220px Figma originals.
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require(process.env.RESVG_MODULE || '/tmp/android-svg-render/node_modules/@resvg/resvg-js');
const out = path.resolve(__dirname, '../apps/mobile/assets');
const read = name => fs.readFileSync(path.join(out, name), 'utf8');
const render = (svg, name) => fs.writeFileSync(path.join(out, name), new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } }).render().asPng());
const svg = read('android-icon-source.svg');
render(read('android-icon-round-source.svg'), 'android-icon.png');
// The central 72/108 area is the launcher mask. Preserve the original scale.
render(svg.replace('viewBox="0 0 220 220"', 'viewBox="-55 -55 330 330"'), 'android-icon-foreground.png');
const gradient = svg.match(/<linearGradient[\s\S]*?<\/linearGradient>/)[0];
render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-55 -55 330 330"><defs>${gradient}</defs><rect x="-55" y="-55" width="330" height="330" fill="url(#paint0_linear_846_778)"/></svg>`, 'android-icon-background.png');
// Android themed icons consume alpha, not the supplied gray colors. Extract
// the sign silhouette by subtracting the inverse path from an opaque square.
const inverse = read('android-icon-mono-source.svg').match(/<path d="([^"]+)"/)[1];
render(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-55 -55 330 330"><defs><mask id="sign" maskUnits="userSpaceOnUse" x="0" y="0" width="220" height="220"><rect width="220" height="220" fill="white"/><path d="${inverse}" fill="black"/></mask></defs><rect width="220" height="220" fill="white" mask="url(#sign)"/></svg>`, 'android-icon-monochrome.png');
