import { CatmullRomCurve3, Vector3 } from 'three'
import { getRouteShot } from './sceneMotion.mjs'

export const GARDEN_DURATIONS = { travel: 14000, panorama: 10000, reveal: 1400 }
export const GARDEN_POSITIONS = { barbara: [-0.48, 0.02, -34.2], luis: [0.48, 0.02, -34.2] }
export const ease = (value) => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p) }
const blend = (a, b, t) => a + (b - a) * t

const routes = [false, true].map((portrait) => {
  const start = getRouteShot('arrived', 1, portrait)
  const y = portrait ? 2.65 : 2.1
  const points = [start.position, [0, y, 2], [0, y, 0.05], [-1.5, y, -0.2], [-4.9, y, -0.2], [-5.45, y, -1.2], [-5.45, y, -8], [-5.45, y, -16], [-4.8, y, -18], [-1.5, y, -21], [0, y, -24], [0, y, -28]]
  const curve = new CatmullRomCurve3(points.map(p => new Vector3(...p)), false, 'centripetal')
  curve.arcLengthDivisions = 600
  curve.updateArcLengths()
  return curve
})

export function getGardenShot(phase, progress, portrait = false) {
  const p = Math.max(0, Math.min(1, progress))
  const y = portrait ? 2.65 : 2.1
  const targetY = portrait ? 1.55 : 1.25
  const position = [0, y, -28]
  const target = [0, targetY, -34.2]
  if (phase === 'travel') {
    const start = getRouteShot('arrived', 1, portrait)
    const curve = routes[portrait ? 1 : 0]
    const t = ease(p)
    const point = curve.getPointAt(t)
    const direction = curve.getTangentAt(Math.min(t + 0.025, 1))
    const ahead = point.clone().addScaledVector(direction, 6.2)
    const movingTarget = [ahead.x, targetY, ahead.z]
    const entry = ease(p / 0.12)
    const exit = ease((p - 0.88) / 0.12)
    return {
      position: point.toArray(),
      target: movingTarget.map((v, i) => blend(blend(start.target[i], v, entry), target[i], exit)),
      fov: blend(start.fov, 58, ease(p / 0.3)),
    }
  }
  if (phase === 'panorama') {
    const angle = Math.PI * 2 * ease(p)
    return { position, target: [6.2 * Math.sin(angle), targetY, -28 - 6.2 * Math.cos(angle)], fov: 58 }
  }
  return { position, target, fov: blend(58, portrait ? 48 : 40, phase === 'reveal' ? ease(p) : 1) }
}

export function hostsInGarden(phase, progress) {
  // Reposition while the camera faces away; they are waiting when the turn ends.
  return phase === 'ready' || phase === 'reveal' || (phase === 'panorama' && progress >= 0.5)
}