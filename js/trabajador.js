const nombre = localStorage.getItem('nombreUsuario');
const esAdmin = localStorage.getItem('esAdmin');
const rol = localStorage.getItem('rolUsuario');
const codigo = localStorage.getItem('codigoUsuario');

document.getElementById('bienvenida').innerText = 'Bienvenido, ' + nombre;

if (esAdmin === 'si') {
  document.getElementById('accesoAdmin').style.display = 'block';
}

function guardarSolicitud() {
  const fecha = document.getElementById('fecha').value;
  const inicio = document.getElementById('inicio').value;
  const fin = document.getElementById('fin').value;
  const motivo = document.getElementById('motivo').value;

  if (!fecha || !inicio || !fin || !motivo) {
    alert('Completa todos los campos');
    return;
  }

  let estado = 'Pendiente';
  let autorizadoPor = document.getElementById('autorizador').value;

  if (esAdmin === 'si') {
    estado = 'Aprobada';
    autorizadoPor = nombre;
  } else {
    if (!autorizadoPor) {
      alert('Selecciona quién autorizará la solicitud');
      return;
    }
  }

  const horaInicio = new Date(`2000-01-01 ${inicio}`);
  const horaFin = new Date(`2000-01-01 ${fin}`);
  const diferencia = (horaFin - horaInicio) / (1000 * 60 * 60);

  const datos = {
    fecha: fecha,
    codigo: codigo,
    nombre: nombre,
    inicio: inicio,
    fin: fin,
    totalHoras: diferencia,
    motivo: motivo,
    estado: estado,
    autorizadoPor: autorizadoPor
  };

  fetch('https://script.google.com/macros/s/AKfycbxRtRFVdvW9aB81X4_7KqRwPiZT6nmwz9KY-OZP8XYhe2f8d6mQFAIuV_SKKXWFxg/exec', {
    method: 'POST',
    body: JSON.stringify(datos)
  })
  .then(response => response.json())
  .then(() => {
    alert('Solicitud enviada correctamente');
    document.getElementById('fecha').value = '';
    document.getElementById('inicio').value = '';
    document.getElementById('fin').value = '';
    document.getElementById('motivo').value = '';
  })
  .catch(error => {
    alert('Error al enviar solicitud');
    console.log(error);
  });
}