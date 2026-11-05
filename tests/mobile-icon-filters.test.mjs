import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const frames=JSON.parse(fs.readFileSync('apps/mobile/src/components/icons/frames.json','utf8'));
const blendSource=fs.readFileSync('apps/mobile/node_modules/react-native-svg/src/fabric/FeBlendNativeComponent.ts','utf8');
const supported=new Set([...blendSource.matchAll(/^  \| '([^']+)'/gm)].map(x=>x[1]));
test('every shipped frame uses a native-supported feBlend mode (unsupported values abort Fabric)',()=>{
 for(const [name,images] of Object.entries(frames)) for(const [i,xml] of images.entries()) {
  for(const tag of xml.matchAll(/<feBlend\b[^>]*>/g)) {
   const mode=tag[0].match(/\bmode="([^"]+)"/)?.[1]??'normal';
   assert.ok(supported.has(mode),`${name} frame ${i}: unsupported feBlend ${mode}`);
  }
 }
});
