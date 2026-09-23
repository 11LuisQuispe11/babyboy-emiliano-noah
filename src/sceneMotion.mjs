// Both doors share the raised path at x = 0.22..1.82 in scene coordinates.
export const ROUTE_CENTER_X = 0.98
export const HOST_SEPARATION = 0.64
export const ROUTE_FLOOR_Y = 0.18
export const ROUTE_START_Z = 17
export const ROUTE_END_Z = 11.1
export const WALK_DISTANCE = ROUTE_START_Z - ROUTE_END_Z
export const WALK_DURATION_MS = 7000

export function getHostRoutePosition(character, progress = 0) {
  const p = Math.max(0, Math.min(1, progress))
  return [
    ROUTE_CENTER_X + (character === 'barbara' ? -1 : 1) * HOST_SEPARATION / 2,
    ROUTE_FLOOR_Y,
    ROUTE_START_Z - WALK_DISTANCE * p,
  ]
}

export function getRouteShot(phase, progress = 0, portrait = false) {
  const p = phase === 'arrived' || phase === 'turning-arrival'
    ? 1
    : phase === 'walking' ? Math.max(0, Math.min(1, progress)) : 0
  const ease = p * p * (3 - 2 * p)
  const characterZ = ROUTE_START_Z - WALK_DISTANCE * p
  const portraitLift = portrait ? 0.35 * ease : 0
  const portraitDistance = portrait ? 0.15 * ease : 0
  return {
    position: [ROUTE_CENTER_X, 2.1 + portraitLift, characterZ + 5.5 - 2.8 * ease + portraitDistance],
    target: [ROUTE_CENTER_X, 1.5 - 0.1 * ease + portraitLift, characterZ - 0.5 * (1 - ease)],
    fov: 34 + (portrait ? 29 : 21) * ease,
  }
}

export function dampingAmount(delta, speed = 4) {
  return 1 - Math.exp(-speed * Math.max(0, delta))
}