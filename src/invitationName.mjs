export function invitationName(search) {
  const params = new URLSearchParams(search)
  return (params.get('nombre') || '').trim() || (params.get('Nombre') || '').trim()
}