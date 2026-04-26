var GAS_URL = 'https://script.google.com/macros/s/AKfycbyj5DmlQmg-WxEG_WslrAtXIWzTAfpI5UY65KdU1_7puiiDhoCVAGv0FvHvYAHUTiI6/exec';

function gasCall(accion, datos) {
  var url = GAS_URL + '?accion=' + encodeURIComponent(accion);
  if (datos) url += '&datos=' + encodeURIComponent(JSON.stringify(datos));
  return fetch(url, { redirect: 'follow' })
    .then(function(r) { return r.json(); })
    .catch(function() { return { ok: false, error: 'Sin conexion' }; });
}
