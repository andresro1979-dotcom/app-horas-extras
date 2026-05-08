import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import Navbar from '../components/Navbar'

const ESTADO_BADGE = {
  'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Aprobada':  'bg-green-100 text-green-800 border-green-200',
  'Rechazada': 'bg-red-100 text-red-800 border-red-200',
}

const FILTROS = ['Pendiente', 'Aprobada', 'Rechazada', 'Todos']

export default function AdminPanel() {
  const { usuario } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [filtro, setFiltro] = useState('Pendiente')
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(null)
  const [error, setError] = useState('')

  const cargar = useCallback(() => {
    setLoading(true)
    setError('')
    api.getSolicitudes(usuario.codigo, usuario.rol)
      .then(res => {
        if (res.error) setError(res.error)
        else setSolicitudes(res.solicitudes || [])
      })
      .catch(() => setError('Error al cargar solicitudes'))
      .finally(() => setLoading(false))
  }, [usuario.codigo, usuario.rol])

  useEffect(() => { cargar() }, [cargar])

  const handleEstado = async (id, estado) => {
    setProcesando(id)
    try {
      const result = await api.actualizarEstado(id, estado, usuario.nombre)
      if (result.success) {
        setSolicitudes(prev =>
          prev.map(s => s.id === id ? { ...s, estado, autorizadoPor: usuario.nombre } : s)
        )
      } else {
        alert(result.error || 'Error al actualizar estado')
      }
    } catch {
      alert('Error de conexión')
    } finally {
      setProcesando(null)
    }
  }

  const conteo = (estado) => solicitudes.filter(s => s.estado === estado).length
  const filtradas = filtro === 'Todos'
    ? solicitudes
    : solicitudes.filter(s => s.estado === filtro)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Panel Administrador" back />
      <div className="p-4 max-w-lg mx-auto">

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Pendientes', estado: 'Pendiente', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
            { label: 'Aprobadas',  estado: 'Aprobada',  color: 'text-green-700 bg-green-50 border-green-200' },
            { label: 'Rechazadas', estado: 'Rechazada', color: 'text-red-700 bg-red-50 border-red-200' },
          ].map(({ label, estado, color }) => (
            <div key={estado} className={`border rounded-xl p-3 text-center ${color}`}>
              <p className="text-2xl font-bold">{conteo(estado)}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTROS.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                filtro === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f === 'Todos' ? `Todos (${solicitudes.length})` : `${f} (${conteo(f)})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-16">
            <div className="text-4xl mb-2">⏳</div>
            <p>Cargando...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-4 text-sm text-center">
            <p className="mb-3">{error}</p>
            <button onClick={cargar} className="underline font-medium">Reintentar</button>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <div className="text-4xl mb-2">✅</div>
            <p>Sin solicitudes {filtro !== 'Todos' ? `en estado "${filtro}"` : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map(sol => (
              <div key={sol.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-800 text-base">{sol.nombre}</p>
                    <p className="text-sm text-gray-500">{sol.fecha}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ESTADO_BADGE[sol.estado] || 'bg-gray-100'}`}>
                    {sol.estado}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <span className="text-blue-600 font-bold">{sol.totalHoras} hrs</span>
                  <span className="text-gray-400 text-sm">{sol.inicio} → {sol.fin}</span>
                </div>

                <p className="text-gray-600 text-sm mb-3">{sol.motivo}</p>

                {sol.autorizadoPor && sol.estado !== 'Pendiente' && (
                  <p className="text-xs text-gray-400 mb-3">Por: {sol.autorizadoPor}</p>
                )}

                {sol.estado === 'Pendiente' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEstado(sol.id, 'Aprobada')}
                      disabled={procesando === sol.id}
                      className="flex-1 bg-green-600 text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50 active:scale-95 transition-all"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      onClick={() => handleEstado(sol.id, 'Rechazada')}
                      disabled={procesando === sol.id}
                      className="flex-1 bg-red-600 text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50 active:scale-95 transition-all"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
