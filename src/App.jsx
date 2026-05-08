import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import NuevaSolicitud from './pages/NuevaSolicitud'
import MisSolicitudes from './pages/MisSolicitudes'
import AdminPanel from './pages/AdminPanel'

function PrivateRoute({ children, adminOnly }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (adminOnly && usuario.rol !== 'Admin') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { usuario } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/nueva" element={<PrivateRoute><NuevaSolicitud /></PrivateRoute>} />
      <Route path="/solicitudes" element={<PrivateRoute><MisSolicitudes /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
