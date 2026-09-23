import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { retainUsedAnimations } from './retain-used-animations.mjs'

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const mobile = JSON.parse(await fs.readFile('src/mobileAssets.json'))
const mobileReport = JSON.parse(await fs.readFile('scripts/mobile-assets-report.json'))
const desktop = {}, report = {}
for (const [character, file] of [['barbara', 'Barbara_TEST_14AnimacionesV2.glb'], ['luis', 'LuisAnimado.glb']]) {
  for (const isMobile of [false, true]) {
    const relative = isMobile ? `models/mobile/${character}.glb` : `models/${file}`
    const path = `public/${relative}`
    const before = (await fs.stat(path)).size
    const document = await io.read(path)
    const removed = await retainUsedAnimations(document, character)
    const bytes = await io.writeBinary(document)
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
    await fs.writeFile(path, bytes)
    const manifest = isMobile ? mobile : desktop
    manifest[character] = `${relative}?v=${hash}`
    if (isMobile) {
      mobileReport[character].after.animations = document.getRoot().listAnimations().map(a => a.getName())
      mobileReport[character].bytes = bytes.length
    }
    report[`${character}-${isMobile ? 'mobile' : 'desktop'}`] = { before, after: bytes.length, saved: before - bytes.length, removed }
  }
}
await fs.writeFile('src/characterAssets.json', JSON.stringify(desktop, null, 2) + '\n')
await fs.writeFile('src/mobileAssets.json', JSON.stringify(mobile, null, 2) + '\n')
await fs.writeFile('scripts/mobile-assets-report.json', JSON.stringify(mobileReport, null, 2) + '\n')
await fs.writeFile('scripts/animation-assets-report.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
