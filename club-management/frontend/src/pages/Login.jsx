import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

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
  const [mounted, setMounted] = useState(false)
  const isFormValid = username.trim().length > 0 && password.trim().length > 0
  const containerRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const applyScrollBehavior = () => {
      const isMobile = window.matchMedia('(max-width: 640px)').matches
      if (!isMobile) { document.body.classList.remove('no-scroll-mobile'); return }
      const el = containerRef.current
      if (!el) { document.body.classList.remove('no-scroll-mobile'); return }
      const fits = el.scrollHeight <= window.innerHeight
      if (fits) document.body.classList.add('no-scroll-mobile')
      else document.body.classList.remove('no-scroll-mobile')
    }
    applyScrollBehavior()
    window.addEventListener('resize', applyScrollBehavior)
    return () => {
      window.removeEventListener('resize', applyScrollBehavior)
      document.body.classList.remove('no-scroll-mobile')
    }
  }, [])

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
    <div ref={containerRef} className="min-h-svh grid place-items-center px-4 py-3 relative overflow-y-auto">
      {/* Gradient Background */}
      <div className="absolute inset-0 "></div>
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/10"></div>

      {/* Main Container */}
      <div className={`relative z-10 w-full max-w-md transition-all duration-700 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        
        {/* Profile Icon Circle - Overlapping */}
        <div className="flex justify-center relative z-20">
          <div className={`w-16 h-16 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
            isAdminLogin 
              ? 'bg-gradient-to-br from-slate-700 to-slate-900' 
              : 'bg-gradient-to-br from-blue-800 to-blue-950'
          }`}>
            <svg className="w-10 h-10 sm:w-14 sm:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        {/* Main Card with Glassmorphism */}
        <div className="bg-white/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          
          {/* Card Content */}
          <div className="pt-6 sm:pt-16 px-6 sm:px-10 pb-4">
            {/* Dynamic Title */}
            <h1 className="text-center text-xl sm:text-2xl font-semibold text-slate-800 mb-6">
              {isAdminLogin ? 'Admin Login' : 'User Login'}
            </h1>
            
            {/* Alert Messages */}
            {(err || msg) && (
              <div className="mb-6">
                {err && (
                  <div className="bg-red-500/20 backdrop-blur-xl border border-red-300/50 text-red-900 px-4 py-3 rounded-xl text-sm">
                    {err}
                  </div>
                )}
                {msg && (
                  <div className="bg-green-500/20 backdrop-blur-xl border border-green-300/50 text-green-900 px-4 py-3 rounded-xl text-sm">
                    {msg}
                  </div>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={loginPassword} className="space-y-4">
              
              {/* Username Field */}
              <div className="relative">
                <div className="flex items-center bg-blue-900/60 backdrop-blur-xl rounded-xl overflow-hidden shadow-lg border border-white/20">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-950/80 border-r border-white/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="flex-1 h-12 px-4 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="flex items-center bg-blue-900/60 backdrop-blur-xl rounded-xl overflow-hidden shadow-lg border border-white/20">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-950/80 border-r border-white/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="flex-1 h-12 px-4 bg-transparent text-white placeholder-white/60 outline-none text-sm sm:text-base"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 text-white/70 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password - removed as per image */}

              {/* Submit Button - sticky at bottom for visibility on mobile */}
              <div className="sticky bottom-0 -mx-6 sm:-mx-10 px-6 sm:px-10 pb-[env(safe-area-inset-bottom)] pt-3 bg-white/60 supports-[backdrop-filter]:bg-white/40 backdrop-blur z-10 rounded-b-3xl">
                <button
                  type="submit"
                  onClick={loginPassword}
                  disabled={loading || !isFormValid}
                  className={`w-full h-12 rounded-2xl font-semibold text-base sm:text-lg tracking-wide transition-all duration-300 ${
                    isFormValid && !loading
                      ? 'bg-white/90 backdrop-blur-xl text-blue-900 hover:bg-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/70 text-blue-900/50 border border-blue-200 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'LOGIN'
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* User-only helper text */}
          {!isAdminLogin && (
            <div className="px-6 sm:px-10 pb-[env(safe-area-inset-bottom)] sm:pb-6 mt-2">
              <p className="text-center text-sm text-slate-700/80">
                Facing any problem? Contact Admin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}