import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, useGLTF, useProgress } from '@react-three/drei'

import mobileAssets from './mobileAssets.json'
import { shouldUseMobileAssets } from './renderProfile.mjs'
import { Vector3 } from 'three'
import Character from './Character.jsx'
import RenderLifecycle from './RenderLifecycle.jsx'
import { dampingAmount, getRouteShot, WALK_DURATION_MS } from './sceneMotion.mjs'

import { invitationName } from './invitationName.mjs'
import BackgroundMusic from './BackgroundMusic.jsx'
import Attendance from './Attendance.jsx'
import GiftRegistry from './GiftRegistry.jsx'
import GardenActivities, { GARDEN_PROGRAM } from './GardenActivities.jsx'
import { GARDEN_DURATIONS, GARDEN_POSITIONS, getGardenShot, hostsInGarden } from './gardenMotion.mjs'

const MOBILE_RENDERING = shouldUseMobileAssets({ coarsePointer: window.matchMedia('(pointer: coarse)').matches, touchPoints: navigator.maxTouchPoints, screenWidth: window.screen.width, deviceMemory: navigator.deviceMemory, saveData: navigator.connection?.saveData })
const SCENE_PATH = import.meta.env.BASE_URL + (MOBILE_RENDERING ? mobileAssets.scene : 'models/EscenarioV3.glb?v=046b5a70e2da7afe')
const BARBARA_PATH = import.meta.env.BASE_URL + (MOBILE_RENDERING ? mobileAssets.barbara : 'models/Barbara_TEST_14AnimacionesV2.glb')
const LUIS_PATH = import.meta.env.BASE_URL + (MOBILE_RENDERING ? mobileAssets.luis : 'models/LuisAnimado.glb')
const PREVIEW_GIFTS = import.meta.env.DEV && new URLSearchParams(window.location.search).get('escena') === '4'
const PREVIEW_GARDEN = import.meta.env.DEV && new URLSearchParams(window.location.search).get('escena') === '3'
const PREVIEW_DETAILS = import.meta.env.DEV && new URLSearchParams(window.location.search).get('escena') === '2'
const INITIAL_SHOT = (PREVIEW_GARDEN || PREVIEW_GIFTS) ? getGardenShot('ready', 1, window.innerWidth <= 640 && window.innerHeight > window.innerWidth) : getRouteShot(PREVIEW_DETAILS ? 'arrived' : 'idle', 0, window.innerWidth <= 640 && window.innerHeight > window.innerWidth)
const MAP_URL = 'https://maps.app.goo.gl/uFatNXWL8boXHFGy6'

function getGuestName() {
  return invitationName(window.location.search) || 'Invitado'
}

function getDialogue(guestName) {
  return [
    {
      speaker: 'BARBARA',
      action: 'Standing Greeting',
      text: `Hola ${guestName}, soy Barbara. Queremos invitarte a nuestro Babyshower y nos encantaría contar con tu presencia.`,
    },
    {
      speaker: 'LUIS',
      action: 'Waving',
      text: `Hola ${guestName}, soy Luis. Nos haría muy felices compartir contigo este día tan especial.`,
    },
    {
      speaker: 'BARBARA',
      action: 'Idle',
      text: 'Estamos preparando una reunión llena de cariño para celebrar la llegada de nuestro pequeño hijo Emiliano Noah.',
    },
    {
      speaker: 'LUIS',
      action: 'Idle',
      text: 'Tu compañía hará que este momento sea todavía más especial. Queremos verte allí con nosotros.',
    },
    {
      speaker: 'BARBARA',
      action: 'Idle',
      text: 'Cuando quieras, acompáñanos para conocer la fecha, el lugar y todos los detalles. ¡Esperamos contar contigo!',
    },
  ]
}

const EVENT_DETAILS = [
  {
    speaker: 'BARBARA',
    label: 'FECHA',
    value: 'Domingo 8 de noviembre',
    detail: 'Reserva este día para celebrar juntos la llegada de Emiliano Noah.',
  },
  {
    speaker: 'LUIS',
    label: 'HORA',
    value: 'Desde las 3:00 p. m.',
    detail: 'Te esperamos con mucha ilusión para compartir una tarde especial.',
  },
  {
    speaker: 'BARBARA',
    label: 'LUGAR',
    value: 'La Hacienda Blanca',
    detail: 'Lurigancho-Chosica, Provincia de Lima.',
  },
]


