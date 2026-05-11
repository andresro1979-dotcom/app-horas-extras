// ============================================================
// CONFIGURACIÓN
// ============================================================
const CONFIG = {
  SPREADSHEET_ID: '17DIWqDdwSAPW1RPdy5ExGs4eSZK2HM2o-_qr_q7OiA8',
  SHEETS: {
    SOLICITUDES:  'Horas Extras',      // ID, Fecha, Codigo, Nombre, Hora Inicio, Hora Termino, Total Horas, Motivo, Estado, Autorizado Por, Creado
    USUARIOS:     'Usuarios',          // Código, Clave, Nombre, Rol, Activo, Cargo, Fecha de Nacimiento, Dirección, Teléfono, Email, Fecha de Ingreso, Foto
    TRABAJADORES: 'Reporte Empleados', // Código, Nombre, Rol, Cargo, Dirección, Teléfono, Fecha Nacimiento, Estado, Foto URL
    CONFIG:       'Configuracion'      // MAx Hora Dia, Estado 1/2/3, periodo, inicio, final
  }
};

// ============================================================
// ENDPOINTS
// ============================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;
    switch (data.action) {
      case 'login':            result = handleLogin(data.codigo, data.clave); break;
      case 'crearSolicitud':   result = crearSolicitud(data.solicitud); break;
      case 'actualizarEstado': result = actualizarEstado(data.id, data.estado, data.autorizadoPor); break;
      default:                 result = { error: 'Acción no reconocida: ' + data.action };
    }
    return jsonResp(result);
  } catch (err) {
    return jsonResp({ error: err.message });
  }
}

function doGet(e) {
  try {
    let result;
    switch (e.parameter.action) {
      case 'getSolicitudes':  result = getSolicitudes(e.parameter.codigo, e.parameter.rol); break;
      case 'getConfig':       result = getConfigData(); break;
      case 'getTrabajadores': result = getTrabajadores(); break;
      default:                result = { error: 'Acción no reconocida: ' + e.parameter.action };
    }
    return jsonResp(result);
  } catch (err) {
    return jsonResp({ error: err.message });
  }
}

function jsonResp(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// LÓGICA DE NEGOCIO
// ============================================================

function handleLogin(codigo, clave) {
  const sheet = getSheet(CONFIG.SHEETS.USUARIOS);
  if (!sheet) return { error: 'Hoja Usuarios no encontrada.' };

  const rows = sheet.getDataRange().getValues();
  // Columnas: [0]Código [1]Clave [2]Nombre [3]Rol [4]Activo [5]Cargo ... [11]Foto
  for (let i = 1; i < rows.length; i++) {
    const [rowCodigo, rowClave, rowNombre, rowRol, rowActivo, rowCargo, , , , , , rowFoto] = rows[i];
    const estaActivo = rowActivo === true || String(rowActivo).toUpperCase() === 'TRUE';
    if (String(rowCodigo) === String(codigo) &&
        String(rowClave)  === String(clave) &&
        estaActivo) {
      return { success: true, usuario: { codigo: String(rowCodigo), nombre: rowNombre, rol: rowRol, cargo: rowCargo || '', foto: rowFoto || '' } };
    }
  }
  return { success: false, error: 'Código o clave incorrectos' };
}

function getSolicitudes(codigo, rol) {
  const sheet = getSheet(CONFIG.SHEETS.SOLICITUDES);
  if (!sheet) return { error: 'Hoja Solicitudes no encontrada.' };

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { solicitudes: [] };

  const solicitudes = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    const sol = {
      id:            String(r[0]),
      fecha:         formatFecha(r[1]),
      codigo:        String(r[2]),
      nombre:        r[3],
      inicio:        r[4],
      fin:           r[5],
      totalHoras:    r[6],
      motivo:        r[7],
      estado:        r[8] || 'Pendiente',
      autorizadoPor: r[9],
      creado:        r[10]
    };
    if (rol === 'Admin' || rol === 'Visor' || sol.codigo === String(codigo)) {
      solicitudes.push(sol);
    }
  }

  solicitudes.sort((a, b) => new Date(b.creado || b.fecha) - new Date(a.creado || a.fecha));
  return { solicitudes };
}

