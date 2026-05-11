import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const SESSION_TTL = 8 * 60 * 60 * 1000 // 8 horas en ms

  const [usuario, setUsuario] = useState(() => {
    try {
      const saved = localStorage.getItem('he_usuario')
      if (!saved) return null
      const parsed = JSON.parse(saved)
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem('he_usuario')
        return null
      }
      return parsed
    } catch {
      return null
    }
  })

  const login = (userData) => {
    const data = { ...userData, expiresAt: Date.now() + SESSION_TTL }
    setUsuario(data)
    localStorage.setItem('he_usuario', JSON.stringify(data))
  }

  const logout = () => {
    setUsuario(null)
    localStorage.removeItem('he_usuario')
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
