import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ title, back }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <div className="bg-blue-700 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-md">
      {back ? (
        <button
          onClick={() => navigate(-1)}
          className="text-3xl leading-none w-9 text-blue-200 hover:text-white transition-colors"
        >
          ‹
        </button>
      ) : (
        <div className="w-9" />
      )}

      <h1 className="font-bold text-lg flex-1 text-center">{title}</h1>

      <button
        onClick={logout}
        className="text-sm text-blue-200 hover:text-white transition-colors w-9 text-right"
        title="Cerrar sesión"
      >
        ⏻
      </button>
    </div>
  )
}
