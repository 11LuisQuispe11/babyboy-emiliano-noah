import test from 'node:test'
import assert from 'node:assert/strict'
import { getRouteShot, dampingAmount } from './sceneMotion.mjs'

test('camera framing remains continuous at every route boundary', () => {
  assert.deepEqual(getRouteShot('idle'), getRouteShot('turning-away'))
  assert.deepEqual(getRouteShot('turning-away'), getRouteShot('walking', 0))
  assert.deepEqual(getRouteShot('walking', 1), getRouteShot('turning-arrival'))
  assert.deepEqual(getRouteShot('turning-arrival'), getRouteShot('arrived'))
  assert.ok(Math.abs(getRouteShot('arrived').position[2] - 8.2) < 1e-10)
})

test('camera follows the characters without orbiting, reversing or crossing them', () => {
  let previousZ = Infinity
  for (let step = 0; step <= 1000; step++) {
    const p = step / 1000
    const shot = getRouteShot('walking', p)
    assert.equal(shot.position[0], 0)
    assert.ok(shot.position[2] <= previousZ)
    assert.ok(shot.position[2] - 17 * (1 - p) >= 5.5 - 1e-10)
    assert.ok(shot.fov >= 24 && shot.fov <= 34)
    previousZ = shot.position[2]
  }
})

test('camera damping has the same convergence at 30, 60 and 120 fps', () => {
  const simulate = (fps) => {
    let position = 0
    for (let frame = 0; frame < fps; frame++) {
      position += (1 - position) * dampingAmount(1 / fps)
    }
    return position
  }
  assert.ok(Math.abs(simulate(30) - simulate(60)) < 1e-10)
  assert.ok(Math.abs(simulate(60) - simulate(120)) < 1e-10)
  assert.equal(dampingAmount(0), 0)
})
test('portrait framing preserves route continuity and gives the cards more space', () => {
  assert.deepEqual(getRouteShot('walking', 1, true), getRouteShot('turning-arrival', 1, true))
  assert.deepEqual(getRouteShot('turning-arrival', 1, true), getRouteShot('arrived', 1, true))
  assert.deepEqual(getRouteShot('idle', 0, true), getRouteShot('walking', 0, true))
  const portrait = getRouteShot('arrived', 1, true)
  const desktop = getRouteShot('arrived')
  assert.ok(portrait.position[2] > desktop.position[2])
  assert.ok(portrait.target[1] > desktop.target[1])
})