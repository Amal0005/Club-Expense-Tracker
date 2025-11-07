import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import UserPayments from "./pages/UserPayments.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Users from "./pages/Users.jsx";
import Expenses from "./pages/Expenses.jsx";
import Payments from "./pages/Payments.jsx";
import { useLocation } from "react-router-dom";
import { ToastProvider, useToast } from "./components/ToastProvider.jsx";
import { ConfirmProvider, useConfirm } from "./components/ConfirmProvider.jsx";
import api from "./api/axios";
import Button from "./components/ui/Button.jsx";

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  if (token) return children;
  const isAdminPath = location.pathname.startsWith("/admin");
  return <Navigate to={isAdminPath ? "/admin/login" : "/login"} replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/" replace />;
}

function UserRoute({ children }) {
  const { user } = useAuth();
  // Block admins from user-side pages
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return children;
}

function Nav() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav className="sticky top-0 z-60 bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex flex-col items-center gap-2"
              aria-label="Nanma Club home"
            >
              <div className="relative h-[100px] w-[120px] -my-5">
                <div className="absolute inset-0 rounded-2xl  from-brand-300/50 via-white to-accent/50 blur-[6px] pointer-events-none" aria-hidden="true" />
                <img
                  src="/Nanma_logo.png"
                  alt="Nanma Club"
                  className="relative z-10 h-12px w-15px p-5 object-contain"
                />
             
              </div>
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            {user?.role === "admin" && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <Link
                  to="/admin"
                  className="px-3 py-1.5 rounded-full text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50"
                >
                  Admin
                </Link>
                <Link
                  to="/admin/users"
                  className="px-3 py-1.5 rounded-full text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50"
                >
                  Users
                </Link>
                <Link
                  to="/admin/expenses"
                  className="px-3 py-1.5 rounded-full text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50"
                >
                  Expenses
                </Link>
                <Link
                  to="/admin/payments"
                  className="px-3 py-1.5 rounded-full text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50"
                >
                  Payments
                </Link>
              </div>
            )}
            {user && user.role !== "admin" && (
              <Link
                to="/payments"
                className="px-3 py-1.5 rounded-full text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50 mr-1"
              >
                My Payments
              </Link>
            )}
            {user && (
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  (() => {
                    const apiBase = (api.defaults.baseURL || "").replace(
                      /\/api$/,
                      ""
                    );
                    const src = /^https?:/.test(String(user.avatarUrl)) ? user.avatarUrl : `${apiBase}${user.avatarUrl}`;
                    return (
                      <img
                        src={src}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"
                      />
                    );
                  })()
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 ring-2 ring-gray-200" />
                )}
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
            )}
            {user ? (
              <Button
                size="sm"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Logout",
                    message: "Do you really want to logout?",
                    confirmText: "Logout",
                  });
                  if (!ok) return;
                  logout();
                  toast.success("Logged out");
                }}
              >
                Logout
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button as={Link} to="/login" variant="subtle" size="sm">
                  Login
                </Button>
              </div>
            )}
          </div>
          {/* Mobile hamburger */}
          <button
            className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-700 relative z-[70]"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              // Close (X) icon - rounded strokes
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon - three rounded bars
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 7h14M5 12h14M5 17h14" />
              </svg>
            )}
          </button>
        </div>
      </nav>
      {open && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl border-l border-gray-200 overflow-auto px-4 py-4 space-y-3">
            {/* In-drawer close button (always visible) */}
            <button
              aria-label="Close menu"
              className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-700 z-[60] shadow-sm"
              onClick={() => setOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {user?.role === "admin" ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/admin"
                  className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50"
                  onClick={() => setOpen(false)}
                >
                  Admin
                </Link>
                <Link
                  to="/admin/users"
                  className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50"
                  onClick={() => setOpen(false)}
                >
                  Users
                </Link>
                <Link
                  to="/admin/expenses"
                  className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50"
                  onClick={() => setOpen(false)}
                >
                  Expenses
                </Link>
                <Link
                  to="/admin/payments"
                  className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50"
                  onClick={() => setOpen(false)}
                >
                  Payments
                </Link>
              </div>
            ) : (
              user && (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/payments"
                    className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-brand-700 hover:bg-brand-50"
                    onClick={() => setOpen(false)}
                  >
                    My Payments
                  </Link>
                </div>
              )
            )}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 ring-2 ring-gray-200" />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Logout",
                        message: "Do you really want to logout?",
                        confirmText: "Logout",
                      });
                      if (!ok) return;
                      logout();
                      toast.success("Logged out");
                      setOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button as={Link} to="/login" variant="subtle" size="sm" onClick={() => setOpen(false)}>
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/admin/login';
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-b from-brand-50/60 to-white">
            {!isAuthRoute && <Nav />}
            <main className={isAuthRoute ? '' : 'max-w-6xl mx-auto p-4'}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<Login />} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <UserRoute>
                        <UserDashboard />
                      </UserRoute>
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
                      <UserRoute>
                        <UserPayments />
                      </UserRoute>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
