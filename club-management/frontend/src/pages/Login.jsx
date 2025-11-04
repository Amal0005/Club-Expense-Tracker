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
    <div className="min-h-[calc(100vh-64px)] grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-lg grid place-items-center text-sm font-semibold ${isAdminLogin ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>{isAdminLogin ? 'AD' : 'LG'}</div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{isAdminLogin ? 'Admin Login' : 'Log In'}</h1>
                <p className="text-xs text-gray-500">{isAdminLogin ? 'Use your admin credentials to continue' : 'Welcome back. Please enter your details'}</p>
              </div>
            </div>
          </div>

          {(err || msg) && (
            <div className="px-6 pt-4">
              {err && (
                <div className="text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">{err}</div>
              )}
              {msg && (
                <div className="text-sm rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 mt-2">{msg}</div>
              )}
            </div>
          )}

          <form onSubmit={loginPassword} className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-medium text-gray-700">Username</label>
              <Input id="username" className="h-10" placeholder="e.g. admin" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-gray-700">Password</label>
              <div className="relative">
                <Input id="password" className="h-10 pr-24" placeholder="••••••••" type={showPassword ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required />
                <Button type="button" variant="subtle" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 my-1 mr-1 h-8 px-3 text-xs">{showPassword ? 'Hide' : 'Show'}</Button>
              </div>
            </div>

            <Button disabled={loading} className="h-10 w-full">{loading ? 'Signing in…' : isAdminLogin ? 'Sign in as Admin' : 'Sign in'}</Button>
          </form>
        </Card>

        <div className="text-center mt-4 text-xs text-gray-500">
         
        </div>
      </div>
    </div>
  )
}