function Scenario({ onReady }) {
  const { scene } = useGLTF(SCENE_PATH)

  useEffect(() => {
    scene.traverse((object) => {
      if (!object.isMesh) return

      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (material?.name === 'VEN_grass') {
          material.color.set('#6f9f4a')
          material.needsUpdate = true
        }
      })
    })
  }, [scene])

  useEffect(() => { onReady() }, [onReady])

  // Align the authored entrance with the invitation route; preserve meter scale.
  return <group position={[-7.9, 0, 18]}><primitive object={scene} /></group>
}

function RouteProgress({ routePhase, walkProgress, onArrive }) {
  useFrame((_, delta) => {
    if (routePhase !== 'walking') return
    walkProgress.current = Math.min(1, walkProgress.current + Math.min(delta, 0.05) * 1000 / WALK_DURATION_MS)
    if (walkProgress.current >= 1) onArrive('turning-arrival')
  }, -1)
  return null
}

function CameraTransition({ routePhase, walkProgress, exploring, gardenPhase, gardenProgress, onGardenPhase }) {
  const { camera, size } = useThree()
  const focus = useRef(new Vector3(...INITIAL_SHOT.target))
  const destination = useMemo(() => new Vector3(), [])

  useFrame((_, delta) => {
    if (exploring) return
    if (gardenPhase !== 'idle') {
      const duration = GARDEN_DURATIONS[gardenPhase]
      if (duration) gardenProgress.current = Math.min(1, gardenProgress.current + Math.min(delta, 0.05) * 1000 / duration)
      const shot = getGardenShot(gardenPhase, gardenProgress.current, size.width <= 640 && size.height > size.width)
      camera.position.set(...shot.position)
      camera.lookAt(...shot.target)
      if (camera.fov !== shot.fov) { camera.fov = shot.fov; camera.updateProjectionMatrix() }
      if (duration && gardenProgress.current >= 1) {
        gardenProgress.current = 0
        onGardenPhase(gardenPhase === 'travel' ? 'panorama' : gardenPhase === 'panorama' ? 'reveal' : 'ready')
      }
      return
    }
    const shot = getRouteShot(routePhase, walkProgress.current, size.width <= 640 && size.height > size.width)
    const amount = dampingAmount(delta)
    camera.position.lerp(destination.set(...shot.position), amount)
    focus.current.lerp(destination.set(...shot.target), amount)
    camera.lookAt(focus.current)
    const fov = camera.fov + (shot.fov - camera.fov) * amount
    if (Math.abs(camera.fov - shot.fov) > 0.001) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}
function ExploreCamera({ active, joystick }) {
  const { camera } = useThree()

  useFrame((_, delta) => {
    if (!active) return
    camera.position.x += joystick.x * delta * 4
    camera.position.z += joystick.y * delta * 4
    camera.position.x = Math.max(-5.3, Math.min(3.5, camera.position.x))
    camera.position.z = Math.max(-3.5, Math.min(17.8, camera.position.z))
    camera.lookAt(camera.position.x, 1.5, camera.position.z - 5)
  })

  return null
}

function IntroScreen({ onComplete, assetsReady }) {
  const { active, progress, errors } = useProgress()
  const ready = assetsReady && !active && progress >= 100 && errors.length === 0
  useEffect(() => {
    if (!ready) return undefined
    const timer = window.setTimeout(onComplete, 1600)
    return () => window.clearTimeout(timer)
  }, [ready, onComplete])
  return (
    <section className={`intro-screen invitation-loading${ready ? ' is-ready' : ''}`} aria-label="Preparando tu invitación">
      <div className="loading-halo" aria-hidden="true" />
      <div className="intro-content">
        <p className="intro-kicker">UNA PEQUEÑA VIDA. UN AMOR INMENSO.</p>
        <div className="loading-emblem" aria-hidden="true"><span className="loading-orbit" /><span className="loading-star">✦</span><span className="loading-monogram">en</span><span className="loading-spark">✧</span></div>
        <p className="loading-dedication">Algo hermoso está por comenzar</p>
        <h1>Emiliano<span>Noah</span></h1>
        <p className="loading-signature">Con amor, Barbara y Luis</p>
        <div className="loading-status" role="status">{errors.length ? 'No pudimos preparar la invitación. Intenta nuevamente.' : ready ? 'Todo listo. Bienvenido a nuestra historia.' : 'Estamos preparando un lugar para ti…'}</div>
        <div className="intro-progress" role="progressbar" aria-label="Carga de la invitación" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
        {errors.length > 0 && <button className="loading-retry" onClick={() => window.location.reload()}>Volver a intentar</button>}
        <p className="loading-footer">UN DÍA PARA COMPARTIR · UN RECUERDO PARA SIEMPRE</p>
      </div>
    </section>
  )
}

function WelcomeSequence({ guestName, onActionChange, onContinue, leaving }) {
  const dialogueLines = useMemo(() => getDialogue(guestName), [guestName])
  const [dialogueIndex, setDialogueIndex] = useState(0)
  const [revealedText, setRevealedText] = useState('')
  const [readyToWalk, setReadyToWalk] = useState(false)
  const dialogue = dialogueLines[dialogueIndex]

  useEffect(() => {
    if (leaving) return undefined
    let characterIndex = 0
    let nextDialogueTimer
    setRevealedText('')
    onActionChange(dialogue.speaker, dialogue.action)

    const typewriter = window.setInterval(() => {
      characterIndex += 1
      setRevealedText(dialogue.text.slice(0, characterIndex))
      if (characterIndex >= dialogue.text.length) {
        window.clearInterval(typewriter)
        onActionChange(dialogue.speaker, 'Idle')
        nextDialogueTimer = window.setTimeout(() => {
          if (dialogueIndex >= dialogueLines.length - 1) {
            setReadyToWalk(true)
            return
          }
          setDialogueIndex((currentIndex) => currentIndex + 1)
        }, 1200)
      }
    }, 32)

    return () => {
      window.clearInterval(typewriter)
      window.clearTimeout(nextDialogueTimer)
    }
  }, [dialogue, dialogueIndex, dialogueLines.length, onActionChange, leaving])

  return (
    <section className={`welcome-layer${leaving ? ' welcome-layer-leaving' : ''}`} inert={leaving} aria-label="Bienvenida de Barbara y Luis">
      <p className="welcome-title">Invitación para {guestName}</p>
      <div className={`thought-bubble thought-${dialogue.speaker.toLowerCase()}`} role="status">
        <span className="thought-name">{dialogue.speaker}</span>
        <span className="thought-text">{revealedText}<span className="typing-cursor" aria-hidden="true">|</span></span>
      </div>
      <p className={`welcome-hint ${readyToWalk ? 'welcome-hint-ready' : ''}`}>
        {!readyToWalk && 'La bienvenida continuará automáticamente'}
      </p>
      {!readyToWalk && <button className="welcome-skip" onClick={onContinue} type="button">Ver información del evento <span aria-hidden="true">→</span></button>}
      {readyToWalk && (
        <button className="continue-float" aria-label="Continuar" onClick={onContinue} type="button">
          <span aria-hidden="true">-&gt;</span>
        </button>
      )}
    </section>
  )
}

function EventDetails({ onActivities }) {
  const mapUrl = MAP_URL
  const heading = useRef(null)

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  return (
    <section className="event-details" aria-labelledby="event-heading">
      <div className="event-information">
      <header className="event-heading"><p>TE ESPERAMOS</p><h1 id="event-heading" ref={heading} tabIndex={-1}>Un día para celebrar</h1></header>
      <div className="event-cards">
      {EVENT_DETAILS.map((detail, index) => (
        <article className={`event-card event-card-${index} event-details-${detail.speaker.toLowerCase()}`} key={detail.label} aria-labelledby={`event-label-${index}`}>
          <h2 className="event-label" id={`event-label-${index}`}>{detail.label}</h2>
          <strong>{detail.value}</strong>
          <p>{detail.detail}</p>
          {detail.label === 'LUGAR' && (
            <a className="map-link" href={mapUrl} target="_blank" rel="noreferrer" aria-label="Abrir ubicación en Google Maps">
              <span aria-hidden="true">↗</span>
              Abrir mapa
            </a>
          )}
        </article>
      ))}
      </div>
      </div>
      <button className="scene-next event-continue" onClick={onActivities} type="button" aria-label="Continuar a actividades">
          Continuar <span aria-hidden="true">-&gt;</span>
        </button>
    </section>
  )
}

function VirtualJoystick({ onMove }) {
  const handlePointer = (event) => {
    if (event.type === 'pointermove' && !event.currentTarget.hasPointerCapture(event.pointerId)) return
    if (event.type === 'pointerdown') event.currentTarget.setPointerCapture(event.pointerId)
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    onMove({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) })
  }

  return (
    <div className="joystick" onPointerDown={handlePointer} onPointerMove={handlePointer} onPointerUp={() => onMove({ x: 0, y: 0 })} onPointerCancel={() => onMove({ x: 0, y: 0 })} role="application" aria-label="Joystick para recorrer La Hacienda Blanca">
      <span />
    </div>
  )
}

export default function App() {
  const [contextLost, setContextLost] = useState(false)
  const loseContext = useCallback(() => setContextLost(true), [])
  const restoreContext = useCallback(() => setContextLost(false), [])
  const [assetStage, setAssetStage] = useState(0)
  const sceneReady = useCallback(() => setAssetStage(stage => Math.max(stage, 1)), [])
  const barbaraReady = useCallback(() => setAssetStage(stage => Math.max(stage, 2)), [])
  const luisReady = useCallback(() => setAssetStage(3), [])
  const [welcomeStarted, setWelcomeStarted] = useState(PREVIEW_DETAILS || PREVIEW_GARDEN || PREVIEW_GIFTS)
  const [routePhase, setRoutePhase] = useState(PREVIEW_DETAILS || PREVIEW_GARDEN || PREVIEW_GIFTS ? 'arrived' : 'idle')
  const walkProgress = useRef(PREVIEW_DETAILS || PREVIEW_GARDEN || PREVIEW_GIFTS ? 1 : 0)
  const [infoScene, setInfoScene] = useState(PREVIEW_GIFTS ? 'attendance' : PREVIEW_GARDEN ? 'activities' : 'details')
  const [gardenPhase, setGardenPhase] = useState(PREVIEW_GARDEN || PREVIEW_GIFTS ? 'ready' : 'idle')
  const gardenProgress = useRef(0)
  const [selectedActivity, setSelectedActivity] = useState(0)
  const startGarden = useCallback(() => { gardenProgress.current = 0; setGardenPhase('travel'); setInfoScene('activities') }, [])
  const [exploring, setExploring] = useState(false)
  const [danceBarbara, setDanceBarbara] = useState(false)
  const [danceLuis, setDanceLuis] = useState(false)
  const [joystick, setJoystick] = useState({ x: 0, y: 0 })
  const [barbaraAction, setBarbaraAction] = useState('Standing Greeting')
  const [luisAction, setLuisAction] = useState('Idle')

  const handleDialogueAction = useCallback((speaker, action) => {
    if (speaker === 'BARBARA') {
      setBarbaraAction(action)
      setLuisAction('Idle')
      return
    }

    setBarbaraAction('Idle')
    setLuisAction(action)
  }, [])

  const guestName = getGuestName()
  const startWalking = useCallback(() => {
    setRoutePhase('turning-away')
  }, [])

  useEffect(() => {
    document.title = `Invitación para ${guestName} | Babyshower de Emiliano Noah`
  }, [guestName])

  useEffect(() => {
    if (routePhase === 'turning-away') {
      const timer = window.setTimeout(() => setRoutePhase('walking'), 1600)
      return () => window.clearTimeout(timer)
    }

    if (routePhase === 'turning-arrival') {
      const timer = window.setTimeout(() => setRoutePhase('arrived'), 1600)
      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [routePhase])


  return (
    <main className="app-shell" data-garden-phase={gardenPhase}>
      <BackgroundMusic />
      {contextLost && <section className="intro-screen" role="alert"><div className="intro-content"><h1>Tu invitaci?n sigue aqu?</h1><p>El tel?fono interrumpi? la vista 3D. Espera un momento o vuelve a abrir la invitaci?n.</p><p>Domingo 8 de noviembre ? 3:00 p. m.</p><p>La Hacienda Blanca, Lurigancho-Chosica.</p><a href={MAP_URL} target="_blank" rel="noreferrer">Ver ubicaci?n</a></div></section>}
      <Canvas dpr={MOBILE_RENDERING ? 1 : [1, 1.5]} gl={{ antialias: !MOBILE_RENDERING, alpha: true, powerPreference: MOBILE_RENDERING ? 'low-power' : 'default' }} camera={{ position: INITIAL_SHOT.position, fov: INITIAL_SHOT.fov, near: 0.1, far: 180 }}>
        <RenderLifecycle onContextLost={loseContext} onContextRestored={restoreContext} />
        <RouteProgress routePhase={routePhase} walkProgress={walkProgress} onArrive={setRoutePhase} />
        <ambientLight intensity={0.65} />
        {MOBILE_RENDERING && <hemisphereLight args={['#ffffff', '#9aa68b', 0.65]} />}
        <directionalLight position={[4, 6, 4]} intensity={0.9} />
        <Suspense fallback={null}>
          <Scenario onReady={sceneReady} />
        </Suspense>
        <Suspense fallback={null}>
          {assetStage >= 1 && <>
          <Character path={BARBARA_PATH} character="barbara" onReady={barbaraReady}
            actionName={exploring ? (danceBarbara ? 'Step Hip Hop Dance' : 'Idle') : gardenPhase !== 'idle' ? (gardenPhase === 'ready' ? GARDEN_PROGRAM[selectedActivity].barbara : 'Idle') : routePhase === 'turning-away' || routePhase === 'turning-arrival' ? 'Idle' : routePhase === 'walking' ? 'Walking' : routePhase === 'arrived' && infoScene === 'details' ? 'Idle' : barbaraAction}
            traveling={routePhase !== 'idle'}
            facingBack={routePhase === 'turning-away' || routePhase === 'walking'}
            walkProgress={walkProgress} gardenPhase={gardenPhase} gardenProgress={gardenProgress}
          />
          </>}
        </Suspense>
        <Suspense fallback={null}>
          {assetStage >= 2 && <>
          <Character path={LUIS_PATH} character="luis" onReady={luisReady}
            actionName={exploring ? (danceLuis ? 'Step Hip Hop Dance' : 'Idle') : gardenPhase !== 'idle' ? (gardenPhase === 'ready' ? GARDEN_PROGRAM[selectedActivity].luis : 'Idle') : routePhase === 'turning-away' || routePhase === 'turning-arrival' ? 'Idle' : routePhase === 'walking' ? 'Walking' : routePhase === 'arrived' && infoScene === 'details' ? 'Idle' : luisAction}
            traveling={routePhase !== 'idle'}
            facingBack={routePhase === 'turning-away' || routePhase === 'walking'}
            walkProgress={walkProgress} gardenPhase={gardenPhase} gardenProgress={gardenProgress}
          />
          </>}
          {!MOBILE_RENDERING && <Environment preset="studio" environmentIntensity={0.45} />}
        </Suspense>
        <CameraTransition routePhase={routePhase} walkProgress={walkProgress} exploring={exploring} gardenPhase={gardenPhase} gardenProgress={gardenProgress} onGardenPhase={setGardenPhase} />
        <ExploreCamera active={exploring} joystick={joystick} />
      </Canvas>

      {!contextLost && !welcomeStarted && <IntroScreen assetsReady={assetStage === 3} onComplete={() => setWelcomeStarted(true)} />}
      {welcomeStarted && (routePhase === 'idle' || routePhase === 'turning-away') && <WelcomeSequence leaving={routePhase !== 'idle'} guestName={guestName} onActionChange={handleDialogueAction} onContinue={startWalking} />}
      {routePhase !== 'idle' && routePhase !== 'arrived' && <div className="walk-caption">Barbara y Luis están entrando...</div>}
      {routePhase === 'arrived' && infoScene === 'details' && <EventDetails onActivities={startGarden} />}
      {routePhase === 'arrived' && gardenPhase === 'ready' && infoScene === 'activities' && <GardenActivities selected={selectedActivity} onSelect={setSelectedActivity} onGifts={() => setInfoScene('attendance')} />}
      {!exploring && routePhase === 'arrived' && infoScene === 'attendance' && <Attendance onBack={() => setInfoScene('activities')} onContinue={() => setInfoScene('gifts')} />}
      {!exploring && routePhase === 'arrived' && infoScene === 'gifts' && <GiftRegistry onBack={() => setInfoScene('attendance')} onExplore={() => { setDanceBarbara(false); setDanceLuis(false); setExploring(true) }} />}
      {gardenPhase !== 'idle' && gardenPhase !== 'ready' && <div className="garden-journey" role="status">{gardenPhase === 'travel' ? 'Vamos al jardín…' : gardenPhase === 'panorama' ? 'Conoce el lugar donde celebraremos' : '¡Bienvenidos al jardín!'}</div>}
      {exploring && <section className="explore-hud" aria-label="Exploración de La Hacienda Blanca"><span>Explora La Hacienda Blanca</span><div className="garden-play-controls"><button type="button" aria-pressed={danceLuis} onClick={() => setDanceLuis(value => !value)}>{danceLuis ? 'Detener a Luis' : 'Haz bailar a Luis'}</button><button type="button" aria-pressed={danceBarbara} onClick={() => setDanceBarbara(value => !value)}>{danceBarbara ? 'Detener a Barbara' : 'Haz bailar a Barbara'}</button><button type="button" onClick={() => { setJoystick({ x: 0, y: 0 }); setExploring(false) }}>Volver a los regalos</button></div><VirtualJoystick onMove={setJoystick} /></section>}
    </main>
  )
}
