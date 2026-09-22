/** Lista de regalos de Emiliano Noah. Desplegar como aplicación web. */
const GIFTS_CONFIG = {
  spreadsheetId: '1BNM_8ojh4z6nzlnqoAZE-9LzgcVBClkdtHYG65Vcr54',
  sheetName: 'Hoja1',
  maxRows: 5000,
};

function normalize_(value) {
  return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}
function purchaseState_(value) {
  const text = normalize_(value);
  if (value === true || ['si', 'true', 'comprado', 'yes'].indexOf(text) !== -1) return true;
  if (value === false || ['no', 'false', 'disponible'].indexOf(text) !== -1) return false;
  return null;
}
function sheetData_() {
  const sheet = SpreadsheetApp.openById(GIFTS_CONFIG.spreadsheetId).getSheetByName(GIFTS_CONFIG.sheetName);
  if (!sheet) throw new Error('No se encontró la pestaña de regalos.');
  const lastRow = sheet.getLastRow();
  if (lastRow < 1 || lastRow > GIFTS_CONFIG.maxRows) throw new Error('La lista necesita una revisión antes de continuar.');
  const values = sheet.getRange(1, 1, lastRow, 4).getValues();
  const expected = ['orden', 'link del producto sugerido', 'nombre del producto', '¿fue comprado?'];
  if (!expected.every((name, i) => normalize_(values[0][i]) === name)) throw new Error('Los encabezados de la hoja cambiaron. Revisa la configuración.');
  const ids = {};
  const gifts = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const name = String(row[2] == null ? '' : row[2]).trim();
    if (!name) continue;
    const id = String(row[0] == null ? '' : row[0]).trim();
    if (!id || Object.prototype.hasOwnProperty.call(ids, id)) throw new Error('La columna Orden debe tener un identificador único por regalo.');
    ids[id] = true;
    const url = String(row[1] || '').trim();
    gifts.push({ id: id, name: name, url: /^https:\/\//i.test(url) ? url : '', purchased: purchaseState_(row[3]), row: i + 1, rawState: row[3] });
  }
  return { sheet: sheet, gifts: gifts };
}
function publicGift_(gift) {
  return { id: gift.id, name: gift.name, url: gift.url, purchased: gift.purchased };
}
function output_(data, callback) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  if (callback && /^__gifts_[A-Za-z0-9_]+$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  const params = e && e.parameter || {};
  try {
    if (params.action && params.action !== 'list') throw new Error('Acción no válida.');
    return output_({ ok: true, gifts: sheetData_().gifts.map(publicGift_) }, params.callback);
  } catch (error) {
    return output_({ ok: false, error: error.message }, params.callback);
  }
}
function doPost(e) {
  const params = e && e.parameter || {};
  let lock;
  let locked = false;
  try {
    if (params.action !== 'purchase') throw new Error('Acción no válida.');
    if (!params.id || !params.name || String(params.id).length > 80 || String(params.name).length > 500) throw new Error('Faltan los datos del regalo.');
    lock = LockService.getScriptLock();
    locked = lock.tryLock(10000);
    if (!locked) throw new Error('Otra confirmación está en curso. Actualiza y vuelve a intentarlo.');
    // Read inside the lock: simultaneous requests cannot both claim an available gift.
    const data = sheetData_();
    const gift = data.gifts.find(item => item.id === String(params.id));
    if (!gift) throw new Error('Este regalo ya no está en la lista. Actualiza antes de continuar.');
    if (gift.name !== String(params.name).trim() || decodeURI(gift.url) !== decodeURI(String(params.url || '').trim())) throw new Error('Este regalo cambió en la hoja. Actualiza antes de confirmar.');
    if (gift.purchased === null) throw new Error('El estado de este regalo necesita una revisión.');
    if (gift.purchased) return output_({ ok: true, alreadyPurchased: true, gift: publicGift_(gift) });
    // Only the verified purchase cell is written. Names, links and other columns are preserved.
    const cell = data.sheet.getRange(gift.row, 4);
    cell.setValue(typeof gift.rawState === 'boolean' ? true : 'Sí');
    SpreadsheetApp.flush();
    gift.purchased = purchaseState_(cell.getValue());
    if (gift.purchased !== true) throw new Error('No se pudo verificar la compra. Actualiza la lista.');
    return output_({ ok: true, alreadyPurchased: false, gift: publicGift_(gift) });
  } catch (error) {
    return output_({ ok: false, error: error.message });
  } finally {
    if (locked) lock.releaseLock();
  }
}