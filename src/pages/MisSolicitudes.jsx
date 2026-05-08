import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import Navbar from '../components/Navbar'
import SolicitudCard from '../components/SolicitudCard'

const FILTROS = ['Todos', 'Pendiente', 'Aprobada', 'Rechazada']

export default function MisSolicitudes() {
  const { usuario } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [loading, setLoading] = useState(true)
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

  const filtradas = filtro === 'Todos'
    ? solicitudes
    : solicitudes.filter(s => s.estado === filtro)

  const conteo = (estado) => solicitudes.filter(s => s.estado === estado).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Mis Solicitudes" back />
      <div className="p-4 max-w-lg mx-auto">

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {FILTROS.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
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
            <div className="text-4xl mb-2">📭</div>
            <p>Sin solicitudes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map(sol => (
              <SolicitudCard key={sol.id} solicitud={sol} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
