import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import Navbar from '../components/Navbar'
import { formatHoras, calcHoras } from '../utils/formatHoras'

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
  const [admins, setAdmins]           = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [periodos, setPeriodos]       = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  useEffect(() => {
    api.getTrabajadores().then(res => {
      if (res.trabajadores) {
        setAdmins(res.trabajadores.filter(t => t.rol === 'Admin'))
        setTrabajadores(res.trabajadores)
      }
    }).catch(() => {})

    api.getConfig().then(res => {
      if (res.periodos) setPeriodos(res.periodos)
    }).catch(() => {})
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const horas = calcHoras(form.inicio, form.fin)

  // Detecta si la fecha cae fuera del período activo
  const avisoProximoPeriodo = (() => {
    if (!form.fecha || periodos.length === 0) return false
    const fecha = new Date(form.fecha + 'T00:00:00')
    const activo = periodos.find(p => {
      const ini = new Date(p.inicio + 'T00:00:00')
      const fin = new Date(p.fin + 'T00:00:00')
      return fecha >= ini && fecha <= fin
    })
    if (activo) return false
    // Está fuera de todos los períodos — verificar si es fecha futura al último período
    const ultimo = periodos[periodos.length - 1]
    if (!ultimo) return false
    return fecha > new Date(ultimo.fin + 'T00:00:00')
  })()

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
        setSuccess(`✓ Solicitud enviada correctamente. Total: ${formatHoras(result.totalHoras)}`)
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

            {/* Aviso período */}
            {avisoProximoPeriodo && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex gap-2 items-start">
                <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
                <p className="text-amber-800 text-sm">
                  Estas horas extras corresponderán al <strong>próximo período</strong>. Se guardarán igualmente hasta que sea definido.
                </p>
              </div>
            )}

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
                <span className="text-blue-700 font-bold text-lg">{formatHoras(horas)}</span>
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
