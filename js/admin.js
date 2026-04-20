const urlScript = 'https://script.google.com/macros/s/AKfycbxRtRFVdvW9aB81X4_7KqRwPiZT6nmwz9KY-OZP8XYhe2f8d6mQFAIuV_SKKXWFxg/exec';

const nombreAdmin = localStorage.getItem('nombreUsuario');

fetch(urlScript)
  .then(response => response.json())
  .then(data => {
    const contenedor = document.getElementById('contenedorSolicitudes');
    contenedor.innerHTML = '';

    const hoy = new Date();
const mesActual = hoy.getMonth();
const anioActual = hoy.getFullYear();

const pendientes = data.filter(item => {
  const fechaSolicitud = new Date(item.fecha);

  return (
    item.autorizadoPor === nombreAdmin &&
    fechaSolicitud.getMonth() === mesActual &&
    fechaSolicitud.getFullYear() === anioActual
  );
});

    if (pendientes.length === 0) {
      contenedor.innerHTML = '<div class="sin-solicitudes">No hay solicitudes pendientes para aprobar</div>';
      return;
    }

    pendientes.forEach((solicitud) => {
      const card = document.createElement('div');
      card.className = 'solicitud-card pendiente';

      card.innerHTML = `
        <div class="solicitud-header">
          <h2>${solicitud.nombre}</h2>
          <span class="estado pendiente-texto">${solicitud.estado}</span>
        </div>
        <div class="solicitud-info">
          <p><strong>Fecha:</strong> ${formatearFecha(solicitud.fecha)}</p>
          <p><strong>Hora Inicio:</strong> ${formatearHora(solicitud.inicio)}</p>
          <p><strong>Hora Término:</strong> ${formatearHora(solicitud.fin)}</p>
          <p><strong>Total Horas:</strong> ${solicitud.totalHoras}</p>
          <p><strong>Motivo:</strong> ${solicitud.motivo}</p>
          <p><strong>Autorizado Por:</strong> ${solicitud.autorizadoPor}</p>
        </div>
        <textarea placeholder="Agregar observación..." class="observacion"></textarea>
        <div class="acciones">
  <div class="solo-lectura">
    Solo visualización desde móvil
  </div>
</div>
      `;

      contenedor.appendChild(card);
    });
  })
  .catch(() => alert('Error al cargar solicitudes'));

function aprobarSolicitud(id, boton) {
  const card = boton.closest('.solicitud-card');
  const img = new Image();
  img.src = urlScript + '?accion=aprobar&id=' + id + '&t=' + Date.now();
  setTimeout(() => card.remove(), 1500);
}

function rechazarSolicitud(id, boton) {
  const card = boton.closest('.solicitud-card');
  const img = new Image();
  img.src = urlScript + '?accion=rechazar&id=' + id + '&t=' + Date.now();
  setTimeout(() => card.remove(), 1500);
}

function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-CL');
}

function formatearHora(hora) {
  if (!hora) return '';
  return new Date(hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}