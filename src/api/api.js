import { API_URL } from '../config'

async function post(action, data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...data }),
    redirect: 'follow',
  })
  return res.json()
}

async function get(action, params = {}) {
  const url = new URL(API_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { redirect: 'follow' })
  return res.json()
}

export const api = {
  login: (codigo, clave) =>
    post('login', { codigo, clave }),

  getSolicitudes: (codigo, rol) =>
    get('getSolicitudes', { codigo, rol }),

  crearSolicitud: (solicitud) =>
    post('crearSolicitud', { solicitud }),

  actualizarEstado: (id, estado, autorizadoPor) =>
    post('actualizarEstado', { id, estado, autorizadoPor }),

  getConfig: () =>
    get('getConfig'),

  getTrabajadores: () =>
    get('getTrabajadores'),
}
