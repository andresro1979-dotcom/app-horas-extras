import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import Navbar from '../components/Navbar'

function calcHoras(inicio, fin) {
  if (!inicio || !fin) return null
  const [h1, m1] = inicio.split(':').map(Number)
  const [h2, m2] = fin.split(':').map(Number)
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (mins < 0) mins += 24 * 60
  return (mins / 60).toFixed(2)
}

export default function NuevaSolicitud() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const hoy = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    fecha: hoy,
    inicio: '',
    fin: '',
    motivo: '',
    autorizadoPor: '',
    codigoTrabajador: usuario.codigo,
    nombreTrabajador: usuario.nombre,
  })
  const [admins, setAdmins] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.getTrabajadores().then(res => {
      if (res.trabajadores) {
        setAdmins(res.trabajadores.filter(t => t.rol === 'Admin'))
        setTrabajadores(res.trabajadores)
      }
    }).catch(() => {})
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const horas = calcHoras(form.inicio, form.fin)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.inicio || !form.fin || !form.motivo || !form.autorizadoPor) {
      setError('Completa todos los campos requeridos')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await api.crearSolicitud({
        fecha:         form.fecha,
        inicio:        form.inicio,
        fin:           form.fin,
        motivo:        form.motivo,
        autorizadoPor: form.autorizadoPor,
        codigo:        form.codigoTrabajador,
        nombre:        form.nombreTrabajador,
      })
      if (result.success) {
        setSuccess(`✓ Solicitud enviada correctamente. Total: ${result.totalHoras} horas`)
        setTimeout(() => navigate('/solicitudes'), 2200)
      } else {
        setError(result.error || 'Error al enviar la solicitud')
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Nueva Solicitud" back />
      <div className="p-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">

            {/* Trabajador — solo admins pueden cambiar */}
            {usuario.rol === 'Admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trabajador</label>
                <select
                  value={form.codigoTrabajador}
                  onChange={e => {
                    const t = trabajadores.find(t => t.codigo === e.target.value)
                    set('codigoTrabajador', e.target.value)
                    set('nombreTrabajador', t?.nombre || '')
                  }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {trabajadores.map(t => (
                    <option key={t.codigo} value={t.codigo}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => set('fecha', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                <input
                  type="time"
                  value={form.inicio}
                  onChange={e => set('inicio', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora término</label>
                <input
                  type="time"
                  value={form.fin}
                  onChange={e => set('fin', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {horas !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
                <span className="text-blue-700 font-bold text-lg">{horas} horas</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <textarea
                value={form.motivo}
                onChange={e => set('motivo', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe el motivo de las horas extras..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Autorizado por</label>
              <select
                value={form.autorizadoPor}
                onChange={e => set('autorizadoPor', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un administrador...</option>
                {admins.map(a => (
                  <option key={a.codigo} value={a.nombre}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold text-lg disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </form>
      </div>
    </div>
  )
}
