import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { canConfirmPurchase, confirmPurchase, loadGifts } from './gifts/giftApi.js'
import { filterGifts } from './gifts/giftData.mjs'
import './gifts/registry.css'

export default function GiftRegistry({ onBack, onExplore }) {
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [consultedAt, setConsultedAt] = useState(null)
  const request = useRef(null)
  const generation = useRef(0)
  const dialog = useRef(null)
  const heading = useRef(null)
  const savingRef = useRef(false)
  const mounted = useRef(false)

  const refresh = useCallback(async () => {
    if (savingRef.current) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const current = ++generation.current
    setLoading(true)
    try {
      const next = await loadGifts(controller.signal)
      if (!mounted.current || current !== generation.current) return
      setGifts(next); setError(''); setConsultedAt(new Date())
    } catch (reason) {
      if (reason.name !== 'AbortError' && mounted.current && current === generation.current) setError(reason.message)
    } finally {
      if (mounted.current && current === generation.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    heading.current?.focus({ preventScroll: true })
    refresh()
    const visibleRefresh = () => { if (document.visibilityState === 'visible') refresh() }
    const interval = setInterval(visibleRefresh, 30000)
    window.addEventListener('focus', visibleRefresh)
    document.addEventListener('visibilitychange', visibleRefresh)
    return () => {
      mounted.current = false; generation.current++; request.current?.abort()
      clearInterval(interval); window.removeEventListener('focus', visibleRefresh)
      document.removeEventListener('visibilitychange', visibleRefresh)
    }
  }, [refresh])

  useEffect(() => {
    if (selected && !dialog.current.open) dialog.current.showModal()
    if (!selected && dialog.current.open) dialog.current.close()
  }, [selected])

  const counts = useMemo(() => ({ all: gifts.length, available: gifts.filter(g => g.purchased === false).length, purchased: gifts.filter(g => g.purchased === true).length }), [gifts])
  const visible = useMemo(() => filterGifts(gifts, query, filter), [gifts, query, filter])
  const select = gift => { setSaveError(''); setSelected(gift) }
  const save = async event => {
    event.preventDefault()
    if (!selected || savingRef.current) return
    savingRef.current = true; setSaving(true); setSaveError('')
    request.current?.abort(); generation.current++
    try {
      const result = await confirmPurchase(selected)
      if (!mounted.current) return
      setGifts(current => current.map(g => g.id === result.gift.id ? result.gift : g))
      setNotice(result.alreadyPurchased ? 'Este regalo ya estaba marcado como comprado. La lista está actualizada.' : '¡Gracias! Tu regalo ya aparece como comprado para los demás invitados.')
      setSelected(null); setError('')
    } catch (reason) {
      if (mounted.current) setSaveError(reason.message?.includes('fetch') || reason.name === 'TimeoutError' ? 'No pudimos verificar si se guardó. Cierra esta ventana y actualiza la lista antes de volver a intentarlo.' : reason.message)
    } finally {
      savingRef.current = false
      if (mounted.current) { setSaving(false); setLoading(false) }
    }
  }

  return (
    <section className="registry-screen" aria-labelledby="registry-title">
      <div className="registry-shell">
        <nav className="registry-nav" aria-label="Navegación de regalos">
          <button type="button" onClick={onBack}>← Confirmar asistencia</button>
          <span>EMILIANO NOAH <span aria-hidden="true">✧</span></span>
        </nav>
        <header className="registry-header">
          <div><p className="registry-eyebrow">PEQUEÑOS DETALLES · MUCHO CARIÑO</p><h1 id="registry-title" ref={heading} tabIndex={-1}>Su nueva aventura,<br /><em>un detalle a la vez.</em></h1><p className="registry-intro">Tu compañía es lo más importante. Si deseas traer un regalo, aquí tienes algunas ideas para Emiliano.</p></div>
          <div className="registry-total"><span aria-hidden="true">✧</span><strong>{loading && !gifts.length ? '…' : counts.purchased}</strong><p>regalos comprados<br />de {counts.all || '—'} sugeridos</p></div>
        </header>
        <div className="garden-invitation"><div><strong>La celebración también se explora</strong><p>Recorre el jardín y haz bailar a Barbara y Luis.</p></div><button className="visit-garden" type="button" onClick={onExplore}>Visitar el jardín <span aria-hidden="true">↗</span></button></div>
        <div className="registry-toolbar">
          <div className="registry-filters" aria-label="Filtrar regalos">
            {[['all', 'Todos'], ['available', 'Disponibles'], ['purchased', 'Comprados']].map(([key, label]) => <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}<span>{counts[key]}</span></button>)}
          </div>
          <label className="registry-search"><span className="registry-sr-only">Buscar por nombre del producto</span><input type="search" placeholder="Busca un regalo por su nombre…" value={query} onChange={e => setQuery(e.target.value)} /></label>
        </div>
        <div className="registry-sync"><span>{loading ? 'Consultando la lista…' : consultedAt ? `Consultado a las ${consultedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : 'Lista de regalos'}</span><button type="button" onClick={refresh} disabled={loading || saving}>Actualizar ↻</button></div>
        {!canConfirmPurchase && <p className="registry-info">Ya puedes explorar las sugerencias. La confirmación de compras estará disponible pronto.</p>}
        {error && <p className="registry-error" role="alert">{error} {gifts.length > 0 && 'Los estados que ves pueden haber cambiado.'}</p>}
        {notice && <p className="registry-success" role="status">{notice}</p>}
        {loading && !gifts.length && <div className="registry-loading" role="status">Estamos preparando los detalles para Emiliano…</div>}
        {!loading && !visible.length && <div className="registry-empty"><span aria-hidden="true">✧</span><h2>{error ? 'Volvamos a intentarlo' : filter === 'purchased' && !query ? 'Los primeros detalles están por llegar' : 'No encontramos regalos aquí'}</h2><p>{error ? 'Puedes actualizar la lista para volver a intentarlo.' : 'Prueba otro nombre o cambia el filtro.'}</p></div>}
        <div className="registry-grid" aria-busy={loading}>
          {visible.map(gift => <article key={gift.id} className={`registry-card${gift.purchased ? ' is-purchased' : ''}`}>
            <div className="registry-card-top"><span className="registry-number">{String(gift.id).padStart(2, '0')}</span><span className={`registry-badge${gift.purchased === null ? ' is-unknown' : ''}`}>{gift.purchased === true ? '✓ Comprado' : gift.purchased === false ? 'Disponible' : 'Por verificar'}</span></div>
            <h2>{gift.name}</h2>
            <div className="registry-card-actions">{gift.url && <a href={gift.url} target="_blank" rel="noreferrer">Ver producto <span aria-hidden="true">↗</span></a>}<button type="button" disabled={!canConfirmPurchase || gift.purchased !== false || saving || Boolean(error)} onClick={() => select(gift)}>{gift.purchased === true ? '¡Gracias por este detalle!' : 'Ya lo compré'}</button></div>
          </article>)}
        </div>
        <footer className="registry-footer"><p>Confirma un regalo solo cuando ya lo hayas comprado. Así ayudamos a evitar regalos repetidos.</p><div><button className="visit-garden" type="button" onClick={onExplore}>Visitar el jardín <span aria-hidden="true">↗</span></button></div></footer>
      </div>
      <dialog ref={dialog} className="registry-dialog" onCancel={e => { if (saving) e.preventDefault(); else setSelected(null) }} onClose={() => { if (!savingRef.current) setSelected(null) }}>
        <form onSubmit={save}><p className="registry-eyebrow">UN DETALLE PARA EMILIANO</p><h2>¿Ya compraste este regalo?</h2><p className="registry-confirm-name">{selected?.name}</p><p>Al confirmar, aparecerá como <strong>comprado</strong> para todos los invitados.</p>{saveError && <p className="registry-error" role="alert">{saveError}</p>}<div className="registry-dialog-actions"><button type="button" disabled={saving} onClick={() => setSelected(null)}>Volver</button><button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Sí, confirmar compra'}</button></div></form>
      </dialog>
    </section>
  )
}