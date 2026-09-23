import { Quaternion } from 'three'

const lowerBody = /Hips|UpLeg|Leg|Foot|Toe/
const cyclic = /Walking|Dance|Excited|Idle/
const sample = (track, time = 0) => Array.from(track.createInterpolant().evaluate(time))

// These Blender exports use local Z as vertical and local Y as forward.
// Work on cloned clips; never change the shared GLTF cache.
export function prepareCharacterClips(animations, character, scale) {
  const idle = animations.find(c => c.name === 'Idle')
  const idleTracks = new Map(idle.tracks.map(t => [t.name, t]))
  // Preserve the approved walking anchor independently from the waiting pose.
  const anchorClip = animations.find(c => c.name === (character === 'barbara' ? 'Waving' : 'Idle'))
  const anchorTracks = new Map(anchorClip.tracks.map(t => [t.name, t]))
  const q = new Quaternion(), target = new Quaternion()
  const walk = animations.find(c => c.name === 'Walking').tracks.find(t => /Hips.position$/.test(t.name))
  const stride = Math.abs(walk.values[walk.values.length - 2] - walk.values[1]) * scale
  const clips = animations.map(c => c.clone())
  for (const clip of clips) {
    if (clip.name === 'Idle') continue // Use the original authored waiting animation unchanged.
    const stationary = !/Walking|Dance|Excited/.test(clip.name)
    for (const track of clip.tracks) {
      const size = track.getValueSize()
      if (stationary && lowerBody.test(track.name)) {
        const base = sample(idleTracks.get(track.name) || track)
        for (let i = 0; i < track.values.length; i += size) track.values.set(base, i)
      } else if (/Hips.position$/.test(track.name)) {
        const first = sample(track), last = sample(track, clip.duration)
        const anchor = sample(anchorTracks.get(track.name))
        for (let i = 0; i < track.times.length; i++) {
          const t = track.times[i] / clip.duration
          // Remove locomotion only on the ground plane, preserving vertical steps.
          for (let k = 0; k < 2; k++) track.values[i * 3 + k] += anchor[k] - first[k] - (last[k] - first[k]) * t
        }
      }
      if (cyclic.test(clip.name)) {
        const first = sample(track), seam = Math.min(0.18, clip.duration * 0.1)
        for (let i = 0; i < track.times.length; i++) {
          const t = Math.max(0, (track.times[i] - clip.duration + seam) / seam)
          const amount = t * t * (3 - 2 * t)
          if (!amount) continue
          if (track.name.endsWith('.quaternion')) q.fromArray(track.values, i * size).slerp(target.fromArray(first), amount).toArray(track.values, i * size)
          else for (let k = 0; k < size; k++) track.values[i * size + k] += (first[k] - track.values[i * size + k]) * amount
        }
      }
    }
  }
  return { clips, stride }
}

export function blendWeights(weights, selected, delta) {
  const amount = 1 - Math.exp(-7 * Math.min(Math.max(delta, 0), 0.05))
  return weights.map((weight, index) => weight + ((index === selected ? 1 : 0) - weight) * amount)
}
