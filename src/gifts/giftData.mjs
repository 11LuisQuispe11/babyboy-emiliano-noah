export const SHEET_ID = '1BNM_8ojh4z6nzlnqoAZE-9LzgcVBClkdtHYG65Vcr54'
export const SHEET_GID = '286633147'
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?gid=${SHEET_GID}`
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
export function purchaseState(value) {
  if (value === true || ['si', 'true', 'comprado', 'yes'].includes(normalize(value))) return true
  if (value === false || ['no', 'false', 'disponible'].includes(normalize(value))) return false
  return null
}
export function safeProductUrl(value) {
  try { const url = new URL(String(value)); return url.protocol === 'https:' ? url.href : '' } catch { return '' }
}
export function giftsFromRows(rows) {
  const seen = new Set()
  return rows.filter(row => String(row[2] ?? '').trim()).map(row => {
    const id = String(row[0] ?? '').trim()
    if (!id || seen.has(id)) throw new Error('La lista contiene identificadores vacíos o repetidos. Intenta actualizar más tarde.')
    seen.add(id)
    return { id, url: safeProductUrl(row[1]), name: String(row[2]).trim(), purchased: purchaseState(row[3]) }
  })
}
export function validateGifts(gifts) {
  if (!Array.isArray(gifts)) throw new Error('No se pudo interpretar la lista de regalos.')
  return giftsFromRows(gifts.map(g => [g.id, g.url, g.name, g.purchased]))
}
export function filterGifts(gifts, query, filter) {
  const term = normalize(query)
  return gifts.filter(g => normalize(g.name).includes(term) && (filter === 'all' || (filter === 'available' ? g.purchased === false : g.purchased === true)))
}