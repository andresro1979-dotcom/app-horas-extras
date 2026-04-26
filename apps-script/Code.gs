var SPREADSHEET_ID = '1HLGTscsXPOkfb5crnzE4MzoZqRm5v2zTjV0_BzBVrBs';

function doGet(e) {
  var params = (e && e.parameter) || {};

  if (params.accion) {
    var result;
    try {
      var datos = params.datos ? JSON.parse(params.datos) : {};
      result = manejarAccion_(params.accion, datos);
    } catch (err) {
      result = { ok: false, error: err.message };
    }
    if (params.callback) {
      return ContentService
        .createTextOutput(params.callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return responderJson(result);
  }

  var page = params.page || 'index';
  var allowedPages = ['index', 'trabajador', 'admin'];
  var template = HtmlService.createTemplateFromFile(
    allowedPages.indexOf(page) >= 0 ? page : 'index'
  );
  return template
    .evaluate()
    .setTitle('Registro de Horas Extras')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return responderJson(manejarAccion_(body.accion, body.datos || body));
  } catch (err) {
    return responderJson({ ok: false, error: err.message });
  }
}

function manejarAccion_(accion, datos) {
  switch (accion) {
    case 'login':          return validarLogin(datos.codigo, datos.clave);
    case 'solicitudes':    return listarSolicitudes();
    case 'usuarios':       return listarUsuarios();
    case 'administradores':return listarAdministradores();
    case 'guardarSolicitud': return guardarSolicitud(datos);
    case 'guardarUsuario':   return guardarUsuario(datos);
    case 'cambiarEstado':    return cambiarEstadoSolicitud(datos.id, datos.estado);
    case 'aprobar':          return cambiarEstadoSolicitud(datos.id, 'Aprobada');
    case 'rechazar':         return cambiarEstadoSolicitud(datos.id, 'Rechazada');
    default: return { ok: false, error: 'Accion no reconocida: ' + accion };
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAppUrl() {
  return ScriptApp.getService().getUrl();
}

function listarSolicitudes() {
  var sheet = obtenerHojaSolicitudes_();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  return values.slice(1)
    .filter(function(row) { return row.some(function(v) { return v !== ''; }); })
    .map(function(row) { return convertirFilaAObjeto_(headers, row); });
}

function listarUsuarios() {
  var sheet = obtenerHojaUsuarios_();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  return values.slice(1)
    .filter(function(row) { return row.some(function(v) { return v !== ''; }); })
    .map(function(row) { return convertirFilaAObjeto_(headers, row); })
    .filter(function(u) { return u.activo !== false && String(u.activo).toLowerCase() !== 'false'; });
}

function listarAdministradores() {
  return listarUsuarios().filter(function(u) { return u.rol === 'Admin'; });
}

function validarLogin(codigo, clave) {
  var usuario = listarUsuarios().find(function(item) {
    return String(item.codigo) === String(codigo) && String(item.clave) === String(clave);
  });
  if (!usuario) return { ok: false };
  return {
    ok: true,
    usuario: { codigo: String(usuario.codigo), nombre: usuario.nombre, rol: usuario.rol }
  };
}

function guardarUsuario(datos) {
  var codigo = String(datos.codigo || '').trim();
  var clave  = String(datos.clave  || '').trim();
  var nombre = String(datos.nombre || '').trim();
  var rol    = datos.rol === 'Admin' ? 'Admin' : 'Usuario';

  if (!codigo || !clave || !nombre) throw new Error('Codigo, clave y nombre son obligatorios.');

  var sheet  = obtenerHojaUsuarios_();
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === codigo) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[clave, nombre, rol, true]]);
      return { ok: true, actualizado: true };
    }
  }

  sheet.appendRow([codigo, clave, nombre, rol, true]);
  return { ok: true, actualizado: false };
}

function cargarUsuariosNuevos() {
  var nuevos = [
    { codigo: '17', clave: '1017', nombre: 'Christian Figueroa',      rol: 'Usuario' },
    { codigo: '18', clave: '1018', nombre: 'Cesar Davila',             rol: 'Usuario' },
    { codigo: '19', clave: '1019', nombre: 'Pablo Zapata',             rol: 'Usuario' },
    { codigo: '20', clave: '1020', nombre: 'Pedro Fuenzalida',         rol: 'Usuario' },
    { codigo: '21', clave: '1021', nombre: 'Paola Donoso',             rol: 'Usuario' },
    { codigo: '22', clave: '1022', nombre: 'Maria Nir Sanchez Henao',  rol: 'Usuario' },
    { codigo: '23', clave: '1023', nombre: 'Daisy',                    rol: 'Usuario' },
    { codigo: '24', clave: '1024', nombre: 'Yasmin',                   rol: 'Usuario' },
    { codigo: '25', clave: '1025', nombre: 'Jorge Toro',               rol: 'Admin'   }
  ];
  nuevos.forEach(function(u) { guardarUsuario(u); });
  Logger.log('Usuarios cargados: ' + nuevos.length);
}

function guardarSolicitud(datos) {
  validarSolicitud_(datos);
  var sheet  = obtenerHojaSolicitudes_();
  var id     = Utilities.getUuid();
  var creado = new Date();
  var estado = datos.estado || 'Pendiente';

  sheet.appendRow([id, datos.fecha, datos.codigo, datos.nombre, datos.inicio, datos.fin,
    Number(datos.totalHoras), datos.motivo, estado, datos.autorizadoPor, creado]);

  if (estado === 'Aprobada') {
    registrarAprobacionEnControl_({
      id: id, fecha: datos.fecha, codigo: datos.codigo, nombre: datos.nombre,
      totalHoras: datos.totalHoras, aprobadoPor: datos.autorizadoPor, fechaAprobacion: creado
    });
  }
  return { ok: true, id: id };
}

