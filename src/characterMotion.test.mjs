import fs from 'node:fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationMixer, Vector3 } from 'three';
globalThis.ProgressEvent = class { constructor(type,data){Object.assign(this,data)} };
export async function loadRig(file) {
 const b=fs.readFileSync(file),n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n));
 for(const node of j.nodes){delete node.mesh;delete node.skin;}
 delete j.meshes;delete j.materials;delete j.textures;delete j.images;
 j.buffers=[{byteLength:j.buffers[0].byteLength,uri:'data:application/octet-stream;base64,'+b.subarray(28+n).toString('base64')}];
 return new GLTFLoader().parseAsync(JSON.stringify(j),'');
}

import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareCharacterClips, blendWeights } from './characterMotion.mjs'

test('rapid animation changes preserve full pose weight without blending into the bind pose', () => {
 let weights=[1,0,0,0]
 for(let i=0;i<1000;i++) {
  weights=blendWeights(weights, i%4, 1/60)
  assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-10)
  assert.ok(weights.every(w=>w>=0&&w<=1))
 }
})
for(const [character,file,scale] of [['barbara','Barbara_TEST_14AnimacionesV2.glb',0.22],['luis','LuisAnimado.glb',0.24]]) {
 test(character + ': real clips remain finite, stationary and seamless after preparation', async () => {
  const {animations}=await loadRig('public/models/'+file)
  const originals=animations.map(c=>c.tracks.map(t=>Array.from(t.values)))
  const {clips,stride}=prepareCharacterClips(animations,character,scale)
  assert.ok(stride>1&&stride<2)
  assert.deepEqual(clips.find(c=>c.name==='Idle').tracks.map(t=>Array.from(t.values)), originals[animations.findIndex(c=>c.name==='Idle')])
  for(const clip of clips) {
   for(const track of clip.tracks) assert.ok(track.values.every(Number.isFinite))
   const hips=clip.tracks.find(t=>/Hips.position$/.test(t.name))
   if(/Walking|Dance|Excited/.test(clip.name)) {
    for(let k=0;k<3;k++) assert.ok(Math.abs(hips.values[k]-hips.values[hips.values.length-3+k])<1e-5)
   }
  }
  assert.deepEqual(animations.map(c=>c.tracks.map(t=>Array.from(t.values))),originals)
 })
}
