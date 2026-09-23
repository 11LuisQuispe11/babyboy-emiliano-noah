import { PropertyType } from '@gltf-transform/core'
import { prune } from '@gltf-transform/functions'
import { CHARACTER_ANIMATIONS } from '../src/characterAnimations.mjs'

export async function retainUsedAnimations(document, character) {
  const keep = CHARACTER_ANIMATIONS[character]
  const animations = document.getRoot().listAnimations()
  for (const name of keep) {
    if (!animations.some(animation => animation.getName() === name)) throw new Error(`${character}: missing ${name}`)
  }
  const removed = []
  for (const animation of animations) {
    if (keep.includes(animation.getName())) continue
    removed.push(animation.getName())
    for (const channel of animation.listChannels()) channel.dispose()
    for (const sampler of animation.listSamplers()) sampler.dispose()
    animation.dispose()
  }
  await document.transform(prune({ propertyTypes: [PropertyType.ACCESSOR], keepAttributes: true }))
  return removed
}
