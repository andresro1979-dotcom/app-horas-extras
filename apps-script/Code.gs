// ============================================================
// CONFIGURACIÓN - Ajusta los nombres de las hojas si es necesario
// ============================================================
const CONFIG = {
  SPREADSHEET_ID: '17DIWqDdwSAPW1RPdy5ExGs4eSZK2HM2o-_qr_q7OiA8',
  SHEETS: {
    SOLICITUDES: 'Horas Extras',   // Hoja principal: ID, Fecha, Codigo, Nombre, Hora Inicio, Hora Termino, Total Horas, Motivo, Estado, Autorizado Por, Creado
    USUARIOS:    'Usuarios',       // Hoja con: codigo, clave, nombre, rol, activo
    TRABAJADORES: null,            // No existe hoja separada — se usa Usuarios como fallback
    CONFIG:      'Configuracion'   // Hoja con: MAx Hora Dia, Estado 1/2/3, periodo, inicio, final
  }
};

// ============================================================
// ENDPOINTS PRINCIPALES
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
  if (!sheet) return { error: 'Hoja Usuarios no encontrada. Verifica el nombre en CONFIG.' };

  const rows = sheet.getDataRange().getValues();
  // Encabezado esperado: codigo | clave | nombre | rol | activo
  for (let i = 1; i < rows.length; i++) {
    const [rowCodigo, rowClave, rowNombre, rowRol, rowActivo] = rows[i];
    if (String(rowCodigo) === String(codigo) &&
        String(rowClave)  === String(clave) &&
        rowActivo === true) {
      return { success: true, usuario: { codigo: String(rowCodigo), nombre: rowNombre, rol: rowRol } };
    }
  }
  return { success: false, error: 'Código o clave incorrectos' };
}

function getSolicitudes(codigo, rol) {
  const sheet = getSheet(CONFIG.SHEETS.SOLICITUDES);
  if (!sheet) return { error: 'Hoja Solicitudes no encontrada.' };

  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { solicitudes: [] };

  // Encabezado: id | fecha | codigo | nombre | inicio | fin | totalHoras | motivo | estado | autorizadoPor | creado
  const solicitudes = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    const sol = {
      id:           String(r[0]),
      fecha:        formatFecha(r[1]),
      codigo:       String(r[2]),
      nombre:       r[3],
      inicio:       r[4],
      fin:          r[5],
      totalHoras:   r[6],
      motivo:       r[7],
      estado:       r[8] || 'Pendiente',
      autorizadoPor:r[9],
      creado:       r[10]
    };
    if (rol === 'Admin' || rol === 'Visor' || sol.codigo === String(codigo)) {
      solicitudes.push(sol);
    }
  }

  solicitudes.sort((a, b) => {
    const da = new Date(a.creado || a.fecha);
    const db = new Date(b.creado || b.fecha);
    return db - da;
  });

  return { solicitudes };
}

function crearSolicitud(sol) {
  const sheet = getSheet(CONFIG.SHEETS.SOLICITUDES);
  if (!sheet) return { error: 'Hoja Solicitudes no encontrada.' };

  const config = getConfigData();
  const maxHoras = config.maxHorasDia || 4;

  // Calcular total de horas
  const totalHoras = calcHoras(sol.inicio, sol.fin);
  if (totalHoras === null) return { error: 'Horas de inicio/fin inválidas' };
  if (totalHoras > maxHoras) return { error: `Máximo ${maxHoras} horas por día permitidas (solicitadas: ${totalHoras})` };
  if (totalHoras <= 0) return { error: 'La hora de término debe ser posterior a la de inicio' };

  const id     = Utilities.getUuid();
  const creado = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');

  sheet.appendRow([
    id,
    sol.fecha,
    sol.codigo,
    sol.nombre,
    sol.inicio,
    sol.fin,
    totalHoras,
    sol.motivo,
    'Pendiente',
    sol.autorizadoPor,
    creado
  ]);

  return { success: true, id, totalHoras };
}

function actualizarEstado(id, estado, autorizadoPor) {
  const sheet = getSheet(CONFIG.SHEETS.SOLICITUDES);
  if (!sheet) return { error: 'Hoja Solicitudes no encontrada.' };

  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      sheet.getRange(i + 1, 9).setValue(estado);       // columna 9 = estado
      sheet.getRange(i + 1, 10).setValue(autorizadoPor); // columna 10 = autorizadoPor
      return { success: true };
    }
  }
  return { error: 'Solicitud no encontrada (id: ' + id + ')' };
}

function getConfigData() {
  const sheet = getSheet(CONFIG.SHEETS.CONFIG);
  if (!sheet) return { maxHorasDia: 4, periodos: [] };

  const rows = sheet.getDataRange().getValues();
  // Fila 1: MAx Hora Dia | Estado 1 | Estado 2 | Estado 3 | periodo | inicio | final
  const maxHorasDia = rows[1] ? (rows[1][0] || 4) : 4;
  const periodos = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][4] && rows[i][5] && rows[i][6]) {
      periodos.push({
        numero: rows[i][4],
        inicio: formatFecha(rows[i][5]),
        fin:    formatFecha(rows[i][6])
      });
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
  // Si existe hoja Trabajadores la usa, si no cae a Usuarios
  let sheet = CONFIG.SHEETS.TRABAJADORES ? getSheet(CONFIG.SHEETS.TRABAJADORES) : null;
  if (sheet) {
    const rows = sheet.getDataRange().getValues();
    const trabajadores = [];
    // Encabezado: Código | Nombre | Rol | Cargo | Dirección | Teléfono | Fecha Nacimiento | Estado | Foto URL
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][7] === 'Activo') {
        trabajadores.push({
          codigo: String(rows[i][0]),
          nombre: rows[i][1],
          rol:    rows[i][2],
          cargo:  rows[i][3]
        });
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
    if (rows[i][0] && rows[i][4] === true) {
      trabajadores.push({ codigo: String(rows[i][0]), nombre: rows[i][2], rol: rows[i][3] });
    }
  }
  return { trabajadores };
}

// ============================================================
// UTILIDADES
// ============================================================

function getSheet(name) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function calcHoras(inicio, fin) {
  if (!inicio || !fin) return null;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  if (isNaN(h1) || isNaN(h2)) return null;
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60; // cruza medianoche
  return Math.round((mins / 60) * 100) / 100;
}

function formatFecha(val) {
  if (!val) return '';
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(val);
}
