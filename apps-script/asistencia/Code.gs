/** Proyecto SEPARADO del Apps Script de regalos. */
const RSVP_CONFIG = {
  spreadsheetId: '1BNM_8ojh4z6nzlnqoAZE-9LzgcVBClkdtHYG65Vcr54',
  sheetName: 'Invitados',
};
function rsvpOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function doGet() {
  // No publicar nombres ni cantidades de asistentes.
  return rsvpOutput_({ ok: true, service: 'Confirmación de asistencia' });
}
function doPost(e) {
  const params = e && e.parameter || {};
  let lock;
  let locked = false;
  try {
    const name = String(params.name || '').trim().replace(/\s+/g, ' ');
    const people = Number(params.people);
    const requestId = String(params.requestId || '');
    if (params.action !== 'rsvp') throw new Error('Acción no válida.');
    if (name.length < 2 || name.length > 120) throw new Error('Indica un nombre válido de entre 2 y 120 caracteres.');
    if (!Number.isInteger(people) || people < 1 || people > 4) throw new Error('Indica entre 1 y 4 personas, incluyéndote.');
    if (!/^[a-f0-9-]{36}$/i.test(requestId)) throw new Error('No se pudo identificar el envío. Recarga la invitación.');
    if (RSVP_CONFIG.spreadsheetId === 'PEGA_AQUI_EL_ID_DE_TU_HOJA') throw new Error('La confirmación aún no está habilitada.');
    lock = LockService.getScriptLock();
    locked = lock.tryLock(10000);
    if (!locked) throw new Error('Hay otra confirmación en curso. Vuelve a intentarlo.');
    const sheet = SpreadsheetApp.openById(RSVP_CONFIG.spreadsheetId).getSheetByName(RSVP_CONFIG.sheetName);
    if (!sheet) throw new Error('No se encontró la pestaña de asistencia.');
    const headers = sheet.getRange(1, 1, 1, 2).getDisplayValues()[0].map(value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase());
    if (headers[0] !== 'nombre' || headers[1] !== 'cuantas personas') throw new Error('Los encabezados deben ser Nombre y Cuantas personas.');
    const lastRow = sheet.getLastRow();
    if (lastRow > 10000) throw new Error('La lista necesita una revisión del organizador.');
    const note = 'rsvp:' + requestId;
    const notes = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getNotes() : [];
    const index = notes.findIndex(row => row[0] === note);
    const row = index >= 0 ? index + 2 : Math.max(2, lastRow + 1);
    // The request identifier lives in a note, preserving exactly two visible columns.
    // Reserve the row first so a retry can recover even if a later write fails.
    sheet.getRange(row, 1).setNote(note);
    const safeName = /^[=+@\-]/.test(name) ? "'" + name : name;
    sheet.getRange(row, 1, 1, 2).setValues([[safeName, people]]);
    SpreadsheetApp.flush();
    const saved = sheet.getRange(row, 1, 1, 2).getValues()[0];
    if (Number(saved[1]) !== people || !String(saved[0]).trim()) throw new Error('No pudimos verificar el guardado. Intenta nuevamente.');
    return rsvpOutput_({ ok: true, requestId: requestId, people: people });
  } catch (error) {
    return rsvpOutput_({ ok: false, error: error.message });
  } finally {
    if (locked) lock.releaseLock();
  }
}