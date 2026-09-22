import { SHEET_ID, SHEET_GID, giftsFromRows, validateGifts } from './giftData.mjs'

const endpoint = (import.meta.env.VITE_GIFTS_APPS_SCRIPT_URL || '').trim()
export const canConfirmPurchase = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)

function jsonp(makeUrl, signal) {
  return new Promise((resolve, reject) => {
    const callback = `__gifts_${crypto.randomUUID().replaceAll('-', '')}`
    const script = document.createElement('script')
    let finished = false
    const finish = (error, value) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      script.remove()
      // A late network response may still execute after a timeout or cancellation.
      window[callback] = () => {}
      setTimeout(() => { delete window[callback] }, 60000)
      error ? reject(error) : resolve(value)
    }
    const abort = () => finish(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(() => finish(new Error('La lista tardó demasiado en responder. Vuelve a intentarlo.')), 15000)
    window[callback] = data => finish(null, data)
    script.onerror = () => finish(new Error('No pudimos consultar la lista. Revisa tu conexión y vuelve a intentarlo.'))
    script.src = makeUrl(callback)
    if (signal?.aborted) return abort()
    signal?.addEventListener('abort', abort, { once: true })
    document.head.append(script)
  })
}

export async function loadGifts(signal) {
  if (canConfirmPurchase) {
    const data = await jsonp(callback => `${endpoint}?action=list&callback=${callback}&_=${Date.now()}`, signal)
    if (!data.ok) throw new Error(data.error || 'No se pudo consultar la lista.')
    return validateGifts(data.gifts)
  }
  const data = await jsonp(callback => {
    const url = new URL(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`)
    url.search = new URLSearchParams({ gid: SHEET_GID, headers: '1', tq: 'select A,B,C,D where C is not null', tqx: `out:json;responseHandler:${callback}`, _: String(Date.now()) })
    return url.href
  }, signal)
  if (data.status !== 'ok' || !data.table?.rows) throw new Error('La lista no está disponible en este momento.')
  return giftsFromRows(data.table.rows.map(row => row.c.map(cell => cell?.v ?? '')))
}

export async function confirmPurchase(gift) {
  if (!canConfirmPurchase) throw new Error('La confirmación de compras estará disponible pronto.')
  // URL-encoded POST is a simple cross-origin request, without custom headers/preflight.
  // Never use no-cors: an opaque response cannot confirm that Sheets saved the purchase.
  const response = await fetch(endpoint, {
    method: 'POST', credentials: 'omit', redirect: 'follow',
    body: new URLSearchParams({ action: 'purchase', id: gift.id, name: gift.name, url: gift.url }),
    signal: AbortSignal.timeout(25000),
  })
  if (!response.ok) throw new Error('No se pudo verificar la confirmación. Actualiza la lista antes de volver a intentarlo.')
  const result = await response.json()
  if (!result.ok) throw new Error(result.error || 'No se pudo guardar la confirmación.')
  const [updated] = validateGifts([result.gift])
  if (updated.id !== gift.id || updated.purchased !== true) throw new Error('No se pudo verificar la confirmación. Actualiza la lista.')
  return { gift: updated, alreadyPurchased: result.alreadyPurchased === true }
}