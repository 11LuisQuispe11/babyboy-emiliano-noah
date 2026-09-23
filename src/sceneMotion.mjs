export const WALK_DURATION_MS = 14000

export function getRouteShot(phase, progress = 0, portrait = false) {
  const p = phase === 'arrived' || phase === 'turning-arrival'
    ? 1
    : phase === 'walking' ? Math.max(0, Math.min(1, progress)) : 0
  const ease = p * p * (3 - 2 * p)
  const characterZ = 17 * (1 - p)
  const portraitLift = portrait ? 0.35 * ease : 0
  const portraitDistance = portrait ? 1.5 * ease : 0
  return {
    position: [0, 2.1 + portraitLift, characterZ + 5.5 + 2.7 * ease + portraitDistance],
    target: [0, 1.5 - 0.1 * ease + portraitLift, characterZ - 0.5 * (1 - ease)],
    fov: 34 - 10 * ease,
  }
}

export function dampingAmount(delta, speed = 4) {
  return 1 - Math.exp(-speed * Math.max(0, delta))
}