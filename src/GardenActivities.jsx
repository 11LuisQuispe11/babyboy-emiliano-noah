import { useEffect, useRef } from 'react'

export const GARDEN_PROGRAM = [
  { time: '3:00 p. m.', title: 'Recepción y fotos', description: 'Recibimos a nuestros invitados y guardamos las primeras fotos de esta tarde especial.', barbara: 'Waving', luis: 'Standing Greeting' },
  { time: '3:30 p. m.', title: 'Show de babyshower', description: '¡Comienza el show! Un momento para compartir, reír y celebrar juntos a Emiliano Noah.', barbara: 'Step Hip Hop Dance', luis: 'Step Hip Hop Dance' },
  { time: '3:30–6:30 p. m.', title: 'Reclamo de platos y snacks', description: 'Recoge tus platos y snacks de 3:30 a 6:30 p. m.', barbara: 'Standing Greeting', luis: 'Waving' },
  { time: '3:30–5:50 p. m.', title: 'Reclamo de cócteles', description: 'Recoge tus cócteles de 3:30 a 5:50 p. m.', barbara: 'Waving', luis: 'Standing Greeting' },
  { time: '5:00 p. m.', title: 'Regalos con baile', description: 'La entrega de regalos llega con un paso de baile de cada invitado. ¡Prepara el tuyo!', barbara: 'Thankful', luis: 'Thankful' },
  { time: '6:00 p. m.', title: '¡Todos a bailar!', description: 'Música para bailar, divertirnos y seguir disfrutando juntos.', barbara: 'Excited', luis: 'ExcitedAmazing' },
]

export default function GardenActivities({ selected, onSelect, onGifts }) {
  const heading = useRef(null)
  const activity = GARDEN_PROGRAM[selected]
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  return (
    <section className="garden-program" aria-labelledby="garden-heading">
      <div className="garden-information">
        <header className="garden-heading">
          <h1 id="garden-heading" tabIndex={-1} ref={heading}>Así celebraremos</h1>
        </header>
        <div className="garden-schedule" aria-label="Programa del evento">
          {GARDEN_PROGRAM.map((item, index) => (
            <button key={item.time} type="button" className={`garden-slot${selected === index ? ' is-selected' : ''}`} aria-pressed={selected === index} aria-controls="garden-activity" onClick={() => onSelect(index)}>
              <span className="garden-slot-time">{item.time}</span><strong>{item.title}</strong><span className="garden-slot-action">{selected === index ? 'Viendo ahora ✓' : 'Descubrir →'}</span>
            </button>
          ))}
        </div>
        <div id="garden-activity" className="garden-activity" aria-live="polite" aria-atomic="true">
          <p key={selected}>{activity.description}</p>
        </div>
      </div>
      <button className="scene-next event-continue" onClick={onGifts} type="button">Confirmar asistencia <span aria-hidden="true">→</span></button>
    </section>
  )
}
