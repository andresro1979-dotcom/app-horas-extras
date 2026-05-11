import { formatHoras } from '../utils/formatHoras'
import { ESTADO_BADGE } from '../utils/constants'

export default function SolicitudCard({ solicitud: s }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex justify-between items-start mb-1.5">
        <p className="font-bold text-gray-800">{s.fecha}</p>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ESTADO_BADGE[s.estado] || 'bg-gray-100 text-gray-600'}`}>
          {s.estado}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-blue-600 font-bold">{formatHoras(s.totalHoras)}</span>
        <span className="text-gray-400 text-sm">{s.inicio} → {s.fin}</span>
      </div>

      <p className="text-gray-600 text-sm">{s.motivo}</p>

      {s.autorizadoPor && (
        <p className="text-xs text-gray-400 mt-2">Autorizado por: {s.autorizadoPor}</p>
      )}
    </div>
  )
}