function cambiarEstadoSolicitud(id, estado) {
  if (!id) throw new Error('Falta el ID de la solicitud.');
  if (['Aprobada', 'Rechazada', 'Pendiente'].indexOf(estado) < 0) throw new Error('Estado no valido.');

  var sheet   = obtenerHojaSolicitudes_();
  var values  = sheet.getDataRange().getValues();
  var headers = values[0];

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.getRange(i + 1, 9).setValue(estado);
      if (estado === 'Aprobada') {
        var fila = convertirFilaAObjeto_(headers, values[i]);
        registrarAprobacionEnControl_({
          id: fila.id, fecha: fila.fecha, codigo: fila.codigo, nombre: fila.nombre,
          totalHoras: fila.totalHoras, aprobadoPor: fila.autorizadoPor, fechaAprobacion: new Date()
        });
      }
      return { ok: true, id: id, estado: estado };
    }
  }
  throw new Error('No se encontro la solicitud.');
}

function responderJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function obtenerHojaSolicitudes_() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Solicitudes');
  if (!sheet) sheet = ss.insertSheet('Solicitudes');
  if (sheet.getLastRow() === 0)
    sheet.appendRow(['id','fecha','codigo','nombre','inicio','fin','totalHoras','motivo','estado','autorizadoPor','creado']);
  return sheet;
}

function obtenerHojaControl_() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Control de Horas Extras');
  if (!sheet) sheet = ss.insertSheet('Control de Horas Extras');
  if (sheet.getLastRow() === 0)
    sheet.appendRow(['id_solicitud','fecha_solicitud','codigo_trabajador','nombre_trabajador','total_horas','aprobado_por','fecha_aprobacion']);
  return sheet;
}

function registrarAprobacionEnControl_(datos) {
  obtenerHojaControl_().appendRow([
    datos.id, datos.fecha, datos.codigo, datos.nombre,
    Number(datos.totalHoras), datos.aprobadoPor, datos.fechaAprobacion
  ]);
}

function obtenerHojaUsuarios_() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Usuarios');
  if (!sheet) sheet = ss.insertSheet('Usuarios');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['codigo','clave','nombre','rol','activo']);
  }
  if (sheet.getLastRow() <= 1) {
    usuariosIniciales_().forEach(function(u) {
      sheet.appendRow([u.codigo, u.clave, u.nombre, u.rol, true]);
    });
  }
  return sheet;
}

function usuariosIniciales_() {
  return [
    { codigo: '1',  clave: '1001', nombre: 'Alejandro Guzman',                rol: 'Usuario' },
    { codigo: '2',  clave: '1002', nombre: 'Juan Donoso Torres',               rol: 'Usuario' },
    { codigo: '3',  clave: '1003', nombre: 'Ariel Gonzalez',                   rol: 'Admin'   },
    { codigo: '4',  clave: '1004', nombre: 'Bernardo Perez Cofre',             rol: 'Usuario' },
    { codigo: '5',  clave: '1005', nombre: 'Claudio Sanueza De la Fuente',     rol: 'Usuario' },
    { codigo: '6',  clave: '1006', nombre: 'Edinson Castillo',                 rol: 'Usuario' },
    { codigo: '7',  clave: '1007', nombre: 'Eduardo Xavier Espana',            rol: 'Usuario' },
    { codigo: '8',  clave: '1008', nombre: 'Fidel Navarrete Vulgron',          rol: 'Usuario' },
    { codigo: '9',  clave: '1009', nombre: 'Hernan Huaiquimilla Andrade',      rol: 'Usuario' },
    { codigo: '10', clave: '1010', nombre: 'Johan Moncada',                    rol: 'Usuario' },
    { codigo: '11', clave: '1011', nombre: 'Jose Luis Sandoval',               rol: 'Usuario' },
    { codigo: '12', clave: '1012', nombre: 'Luis Laurie Saez',                 rol: 'Usuario' },
    { codigo: '13', clave: '1013', nombre: 'Maria Isabel Betancurt',           rol: 'Usuario' },
    { codigo: '14', clave: '1014', nombre: 'Roberto Sepulveda',                rol: 'Usuario' },
    { codigo: '15', clave: '1015', nombre: 'Rodrigo Andres Pizarro Gonzalez',  rol: 'Admin'   },
    { codigo: '16', clave: '1016', nombre: 'Ulises Troncoso',                  rol: 'Usuario' }
  ];
}

function convertirFilaAObjeto_(headers, row) {
  return headers.reduce(function(obj, header, index) {
    obj[header] = normalizarValor_(row[index]);
    return obj;
  }, {});
}

function normalizarValor_(value) {
  if (value instanceof Date)
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  return value;
}

function validarSolicitud_(datos) {
  var requeridos = ['fecha','codigo','nombre','inicio','fin','totalHoras','motivo','estado','autorizadoPor'];
  var faltantes  = requeridos.filter(function(c) {
    return datos[c] === undefined || datos[c] === null || datos[c] === '';
  });
  if (faltantes.length > 0) throw new Error('Faltan campos: ' + faltantes.join(', '));
}
