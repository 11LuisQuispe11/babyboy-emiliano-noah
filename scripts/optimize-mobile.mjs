import fs from 'node:fs/promises'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, flatten, join, prune, simplify, weld, textureCompress } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import { retainUsedAnimations } from './retain-used-animations.mjs'
import { createHash } from 'node:crypto'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const stats = document => {
  const root = document.getRoot()
  let triangles = 0, primitives = 0, textureBytes = 0
  for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) {
    primitives++
    triangles += (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3
  }
  for (const t of root.listTextures()) { const [w,h] = t.getSize() ?? [0,0]; textureBytes += w*h*4*4/3 }
  return { triangles, primitives, textureMiB: +(textureBytes/1024/1024).toFixed(1), animations: root.listAnimations().map(a=>a.getName()) }
}
const assets = [
  ['scene', 'EscenarioV3.glb', 0.25, 512],
  ['barbara', 'Barbara_TEST_14AnimacionesV2.glb', 0.12, 1024],
  ['luis', 'LuisAnimado.glb', 0.06, 1024],
]
const manifest = {}, report = {}
await fs.mkdir('public/models/mobile', { recursive: true })
for (const [key, file, ratio, size] of assets) {
  const document = await io.read('public/models/' + file)
  const before = stats(document)
  if (key !== 'scene') await retainUsedAnimations(document, key)
  if (key === 'scene') await document.transform(dedup(), flatten(), join())
  await document.transform(weld(), simplify({ simplifier: key === 'scene' ? { ...MeshoptSimplifier, simplify: (indices, positions, stride, count, error, flags) => MeshoptSimplifier.simplify(indices, positions, stride, count, error, [...flags, 'Permissive']) } : MeshoptSimplifier, ratio, error: key === 'scene' ? 0.001 : 0.002 }), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [size,size], quality: 75 }))
  if (key === 'scene') await document.transform(prune())
  const output = await io.writeBinary(document)
  const hash = createHash('sha256').update(output).digest('hex').slice(0,16)
  await fs.writeFile('public/models/mobile/' + key + '.glb', output)
  manifest[key] = 'models/mobile/' + key + '.glb?v=' + hash
  report[key] = { source: file, before, after: stats(document), bytes: output.byteLength }
  console.log(key, JSON.stringify(report[key]))
}
await fs.writeFile('src/mobileAssets.json', JSON.stringify(manifest, null, 2) + '\n')
await fs.writeFile('scripts/mobile-assets-report.json', JSON.stringify(report, null, 2) + '\n')
