import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { AnimationMixer, LoopOnce, LoopRepeat } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { prepareCharacterClips, blendWeights } from './characterMotion.mjs'
import { WALK_DURATION_MS, WALK_DISTANCE, getHostRoutePosition, dampingAmount } from './sceneMotion.mjs'
import { GARDEN_POSITIONS, hostsInGarden } from './gardenMotion.mjs'

export default function Character({ path, character, actionName, traveling, facingBack, walkProgress, gardenPhase, gardenProgress, onReady }) {
  const source = useGLTF(path)
  const group = useRef()
  const groundShadow = useRef()
  useEffect(() => { onReady?.() }, [onReady])
  const rig = useMemo(() => {
    const scene = clone(source.scene)
    const { clips, stride } = prepareCharacterClips(source.animations, character, character === 'barbara' ? 0.22 : 0.24)
    const mixer = new AnimationMixer(scene)
    const actions = clips.map(clip => mixer.clipAction(clip))
    const idle = clips.findIndex(c => c.name === 'Idle')
    return { scene, mixer, actions, clips, stride, idle, selected: idle, weights: clips.map((_, i) => i === idle ? 1 : 0) }
  }, [source.scene, source.animations, character])
  useEffect(() => {
    rig.actions[rig.idle].play()
    const index = rig.clips.findIndex(c => c.name === actionName)
    rig.selected = index < 0 ? rig.idle : index
    const action = rig.actions[rig.selected]
    const repeating = /Idle|Walking|Dance|Excited/.test(action.getClip().name)
    if (rig.weights[rig.selected] < 0.01 || action.time >= action.getClip().duration) action.reset()
    action.setLoop(repeating ? LoopRepeat : LoopOnce, Infinity)
    action.clampWhenFinished = true
    action.timeScale = actionName === 'Walking' ? (WALK_DISTANCE / (WALK_DURATION_MS / 1000)) * action.getClip().duration / rig.stride : /Idle/.test(actionName) ? 0.8 : /Dance/.test(actionName) ? 0.9 : 0.85
    action.play()
  }, [actionName, rig])
  useEffect(() => () => { rig.mixer.stopAllAction() }, [rig])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const active = rig.actions[rig.selected]
    if (active.loop === LoopOnce && active.time >= active.getClip().duration) {
      rig.selected = rig.idle
      rig.actions[rig.idle].play()
    }
    rig.weights = blendWeights(rig.weights, rig.selected, dt)
    rig.actions.forEach((action, index) => action.setEffectiveWeight(rig.weights[index]))
    rig.mixer.update(dt)
    const progress = traveling ? walkProgress.current : 0
    const inGarden = hostsInGarden(gardenPhase, gardenProgress.current)
    groundShadow.current.visible = inGarden
    const position = inGarden ? GARDEN_POSITIONS[character] : getHostRoutePosition(character, progress)
    group.current.position.set(...position)
    const target = facingBack ? Math.PI : 0
    const difference = Math.atan2(Math.sin(target - group.current.rotation.y), Math.cos(target - group.current.rotation.y))
    group.current.rotation.y += difference * dampingAmount(dt, 3.8)
  })
  return <group ref={group}>
    <primitive object={rig.scene} />
    {/* A small soft contact shadow anchors the feet without mobile shadow maps. */}
    <mesh ref={groundShadow} visible={false} position={[0, 0.003, 0.08]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <planeGeometry args={[0.85, 0.55]} />
      <shaderMaterial transparent depthWrite={false}
        vertexShader="varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
        fragmentShader="varying vec2 vUv; void main() { float r = length((vUv - 0.5) * 2.0); float a = 0.28 * pow(max(0.0, 1.0 - r * r), 2.0); gl_FragColor = vec4(0.12, 0.16, 0.13, a); }"
      />
    </mesh>
  </group>
}
