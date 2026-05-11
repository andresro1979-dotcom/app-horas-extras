import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import Navbar from '../components/Navbar'

export default function Home() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [periodoActual, setPeriodoActual] = useState(null)

  useEffect(() => {
    api.getConfig().then(cfg => {
      if (cfg.periodos) {
        const hoy = new Date()
        const actual = cfg.periodos.find(p => {
          const ini = new Date(p.inicio)
          const fin = new Date(p.fin)
          return hoy >= ini && hoy <= fin
        })
        setPeriodoActual(actual)
      }
    }).catch(() => {})
  }, [])

  const cards = [
    {
      icon: '➕',
      title: 'Nueva Solicitud',
      desc: 'Registrar horas extras',
      action: () => navigate('/nueva'),
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      show: usuario?.rol !== 'Visor',
    },
    {
      icon: '📋',
      title: 'Mis Solicitudes',
      desc: 'Ver mi historial',
      action: () => navigate('/solicitudes'),
      color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
      show: true,
    },
    {
      icon: '✅',
      title: 'Panel Administrador',
      desc: 'Aprobar y rechazar solicitudes',
      action: () => navigate('/admin'),
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      show: usuario?.rol === 'Admin',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Inicio" />
      <div className="p-4 max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-blue-700 to-blue-800 text-white rounded-2xl p-5 mb-6 shadow-md">
          <div className="flex items-center gap-4">
            {usuario?.foto ? (
              <img src={usuario.foto} alt="Foto" className="w-14 h-14 rounded-full object-cover border-2 border-blue-400 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold border-2 border-blue-400 shrink-0">
                {usuario?.nombre?.charAt(0) ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-blue-200 text-sm">Bienvenido</p>
              <h2 className="text-xl font-bold mt-0.5 leading-tight">{usuario?.nombre}</h2>
              <p className="text-blue-300 text-sm">{usuario?.cargo || usuario?.rol}</p>
            </div>
          </div>
          {periodoActual && (
            <p className="text-blue-200 text-xs mt-3 border-t border-blue-600 pt-2">
              Período {periodoActual.numero}: {periodoActual.inicio} → {periodoActual.fin}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {cards.filter(c => c.show).map(card => (
            <button
              key={card.title}
              onClick={card.action}
              className={`w-full border-2 ${card.color} rounded-2xl p-5 text-left flex items-center gap-4 active:scale-95 transition-all`}
            >
              <span className="text-3xl">{card.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg leading-tight">{card.title}</h3>
                <p className="text-gray-500 text-sm">{card.desc}</p>
              </div>
              <span className="text-gray-400 text-2xl">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
