import { Quaternion } from 'three'

const lowerBody = /Hips|UpLeg|Leg|Foot|Toe/
const torso = /Spine|Shoulder|Neck/
const cyclic = /Walking|Dance|Idle/
const sample = (track, time = 0) => Array.from(track.createInterpolant().evaluate(time))

// These Blender exports use local Z as vertical and local Y as forward.
// Work on cloned clips; never change the shared GLTF cache.
export function prepareCharacterClips(animations, character, scale) {
  const reference = animations.find(c => c.name === (character === 'barbara' ? 'Waving' : 'Idle'))
  const breathing = animations.find(c => c.name === (character === 'barbara' ? 'Breathing Idle' : 'Idle'))
  const referenceTracks = new Map(reference.tracks.map(t => [t.name, t]))
  const idle = breathing.clone()
  idle.name = 'Relaxed Idle'
  const q = new Quaternion(), target = new Quaternion()
  for (const track of idle.tracks) {
    const base = sample(referenceTracks.get(track.name) || track)
    const start = sample(track)
    const size = track.getValueSize()
    for (let i = 0; i < track.values.length; i += size) {
      if (lowerBody.test(track.name)) track.values.set(base, i)
      else if (track.name.endsWith('.quaternion')) {
        q.fromArray(track.values, i)
        target.fromArray(torso.test(track.name) ? base : start)
        target.slerp(q, 0.22).toArray(track.values, i)
      } else if (track.name.endsWith('.position')) {
        for (let k = 0; k < size; k++) track.values[i + k] = start[k] + (track.values[i + k] - start[k]) * 0.22
      }
    }
  }
  const idleTracks = new Map(idle.tracks.map(t => [t.name, t]))
  const walk = animations.find(c => c.name === 'Walking').tracks.find(t => /Hips.position$/.test(t.name))
  const stride = Math.abs(walk.values[walk.values.length - 2] - walk.values[1]) * scale
  const clips = [...animations.map(c => c.clone()), idle]
  for (const clip of clips) {
    const stationary = !/Walking|Dance/.test(clip.name)
    for (const track of clip.tracks) {
      const size = track.getValueSize()
      if (stationary && lowerBody.test(track.name)) {
        const base = sample(idleTracks.get(track.name) || track)
        for (let i = 0; i < track.values.length; i += size) track.values.set(base, i)
      } else if (/Hips.position$/.test(track.name)) {
        const first = sample(track), last = sample(track, clip.duration)
        const anchor = sample(idleTracks.get(track.name))
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
