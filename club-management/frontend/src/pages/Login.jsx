import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const isAdminLogin = location.pathname.startsWith('/admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const isFormValid = username.trim().length > 0 && password.trim().length > 0

  const loginPassword = async (e) => {
    e.preventDefault()
    setErr(''); setMsg(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      if (isAdminLogin && data.user.role !== 'admin') {
        setErr('Admin account required.')
        return
      }
      login(data)
      nav(isAdminLogin || data.user.role === 'admin' ? '/admin' : '/')
    } catch (e) {
      setErr(e.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
   <div className="px-4 py-8 sm:py-12 min-h-[calc(100vh-8rem)] flex items-start sm:items-center justify-center">
    <div className="w-full max-w-md relative">
    <div className="bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
      <div className="p-8 border-b border-white/50">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isAdminLogin ? 'bg-slate-900 text-white' : 'bg-white/80'}`}>
            {isAdminLogin ? '👑' : '🔐'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isAdminLogin ? 'Admin' : 'Sign In'}</h1>
          </div>
        </div>
      </div>

      {(err || msg) && (
        <div className="p-6 pb-0">
          {err && <div className="bg-red-100/80 backdrop-blur-xl border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">{err}</div>}
          {msg && <div className="bg-emerald-100/80 backdrop-blur-xl border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm">{msg}</div>}
        </div>
      )}

      <form onSubmit={loginPassword} className="p-8 space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Username</label>
          <input
            type="text"
            className="w-full h-12 px-4 bg-white/60 backdrop-blur-xl border border-white/50 rounded-xl outline-none focus:border-slate-400 transition-all"
            placeholder="Enter username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full h-12 px-4 pr-24 bg-white/60 backdrop-blur-xl border border-white/50 rounded-xl outline-none focus:border-slate-400 transition-all"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs bg-white/80 hover:bg-white rounded-lg transition-all"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className={`w-full h-12 rounded-xl font-medium transition-all ${
            isFormValid && !loading
              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
   </div>
  </div>

  )
}
