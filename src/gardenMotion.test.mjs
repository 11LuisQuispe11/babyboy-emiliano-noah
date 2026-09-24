import test from 'node:test'
import assert from 'node:assert/strict'
import { getGardenShot, hostsInGarden, sunlightOpacity } from './gardenMotion.mjs'
import { getRouteShot } from './sceneMotion.mjs'

test('camera stays fixed on either side of the covered cut, without an orbit', () => {
  for (const portrait of [false, true]) {
    for (let i = 0; i <= 100; i++) {
      const p = i / 100
      assert.deepEqual(getGardenShot('sunlight', p, portrait), p < 0.5 ? getRouteShot('arrived', 1, portrait) : getGardenShot('ready', 1, portrait))
      assert.equal(hostsInGarden('sunlight', p), p >= 0.5)
    }
  }
})

test('sunlight fully hides repositioning and clears at both ends', () => {
  assert.equal(sunlightOpacity('sunlight', 0), 0)
  for (const p of [0.4, 0.49, 0.5, 0.51, 0.65]) assert.equal(sunlightOpacity('sunlight', p), 1)
  assert.equal(sunlightOpacity('sunlight', 1), 0)
  assert.equal(sunlightOpacity('ready', 0), 0)
  assert.equal(hostsInGarden('idle', 1), false)
  assert.equal(hostsInGarden('ready', 0), true)
})
