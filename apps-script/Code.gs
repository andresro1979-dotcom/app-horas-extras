function doGet(e) {
  if (e && e.parameter && e.parameter.accion) {
    return responderJson(ejecutarAccionApi_(e.parameter));
  }

  const page = (e && e.parameter && e.parameter.page) || 'index';
  const allowedPages = ['index', 'trabajador', 'admin'];
  const template = HtmlService.createTemplateFromFile(allowedPages.includes(page) ? page : 'index');

  return template
    .evaluate()
    .setTitle('Registro de Horas Extras')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const datos = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  return responderJson(guardarSolicitud(datos));
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAppUrl() {
  return ScriptApp.getService().getUrl();
}

function listarSolicitudes() {
  const sheet = obtenerHojaSolicitudes_();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(value => value !== ''))
    .map(row => convertirFilaAObjeto_(headers, row));
}

function listarUsuarios() {
  const sheet = obtenerHojaUsuarios_();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(value => value !== ''))
    .map(row => convertirFilaAObjeto_(headers, row))
    .filter(usuario => usuario.activo !== false && String(usuario.activo).toLowerCase() !== 'false');
}

function listarAdministradores() {
  return listarUsuarios().filter(usuario => usuario.rol === 'Admin');
}

function validarLogin(codigo, clave) {
  const usuario = listarUsuarios().find(item =>
    String(item.codigo) === String(codigo) &&
    String(item.clave) === String(clave)
  );

  if (!usuario) return { ok: false };

  return {
    ok: true,
    usuario: {
      codigo: String(usuario.codigo),
      nombre: usuario.nombre,
      rol: usuario.rol
    }
  };
}

function guardarUsuario(datos) {
  const codigo = String(datos.codigo || '').trim();
  const clave = String(datos.clave || '').trim();
  const nombre = String(datos.nombre || '').trim();
  const rol = datos.rol === 'Admin' ? 'Admin' : 'Usuario';

  if (!codigo || !clave || !nombre) {
    throw new Error('Codigo, clave y nombre son obligatorios.');
  }

  const sheet = obtenerHojaUsuarios_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === codigo) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[clave, nombre, rol, true]]);
      return { ok: true, actualizado: true };
    }
  }

  sheet.appendRow([codigo, clave, nombre, rol, true]);
  return { ok: true, actualizado: false };
}

function guardarSolicitud(datos) {
  validarSolicitud_(datos);

  const sheet = obtenerHojaSolicitudes_();
  const id = Utilities.getUuid();
  const creado = new Date();
  const estado = datos.estado || 'Pendiente';

  sheet.appendRow([
    id,
    datos.fecha,
    datos.codigo,
    datos.nombre,
    datos.inicio,
    datos.fin,
    Number(datos.totalHoras),
    datos.motivo,
    estado,
    datos.autorizadoPor,
    creado
  ]);

  // Si la solicitud está aprobada, registrarlo en la planilla de control
  if (estado === 'Aprobada') {
    registrarAprobacionEnControl_({
      id,
      fecha: datos.fecha,
      codigo: datos.codigo,
      nombre: datos.nombre,
      totalHoras: datos.totalHoras,
      aprobadoPor: datos.autorizadoPor,
      fechaAprobacion: creado
    });
  }

  return { ok: true, id };
}

function cambiarEstadoSolicitud(id, estado) {
  if (!id) throw new Error('Falta el ID de la solicitud.');
  if (!['Aprobada', 'Rechazada', 'Pendiente'].includes(estado)) {
    throw new Error('Estado no valido.');
  }

  const sheet = obtenerHojaSolicitudes_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.getRange(i + 1, 9).setValue(estado);
      return { ok: true, id, estado };
    }
  }

  throw new Error('No se encontro la solicitud.');
}

function aprobarSolicitud(id) {
  return cambiarEstadoSolicitud(id, 'Aprobada');
}

function rechazarSolicitud(id) {
  return cambiarEstadoSolicitud(id, 'Rechazada');
}

function obtenerUrlPlanilla() {
  return SpreadsheetApp.openById(obtenerSpreadsheetId_()).getUrl();
}

function ejecutarAccionApi_(params) {
  if (params.accion === 'aprobar') return aprobarSolicitud(params.id);
  if (params.accion === 'rechazar') return rechazarSolicitud(params.id);
  return { ok: false, error: 'Accion no reconocida.' };
}

function responderJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function obtenerHojaSolicitudes_() {
  const ss = SpreadsheetApp.openById(obtenerSpreadsheetId_());
  let sheet = ss.getSheetByName('Solicitudes');

  if (!sheet) {
    sheet = ss.insertSheet('Solicitudes');
  }

  const headers = [
    'id',
    'fecha',
    'codigo',
    'nombre',
    'inicio',
    'fin',
    'totalHoras',
    'motivo',
    'estado',
    'autorizadoPor',
    'creado'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function obtenerHojaControl_() {
  const ss = SpreadsheetApp.openById(obtenerSpreadsheetId_());
  let sheet = ss.getSheetByName('Control de Horas Extras');

  if (!sheet) {
    sheet = ss.insertSheet('Control de Horas Extras');
  }

  const headers = [
    'id_solicitud',
    'fecha_solicitud',
    'codigo_trabajador',
    'nombre_trabajador',
    'total_horas',
    'aprobado_por',
    'fecha_aprobacion'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function registrarAprobacionEnControl_(datos) {
  const sheet = obtenerHojaControl_();
  sheet.appendRow([
    datos.id,
    datos.fecha,
    datos.codigo,
    datos.nombre,
    Number(datos.totalHoras),
    datos.aprobadoPor,
    datos.fechaAprobacion
  ]);
}

function obtenerHojaUsuarios_() {
  const ss = SpreadsheetApp.openById(obtenerSpreadsheetId_());
  let sheet = ss.getSheetByName('Usuarios');

  if (!sheet) {
    sheet = ss.insertSheet('Usuarios');
  }

  const headers = ['codigo', 'clave', 'nombre', 'rol', 'activo'];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    usuariosIniciales_().forEach(usuario => {
      sheet.appendRow([usuario.codigo, usuario.clave, usuario.nombre, usuario.rol, true]);
    });
  }

  return sheet;
}

function usuariosIniciales_() {
  return [
    { codigo: '1',  clave: '1001', nombre: 'Alejandro Guzman', rol: 'Usuario' },
    { codigo: '2',  clave: '1002', nombre: 'Juan Donoso Torres', rol: 'Usuario' },
    { codigo: '3',  clave: '1003', nombre: 'Ariel Gonzalez', rol: 'Admin' },
    { codigo: '4',  clave: '1004', nombre: 'Bernardo Perez Cofre', rol: 'Usuario' },
    { codigo: '5',  clave: '1005', nombre: 'Claudio Sanueza De la Fuente', rol: 'Usuario' },
    { codigo: '6',  clave: '1006', nombre: 'Edinson Castillo', rol: 'Usuario' },
    { codigo: '7',  clave: '1007', nombre: 'Eduardo Xavier Espana', rol: 'Usuario' },
    { codigo: '8',  clave: '1008', nombre: 'Fidel Navarrete Vulgron', rol: 'Usuario' },
    { codigo: '9',  clave: '1009', nombre: 'Hernan Huaiquimilla Andrade', rol: 'Usuario' },
    { codigo: '10', clave: '1010', nombre: 'Johan Moncada', rol: 'Usuario' },
    { codigo: '11', clave: '1011', nombre: 'Jose Luis Sandoval', rol: 'Usuario' },
    { codigo: '12', clave: '1012', nombre: 'Luis Laurie Saez', rol: 'Usuario' },
    { codigo: '13', clave: '1013', nombre: 'Maria Isabel Betancurt', rol: 'Usuario' },
    { codigo: '14', clave: '1014', nombre: 'Roberto Sepulveda', rol: 'Usuario' },
    { codigo: '15', clave: '1015', nombre: 'Rodrigo Andres Pizarro Gonzalez', rol: 'Admin' },
    { codigo: '16', clave: '1016', nombre: 'Ulises Troncoso', rol: 'Usuario' }
  ];
}

function obtenerSpreadsheetId_() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty('SPREADSHEET_ID');

  if (!spreadsheetId) {
    const ss = SpreadsheetApp.create('Horas Extras - Datos');
    spreadsheetId = ss.getId();
    props.setProperty('SPREADSHEET_ID', spreadsheetId);
  }

  return spreadsheetId;
}

function convertirFilaAObjeto_(headers, row) {
  return headers.reduce((obj, header, index) => {
    obj[header] = normalizarValor_(row[index]);
    return obj;
  }, {});
}

function normalizarValor_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  }

  return value;
}

function validarSolicitud_(datos) {
  const requeridos = ['fecha', 'codigo', 'nombre', 'inicio', 'fin', 'totalHoras', 'motivo', 'estado', 'autorizadoPor'];
  const faltantes = requeridos.filter(campo => datos[campo] === undefined || datos[campo] === null || datos[campo] === '');

  if (faltantes.length > 0) {
    throw new Error('Faltan campos: ' + faltantes.join(', '));
  }
}
