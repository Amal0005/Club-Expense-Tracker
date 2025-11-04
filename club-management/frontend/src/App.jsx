import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import UserDashboard from './pages/UserDashboard.jsx'
import UserPayments from './pages/UserPayments.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Users from './pages/Users.jsx'
import Expenses from './pages/Expenses.jsx'
import Payments from './pages/Payments.jsx'
import { useLocation } from 'react-router-dom'
import { ToastProvider, useToast } from './components/ToastProvider.jsx'
import { ConfirmProvider, useConfirm } from './components/ConfirmProvider.jsx'
import api from './api/axios'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  const location = useLocation()
  if (token) return children
  const isAdminPath = location.pathname.startsWith('/admin')
  return <Navigate to={isAdminPath ? '/admin/login' : '/login'} replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

function Nav() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [open, setOpen] = useState(false)
  return (
    <>
    <nav className="bg-white/70 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2" aria-label="Nanma Club home">
          <img src="/Nanma_logo.png" alt="Nanma Club" className="h-9 w-9 rounded-lg ring-1 ring-gray-200 bg-white p-1 shadow-sm object-contain" />
          <span className="text-lg font-semibold tracking-wide leading-none text-black">NANMA</span>
        </Link>
      </div>
      <div className="hidden sm:flex items-center gap-3">
        {user?.role === 'admin' && (
          <div className="hidden sm:flex items-center gap-3 mr-2">
            <Link to="/admin" className="text-sm text-gray-700 hover:text-brand-700">Admin</Link>
            <Link to="/admin/users" className="text-sm text-gray-700 hover:text-brand-700">Users</Link>
            <Link to="/admin/expenses" className="text-sm text-gray-700 hover:text-brand-700">Expenses</Link>
            <Link to="/admin/payments" className="text-sm text-gray-700 hover:text-brand-700">Payments</Link>
          </div>
        )}
        {user && user.role !== 'admin' && (
          <Link to="/payments" className="text-sm text-gray-700 hover:text-brand-700 mr-1">My Payments</Link>
        )}
        {user && (
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              (() => {
                const apiBase = (api.defaults.baseURL || '').replace(/\/api$/, '')
                const src = `${apiBase}${user.avatarUrl}`
                return <img src={src} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              })()
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200" />
            )}
            <span className="text-sm text-gray-700">{user.name}</span>
          </div>
        )}
        {user ? (
          <button
            onClick={async () => {
              const ok = await confirm({ title: 'Logout', message: 'Do you really want to logout?', confirmText: 'Logout' })
              if (!ok) return
              logout()
              toast.success('Logged out')
            }}
            className="btn btn-primary text-sm"
          >Logout</button>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-ghost text-sm">Login</Link>
          </div>
        )}
      </div>
      {/* Mobile hamburger */}
      <button
        className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-700"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6.225 4.811L4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586 6.225 4.811z"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>
        )}
      </button>
    </nav>
    {open && (
      <div className="sm:hidden border-b border-gray-200 px-4 py-3 space-y-3">
        {user?.role === 'admin' ? (
          <div className="flex flex-col gap-2">
            <Link to="/admin" className="text-sm text-gray-700 hover:text-brand-700">Admin</Link>
            <Link to="/admin/users" className="text-sm text-gray-700 hover:text-brand-700">Users</Link>
            <Link to="/admin/expenses" className="text-sm text-gray-700 hover:text-brand-700">Expenses</Link>
            <Link to="/admin/payments" className="text-sm text-gray-700 hover:text-brand-700">Payments</Link>
          </div>
        ) : (
          user && (
            <div className="flex flex-col gap-2">
              <Link to="/payments" className="text-sm text-gray-700 hover:text-brand-700">My Payments</Link>
            </div>
          )
        )}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
              <button
                onClick={async () => {
                  const ok = await confirm({ title: 'Logout', message: 'Do you really want to logout?', confirmText: 'Logout' })
                  if (!ok) return
                  logout()
                  toast.success('Logged out')
                  setOpen(false)
                }}
                className="btn btn-primary text-sm"
              >Logout</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-ghost text-sm">Login</Link>
          )}
        </div>
      </div>
    )}
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <div className="min-h-screen">
            <Nav />
            <main className="max-w-5xl mx-auto p-4">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<Login />} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <Users />
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/expenses"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <Expenses />
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/payments"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <Payments />
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <UserPayments />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

