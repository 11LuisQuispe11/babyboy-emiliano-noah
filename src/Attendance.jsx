import { useRef, useState } from 'react'
import './gifts/registry.css'
import { invitationName } from './invitationName.mjs'
const endpoint = (import.meta.env.VITE_RSVP_APPS_SCRIPT_URL || '').trim()
const enabled = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)
export default function Attendance({ onContinue, onBack }) {
  const linkedName = invitationName(location.search)
  const [manualName, setManualName] = useState('')
  const name = linkedName || manualName.trim()
  const validName = name.length >= 2 && name.length <= 120
  const [choosing, setChoosing] = useState(false)
  const [people, setPeople] = useState('1')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(null)
  const pending = useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (!enabled || !validName || !['1', '2', '3', '4'].includes(people) || pending.current) return
    pending.current = true; setBusy(true); setError('')
    try {
      if (!requestId.current) {
        requestId.current = sessionStorage.getItem('emiliano-rsvp-id:' + name) || crypto.randomUUID()
        sessionStorage.setItem('emiliano-rsvp-id:' + name, requestId.current)
      }
      const response = await fetch(endpoint, { method: 'POST', credentials: 'omit', body: new URLSearchParams({ action: 'rsvp', name: name.trim(), people, requestId: requestId.current }), signal: AbortSignal.timeout(25000) })
      const result = await response.json()
      if (!response.ok || !result.ok || result.requestId !== requestId.current) throw new Error(result.error || 'No pudimos verificar tu confirmación. Inténtalo nuevamente.')
      setSaved(true)
    } catch (reason) { setError(reason.name === 'TimeoutError' || reason instanceof TypeError ? 'No pudimos verificar el envío. Puedes reintentar sin duplicar tu registro.' : reason.message) }
    finally { pending.current = false; setBusy(false) }
  }
  return <section className="registry-screen attendance-screen" aria-labelledby="attendance-title"><div className="attendance-card">
    <button type="button" className="attendance-back" onClick={onBack} disabled={busy}>← Volver al programa</button>
    <p className="registry-eyebrow">EL MEJOR REGALO ES COMPARTIR CONTIGO</p>
    <h1 id="attendance-title">{name ? `${name}, ¿nos acompañas?` : '¿Nos acompañas?'}</h1><p>Confirma tu asistencia antes de conocer las ideas de regalos.</p>
    {saved ? <div role="status" className="registry-success">¡Gracias, {name}! Confirmamos tu asistencia para {people} {Number(people) === 1 ? 'persona' : 'personas'}.</div> : <form onSubmit={submit}>
      <label hidden={Boolean(linkedName)}>Nombre completo{!linkedName && <input autoComplete="name" required minLength={2} maxLength={120} value={manualName} onChange={e => { setManualName(e.target.value); requestId.current = null }} disabled={busy} />}</label>
      <button className="attendance-submit" type="button" aria-expanded={choosing} aria-controls="attendance-party" disabled={!validName || busy} onClick={() => setChoosing(value => !value)}>Confirmar asistencia</button>
      {choosing && <div id="attendance-party">
        <label htmlFor="attendance-count">¿Cuántas personas asistirán?
          <select id="attendance-count" autoFocus value={people} onChange={e => setPeople(e.target.value)} disabled={busy}>
            {[1, 2, 3, 4].map(count => <option key={count} value={count}>{count} {count === 1 ? 'persona' : 'personas'}</option>)}
          </select>
          <small>Inclúyete en el total. Puedes confirmar hasta 4 personas.</small>
        </label>
        {!enabled && <p className="registry-info">La confirmación estará disponible pronto. Mientras tanto, puedes ver las ideas de regalos.</p>}
        {error && <p className="registry-error" role="alert">{error}</p>}
        <button className="attendance-submit" type="submit" disabled={!enabled || !validName || busy}>{busy ? 'Guardando…' : 'Confirmar mi asistencia'}</button>
      </div>}
    </form>}
    <button className="attendance-next" type="button" onClick={onContinue} disabled={busy}>{saved ? 'Ver regalos sugeridos →' : 'Ver regalos y confirmar después →'}</button>
  </div></section>
}