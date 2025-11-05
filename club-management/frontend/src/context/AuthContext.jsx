import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }) // {id,name,role,fixedAmount}
  const [ready, setReady] = useState(false)

  const login = (payload) => {
    localStorage.setItem('token', payload.token)
    setUser(payload.user)
    try { localStorage.setItem('user', JSON.stringify(payload.user)) } catch {}
  }
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!token) { setReady(true); return }
      try {
        const { data } = await api.get('/auth/me')
        if (!cancelled) {
          setUser(data)
          try { localStorage.setItem('user', JSON.stringify(data)) } catch {}
        }
      } catch (_e) {
        // token invalid; clear
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    init()
    return () => { cancelled = true }
  }, [token])

  return (
    <AuthCtx.Provider value={{ user, token, ready, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
