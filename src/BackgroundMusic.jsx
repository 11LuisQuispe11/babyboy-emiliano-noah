import { useEffect, useRef, useState } from 'react'
import songUrl from '../Cancion.mp3'

export default function BackgroundMusic() {
  const audio = useRef(null)
  const pausedByUser = useRef(false)
  const started = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const player = audio.current
    player.volume = 0.4
    let active = true
    const attempt = () => {
      if (pausedByUser.current) return
      player.play().catch(error => {
        if (active && error.name !== 'NotAllowedError' && error.name !== 'AbortError') setFailed(true)
      })
    }
    const gesture = event => {
      if (event.target.closest?.('.music-toggle') || started.current || pausedByUser.current) return
      if (event.type === 'keydown' && (event.repeat || !['Enter', ' '].includes(event.key))) return
      attempt()
    }
    attempt()
    document.addEventListener('click', gesture)
    document.addEventListener('keydown', gesture)
    return () => { active = false; document.removeEventListener('click', gesture); document.removeEventListener('keydown', gesture); player.pause() }
  }, [])
  const toggle = () => {
    const player = audio.current
    if (!player.paused) { pausedByUser.current = true; player.pause() }
    else { pausedByUser.current = false; setFailed(false); player.play().catch(() => setFailed(true)) }
  }
  const label = failed ? 'Reintentar música' : playing ? 'Pausar música' : 'Activar música'
  return <>
    <audio ref={audio} src={songUrl} loop preload="metadata" onPlaying={() => { started.current = true; setPlaying(true); setFailed(false) }} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />
    <button type="button" className="music-toggle" onClick={toggle} aria-label={label} title={label} aria-pressed={playing}><span aria-hidden="true">{playing ? 'Ⅱ' : '♫'}</span></button>
  </>
}