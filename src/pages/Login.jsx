import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [codigo, setCodigo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!codigo || !clave) { setError('Ingresa código y clave'); return }
    setLoading(true)
    setError('')
    try {
      const result = await api.login(codigo, clave)
      if (result.success) {
        login(result.usuario)
        navigate('/')
      } else {
        setError(result.error || 'Código o clave incorrectos')
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⏱️</div>
          <h1 className="text-2xl font-bold text-gray-800">Horas Extras</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Funcionario
            </label>
            <input
              type="number"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu Codigo"
              inputMode="numeric"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clave
            </label>
            <input
              type="password"
              value={clave}
              onChange={e => setClave(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••"
              inputMode="numeric"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-bold text-lg hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
