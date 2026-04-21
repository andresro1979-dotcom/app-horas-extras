const urlScript = 'https://script.google.com/macros/s/AKfycbxRtRFVdvW9aB81X4_7KqRwPiZT6nmwz9KY-OZP8XYhe2f8d6mQFAIuV_SKKXWFxg/exec';

const nombreAdmin = localStorage.getItem('nombreUsuario');
let todasLasSolicitudes = [];

function cargarSolicitudes() {
  fetch(urlScript)
    .then(response => response.json())
    .then(data => {
      const contenedor = document.getElementById('contenedorSolicitudes');
      contenedor.innerHTML = '';

      const hoy = new Date();
      const mesActual = hoy.getMonth();
      const anioActual = hoy.getFullYear();

      todasLasSolicitudes = data.filter(item => {
        const fechaSolicitud = new Date(item.fecha);
        return (
          item.autorizadoPor === nombreAdmin &&
          fechaSolicitud.getMonth() === mesActual &&
          fechaSolicitud.getFullYear() === anioActual
        );
      });

      const pendientes = todasLasSolicitudes.filter(item => item.estado === 'Pendiente');

      if (pendientes.length === 0) {
        contenedor.innerHTML = '<div class="sin-solicitudes">No hay solicitudes pendientes para aprobar</div>';
        return;
      }

      pendientes.forEach((solicitud) => {
        const card = document.createElement('div');
        card.className = 'solicitud-card pendiente';
        card.id = 'card-' + solicitud.id;

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
          <div class="acciones">
            <button class="btn-aprobar" onclick="aprobarSolicitud('${solicitud.id}', this)">&#10003; Aprobar</button>
            <button class="btn-rechazar" onclick="rechazarSolicitud('${solicitud.id}', this)">&#10007; Rechazar</button>
          </div>
        `;

        contenedor.appendChild(card);
      });
    })
    .catch(() => alert('Error al cargar solicitudes'));
}

function aprobarSolicitud(id, boton) {
  if (!confirm('Aprobar esta solicitud de horas extras?')) return;
  boton.disabled = true;
  boton.textContent = 'Aprobando...';
  boton.closest('.acciones').querySelector('.btn-rechazar').disabled = true;

  const img = new Image();
  img.src = urlScript + '?accion=aprobar&id=' + id + '&t=' + Date.now();

  const card = boton.closest('.solicitud-card');
  setTimeout(() => {
    card.querySelector('.estado').textContent = 'Aprobada';
    card.querySelector('.estado').className = 'estado aprobada-texto';
    card.className = 'solicitud-card aprobada';
    setTimeout(() => card.remove(), 1000);
  }, 1500);
}

function rechazarSolicitud(id, boton) {
  if (!confirm('Rechazar esta solicitud de horas extras?')) return;
  boton.disabled = true;
  boton.textContent = 'Rechazando...';
  boton.closest('.acciones').querySelector('.btn-aprobar').disabled = true;

  const img = new Image();
  img.src = urlScript + '?accion=rechazar&id=' + id + '&t=' + Date.now();

  const card = boton.closest('.solicitud-card');
  setTimeout(() => {
    card.querySelector('.estado').textContent = 'Rechazada';
    card.querySelector('.estado').className = 'estado rechazada-texto';
    card.className = 'solicitud-card rechazada';
    setTimeout(() => card.remove(), 1000);
  }, 1500);
}

function mostrarResumen() {
  fetch(urlScript)
    .then(response => response.json())
    .then(data => {
      const hoy = new Date();
      const mesActual = hoy.getMonth();
      const anioActual = hoy.getFullYear();

      todasLasSolicitudes = data.filter(item => {
        const fechaSolicitud = new Date(item.fecha);
        return (
          item.autorizadoPor === nombreAdmin &&
          fechaSolicitud.getMonth() === mesActual &&
          fechaSolicitud.getFullYear() === anioActual
        );
      });

      const lista = document.getElementById('listaResumen');
      lista.innerHTML = '';

      if (todasLasSolicitudes.length === 0) {
        lista.innerHTML = '<p class="sin-datos">Sin solicitudes este mes</p>';
      } else {
        todasLasSolicitudes.forEach(s => {
          const claseEstado = s.estado === 'Pendiente' ? 'pendiente-texto' :
                              s.estado === 'Aprobada' ? 'aprobada-texto' : 'rechazada-texto';
          const item = document.createElement('div');
          item.className = 'resumen-item';
          item.innerHTML =
            '<span class="resumen-nombre">' + s.nombre + '</span>' +
            '<span class="estado ' + claseEstado + '">' + s.estado + '</span>';
          lista.appendChild(item);
        });
      }

      document.getElementById('modalResumen').classList.remove('oculto');
    })
    .catch(() => alert('Error al cargar el resumen'));
}

function cerrarResumen() {
  document.getElementById('modalResumen').classList.add('oculto');
}

function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-CL');
}

function formatearHora(hora) {
  if (!hora) return '';
  return new Date(hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

cargarSolicitudes();
