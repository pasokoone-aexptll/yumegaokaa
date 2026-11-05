import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from '../apps/mobile/node_modules/typescript/lib/typescript.js';
function moduleAt(path, dependencies={}) {
 const exports={};
 const source=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','exports',source)(name => {
  if(name==='react/jsx-runtime') return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  if(name in dependencies) return dependencies[name];
  throw Error('Missing test dependency '+name);
 },exports);
 return exports;
}
test('Home shows joined and unjoined events separately, ordered by start',()=>{
 const {homeEvents}=moduleAt('apps/mobile/src/lib/homeEvents.ts');
 const items=[{id:'later',joined:false,starts_at:'2026-11-06'},{id:'joined',joined:true,starts_at:'2026-11-05'},{id:'early',joined:false,starts_at:'2026-11-05'}];
 const result=homeEvents(items);
 assert.deepEqual(result.joined.map(x=>x.id),['joined']);
 assert.deepEqual(result.discover.map(x=>x.id),['early','later']);
 assert.equal(items[0].id,'later');
});
test('Marker feedback occurs on contact and navigation only on release',()=>{
 let pulses=0,haptics=0,actions=0,contacts=0;
 const {MarkerFeedback}=moduleAt('apps/mobile/src/components/map/MarkerFeedback.tsx',{
  '../icons/IconMotion':{IconPressable:'Pressable'},
  'react-native':{Animated:{View:'AnimatedView'},Platform:{OS:'ios'}},
  'expo-modules-core':{requireNativeModule:()=>({selectionHaptic:async()=>{haptics++;}})},
  '../../hooks/useTapPulse':{useTapPulse:()=>({scale:1,pulse:()=>{pulses++;}})},
 });
 const button=MarkerFeedback({onPress:()=>actions++,onPressIn:()=>contacts++}).props.children;
 button.props.onPressIn({});
 assert.equal(pulses,1);assert.equal(haptics,1);assert.equal(contacts,1);assert.equal(actions,0);
 button.props.onPress({});assert.equal(actions,1);assert.equal(haptics,1);
});
test('Offline header removes the count badge and gives the logo more space',()=>{
 const {MapHeader}=moduleAt('apps/mobile/src/components/map/MapHeader.tsx',{
  '../icons/IconMotion':{IconPressable:'Pressable'},'./ParticipationSwitch':{ParticipationSwitch:'Switch'},
  'react-native':{Image:'Image',Platform:{OS:'ios'},StyleSheet:{create:x=>x},Text:'Text',View:'View'},
  './MapAsset':{MapAsset:'Logo'},'./SmoothSurface':{SmoothSurface:'Surface'},
 });
 const visit=(node)=>Array.isArray(node)?node.flatMap(visit):node&&typeof node==='object'?[node,...visit(node.props?.children)]:[];
 const props={name:'夢ヶ丘',count:99,stale:false,active:false,onToggle:()=>{}};
 const online=visit(MapHeader(props)),offline=visit(MapHeader({...props,offline:true}));
 assert.ok(online.some(x=>x.props?.gradient?.[0]==='#FF9E9E'));
 assert.ok(!offline.some(x=>x.props?.gradient?.[0]==='#FF9E9E'));
 assert.ok(offline.find(x=>x.type==='Logo').props.width>online.find(x=>x.type==='Logo').props.width);
});

test('sunset stretch covers pull-down gap and stays unchanged on normal upward scroll',()=>{
 const numericAnimated={View:'AnimatedView',Image:'Image',multiply:(a,b)=>a*b,divide:(a,b)=>a/b,add:(a,b)=>a+b};
 const {StretchySunset}=moduleAt('apps/mobile/src/components/StretchySunset.tsx',{
  'react-native':{Animated:numericAnimated,StyleSheet:{absoluteFill:{}},View:'View'},
  '../../assets/backgrounds/yuuyake.png':0,
 });
 for(const offset of [-200,-50,0,100]) {
  const scroll={interpolate:({inputRange:r,outputRange:o,extrapolateRight})=>{
   const i=offset<r[1]?0:1;
   if(offset>r[2]&&extrapolateRight==='clamp')return o[2];
   return o[i]+(offset-r[i])/(r[i+1]-r[i])*(o[i+1]-o[i]);
  }};
  const h=300,tree=StretchySunset({scroll,height:h});
  const background=tree.props.children[0];
  assert.equal(background.type, "AnimatedView");
  assert.equal(background.props.style[1].height, undefined, "background bounds use all four edges, independent of header padding");
  assert.equal(background.props.children.props.style.height, "100%");
  const transform=background.props.style[1].transform;
  const translate=transform[0].translateY,scale=transform[1].scale;
  if(offset<0) {
   assert.ok(Math.abs(h/2+translate-h*scale/2-offset)<0.001,'top covers the viewport edge');
   assert.ok(Math.abs(h/2+translate+h*scale/2-h)<0.001,'bottom stays attached to header');
  } else {assert.equal(scale,1);assert.equal(Math.abs(translate),0);}
 }
});
