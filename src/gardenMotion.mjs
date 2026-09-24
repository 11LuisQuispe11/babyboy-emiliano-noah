import { getRouteShot } from './sceneMotion.mjs'

export const GARDEN_DURATIONS = { sunlight: 3200 }
// The garden floor is at y = 0, unlike the raised entrance path (0.18 m).
// Step forward from the backdrop; 2 mm compensates for the shoe mesh baseline.
export const GARDEN_POSITIONS = { barbara: [-1.68, 0.002, -2.35], luis: [-0.72, 0.002, -2.35] }
export const ease = (value) => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p) }

// The camera and hosts change together under the fully opaque sunlight.
export function sunlightOpacity(phase, progress) {
  if (phase !== 'sunlight') return 0
  return progress < 0.4 ? ease(progress / 0.4) : progress <= 0.65 ? 1 : 1 - ease((progress - 0.65) / 0.35)
}

export function getGardenShot(phase, progress, portrait = false) {
  if (phase === 'sunlight' && progress < 0.5) return getRouteShot('arrived', 1, portrait)
  return {
    position: [-1.2, portrait ? 2.65 : 2.1, 3.5],
    target: [-1.2, portrait ? 1.85 : 1.25, -2.7],
    fov: portrait ? 48 : 40,
  }
}

export function hostsInGarden(phase, progress) {
  return phase === 'ready' || (phase === 'sunlight' && progress >= 0.5)
}
