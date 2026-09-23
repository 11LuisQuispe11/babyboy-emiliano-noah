import test from 'node:test'
import assert from 'node:assert/strict'
import { getRouteShot, dampingAmount, ROUTE_START_Z, WALK_DISTANCE, ROUTE_CENTER_X, getHostRoutePosition } from './sceneMotion.mjs'

test('camera framing remains continuous at every route boundary', () => {
  assert.deepEqual(getRouteShot('idle'), getRouteShot('turning-away'))
  assert.deepEqual(getRouteShot('turning-away'), getRouteShot('walking', 0))
  assert.deepEqual(getRouteShot('walking', 1), getRouteShot('turning-arrival'))
  assert.deepEqual(getRouteShot('turning-arrival'), getRouteShot('arrived'))
  assert.ok(Math.abs(getRouteShot('arrived').position[2] - 13.8) < 1e-10)
})

test('camera follows the characters without orbiting, reversing or crossing them', () => {
  let previousZ = Infinity
  for (let step = 0; step <= 1000; step++) {
    const p = step / 1000
    const shot = getRouteShot('walking', p)
    assert.equal(shot.position[0], ROUTE_CENTER_X)
    assert.ok(shot.position[2] <= previousZ)
    assert.ok(shot.position[2] - (ROUTE_START_Z - WALK_DISTANCE * p) >= 2.7 - 1e-10)
    assert.ok(shot.fov >= 34 && shot.fov <= 55)
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
test('both hosts walk straight through the raised doorway and stop close to the second door', () => {
  for (let i = 0; i <= 100; i++) {
    const barbara = getHostRoutePosition('barbara', i / 100)
    const luis = getHostRoutePosition('luis', i / 100)
    assert.ok(barbara[0] - 0.32 > 0.22, 'Barbara overlaps the left jamb')
    assert.ok(luis[0] + 0.32 < 1.82, 'Luis overlaps the right jamb')
    assert.ok(luis[0] - barbara[0] >= 0.63, 'hosts overlap')
    assert.equal(barbara[1], luis[1])
    assert.equal(barbara[2], luis[2])
    assert.equal(getRouteShot('walking', i / 100).target[0], (barbara[0] + luis[0]) / 2)
  }
  const arrival = getHostRoutePosition('barbara', 1)
  assert.ok(arrival[2] - 0.27 > 10.616, 'host intersects the closed second door')
  assert.ok(arrival[2] - 10.616 < 0.5, 'host is too far from the second door')
})
