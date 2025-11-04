import { createContext, useContext, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // {id,name,role,fixedAmount}

  const login = (payload) => {
    localStorage.setItem('token', payload.token)
    setUser(payload.user)
  }
  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  return (
    <AuthCtx.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
