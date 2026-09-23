import { useEffect, useRef } from 'react'

export const GARDEN_PROGRAM = [
  { time: '3:00 p. m.', title: 'Recepción y fotos', description: 'Recibimos a nuestros invitados y guardamos las primeras fotos de esta tarde especial.', barbara: 'Waving', luis: 'Standing Greeting' },
  { time: '3:30 p. m.', title: 'Show de babyshower', description: '¡Comienza el show! Un momento para compartir, reír y celebrar juntos a Emiliano Noah.', barbara: 'Step Hip Hop Dance', luis: 'Step Hip Hop Dance' },
  { time: '5:00 p. m.', title: 'Regalos con baile', description: 'La entrega de regalos llega con un paso de baile de cada invitado. ¡Prepara el tuyo!', barbara: 'Thankful', luis: 'Step Hip Hop Dance' },
  { time: '6:00 p. m.', title: '¡Todos a bailar!', description: 'Música para bailar, divertirnos y seguir disfrutando juntos.', barbara: 'Step Hip Hop Dance', luis: 'Step Hip Hop Dance' },
]

export default function GardenActivities({ selected, onSelect, onGifts }) {
  const heading = useRef(null)
  const activity = GARDEN_PROGRAM[selected]
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  return (
    <section className="garden-program" aria-labelledby="garden-heading">
      <div className="garden-information">
        <header className="garden-heading">
          <p>EN EL JARDÍN · CON USTEDES</p>
          <h1 id="garden-heading" tabIndex={-1} ref={heading}>Una tarde para recordar</h1>
        </header>
        <p className="garden-instruction">Toca un evento y descubre qué haremos <span aria-hidden="true">↓</span></p>
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
        <p className="garden-refreshments"><strong>Durante todo el evento</strong><span>Bebidas, comida y carritos de snacks para disfrutar en cualquier momento.</span></p>
      </div>
      <button className="scene-next event-continue" onClick={onGifts} type="button">Ver regalos sugeridos <span aria-hidden="true">→</span></button>
    </section>
  )
}