function crearSolicitud(sol) {
  const sheet = getSheet(CONFIG.SHEETS.SOLICITUDES);
  if (!sheet) return { error: 'Hoja Solicitudes no encontrada.' };

  const config = getConfigData();
  const maxHoras = config.maxHorasDia || 4;

  const totalHoras = calcHoras(sol.inicio, sol.fin);
  if (totalHoras === null) return { error: 'Horas de inicio/fin inválidas' };
  if (totalHoras > maxHoras) return { error: `Máximo ${maxHoras} horas por día permitidas (solicitadas: ${totalHoras})` };
  if (totalHoras <= 0) return { error: 'La hora de término debe ser posterior a la de inicio' };

  const id     = Utilities.getUuid();
  const creado = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

  sheet.appendRow([id, sol.fecha, sol.codigo, sol.nombre, sol.inicio, sol.fin, totalHoras, sol.motivo, 'Pendiente', sol.autorizadoPor, creado]);
  return { success: true, id, totalHoras };
}

function actualizarEstado(id, estado, autorizadoPor) {
  const sheet = getSheet(CONFIG.SHEETS.SOLICITUDES);
  if (!sheet) return { error: 'Hoja Solicitudes no encontrada.' };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i + 1, 9).setValue(estado);
      sheet.getRange(i + 1, 10).setValue(autorizadoPor);
      return { success: true };
    }
  }
  return { error: 'Solicitud no encontrada (id: ' + id + ')' };
}

function getConfigData() {
  const sheet = getSheet(CONFIG.SHEETS.CONFIG);
  if (!sheet) return { maxHorasDia: 4, periodos: [] };

  const rows = sheet.getDataRange().getValues();
  const maxHorasDia = rows[1] ? (rows[1][0] || 4) : 4;
  const periodos = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][4] && rows[i][5] && rows[i][6]) {
      periodos.push({ numero: rows[i][4], inicio: formatFecha(rows[i][5]), fin: formatFecha(rows[i][6]) });
    }
  }

  return {
    maxHorasDia,
    periodos,
    estados: {
      pendiente: (rows[1] && rows[1][1]) || 'Pendiente',
      aprobada:  (rows[1] && rows[1][2]) || 'Aprobada',
      rechazada: (rows[1] && rows[1][3]) || 'Rechazada'
    }
  };
}

function getTrabajadores() {
  // Lee desde Reporte Empleados, si no existe cae a Usuarios
  let sheet = getSheet(CONFIG.SHEETS.TRABAJADORES);
  if (sheet) {
    const rows = sheet.getDataRange().getValues();
    const trabajadores = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][7] === 'Activo') {
        trabajadores.push({ codigo: String(rows[i][0]), nombre: rows[i][1], rol: rows[i][2], cargo: rows[i][3] });
      }
    }
    return { trabajadores };
  }

  // Fallback: hoja Usuarios
  sheet = getSheet(CONFIG.SHEETS.USUARIOS);
  if (!sheet) return { trabajadores: [] };
  const rows = sheet.getDataRange().getValues();
  const trabajadores = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && (rows[i][4] === true || String(rows[i][4]).toUpperCase() === 'TRUE')) {
      trabajadores.push({ codigo: String(rows[i][0]), nombre: rows[i][2], rol: rows[i][3] });
    }
  }
  return { trabajadores };
}

// ============================================================
// UTILIDADES
// ============================================================

function getSheet(name) {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(name);
}

function calcHoras(inicio, fin) {
  if (!inicio || !fin) return null;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if (isNaN(h1) || isNaN(h2)) return null;
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

function formatFecha(val) {
  if (!val) return '';
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(val);
}

// ============================================================
// SETUP — ejecutar UNA vez desde el editor de Apps Script
// ============================================================

function setupUsuariosHeaders() {
  const sheet = getSheet(CONFIG.SHEETS.USUARIOS);
  if (!sheet) { Logger.log('Hoja Usuarios no encontrada'); return; }
  const headers = ['Código', 'Clave', 'Nombre', 'Rol', 'Activo', 'Cargo', 'Fecha de Nacimiento', 'Dirección', 'Teléfono', 'Email', 'Fecha de Ingreso', 'Foto'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  Logger.log('Títulos de Usuarios actualizados correctamente');
}
