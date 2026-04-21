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
  if (!confirm('¿Aprobar esta solicitud de horas extras?')) return;

  boton.disabled = true;
  boton.textContent = 'Aprobando...';
  boton.closest('.acciones').querySelector('.btn-rechazar').disabled = true;

  fetch(urlScript + '?accion=aprobar&id=' + id + '&t=' + Date.now())
    .then(() => {
      const card = boton.closest('.solicitud-card');
      card.querySelector('.estado').textContent = 'Aprobada';
      card.querySelector('.estado').className = 'estado aprobada-texto';
      card.className = 'solicitud-card aprobada';
      setTimeout(() => card.remove(), 1000);
    })
    .catch(() => {
      alert('Error al aprobar. Intenta de nuevo.');
      boton.disabled = false;
      boton.textContent = '✓ Aprobar';
    });
}

function rechazarSolicitud(id, boton) {
  if (!confirm('¿Rechazar esta solicitud de horas extras?')) return;

  boton.disabled = true;
  boton.textContent = 'Rechazando...';
  boton.closest('.acciones').querySelector('.btn-aprobar').disabled = true;

  fetch(urlScript + '?accion=rechazar&id=' + id + '&t=' + Date.now())
    .then(() => {
      const card = boton.closest('.solicitud-card');
      card.querySelector('.estado').textContent = 'Rechazada';
      card.querySelector('.estado').className = 'estado rechazada-texto';
      card.className = 'solicitud-card rechazada';
      setTimeout(() => card.remove(), 1000);
    })
    .catch(() => {
      alert('Error al rechazar. Intenta de nuevo.');
      boton.disabled = false;
      boton.textContent = '✗ Rechazar';
    });
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
                              s.estado === 'Aprobada'  ? 'aprobada-texto' : 'rechazada-texto';
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
  const str = String(fecha);
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  const d = new Date(fecha);
  if (!isNaN(d)) return d.toLocaleDateString('es-CL');
  return str;
}

function formatearHora(hora) {
  if (!hora) return '';
  const str = String(hora);
  if (/^\d{1,2}:\d{2}$/.test(str)) return str;
  if (!isNaN(str) && str !== '' && str.includes('.')) {
    const totalMin = Math.round(parseFloat(str) * 24 * 60);
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  const d = new Date(str);
  if (!isNaN(d)) {
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  }
  return str;
}

cargarSolicitudes();