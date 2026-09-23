import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { CHARACTER_ANIMATIONS } from './characterAnimations.mjs'
import { shouldUseMobileAssets } from './renderProfile.mjs'

test('touch phones and tablets use lightweight assets even without a memory API', () => {
  assert.equal(shouldUseMobileAssets({ coarsePointer: true, touchPoints: 5, deviceMemory: undefined }), true)
  assert.equal(shouldUseMobileAssets({ touchPoints: 5, screenWidth: 1024 }), true)
  assert.equal(shouldUseMobileAssets({ deviceMemory: 4 }), true)
  assert.equal(shouldUseMobileAssets({ saveData: true }), true)
  assert.equal(shouldUseMobileAssets({ screenWidth: 1920, deviceMemory: 16 }), false)
})

test('mobile assets remain within geometry, download and decoded texture budgets', () => {
  const report = JSON.parse(fs.readFileSync('scripts/mobile-assets-report.json'))
  assert.ok(Object.values(report).reduce((n, a) => n + a.bytes, 0) < 26_000_000)
  assert.ok(Object.values(report).reduce((n, a) => n + a.after.textureMiB, 0) < 65)
  assert.ok(Object.values(report).reduce((n, a) => n + a.after.triangles, 0) < 500_000)
  for (const [name, a] of Object.entries(report)) {
    assert.deepEqual([...a.after.animations].sort(), [...(CHARACTER_ANIMATIONS[name] ?? [])].sort())
    assert.equal(fs.statSync('public/models/mobile/' + name + '.glb').size, a.bytes)
  }
})
