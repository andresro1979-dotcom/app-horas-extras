import { formatHoras } from '../utils/formatHoras'
import { ESTADO_BADGE } from '../utils/constants'

function fmtFecha(str) {
  if (!str) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-')
    return `${d}/${m}/${y}`
  }
  const d = new Date(str)
  return isNaN(d) ? str : d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function SolicitudCard({ solicitud: s }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-1.5">

      <div className="flex justify-between items-center">
        <p className="font-semibold text-gray-800">{fmtFecha(s.fecha)}</p>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ESTADO_BADGE[s.estado] || 'bg-gray-100 text-gray-600'}`}>
          {s.estado}
        </span>
      </div>

      <p className="text-blue-600 font-bold text-xl">{formatHoras(s.totalHoras)}</p>

      <p className="text-gray-700 text-sm">{s.motivo}</p>

      <p className="text-xs text-gray-400">Autoriza: {s.autorizadoPor || '—'}</p>

    </div>
  )
}
