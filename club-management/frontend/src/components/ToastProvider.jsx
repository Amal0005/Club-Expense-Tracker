import { createContext, useContext, useMemo, useState, useCallback } from 'react'

const ToastCtx = createContext(null)

let idSeq = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((opts) => {
    const id = idSeq++
    const toast = { id, ...opts }
    setToasts((t) => [...t, toast])
    const timeout = opts.duration ?? 3000
    if (timeout > 0) {
      setTimeout(() => remove(id), timeout)
    }
    return id
  }, [remove])

  const api = useMemo(() => ({
    success: (message, options={}) => push({ message, type: 'success', ...options }),
    error: (message, options={}) => push({ message, type: 'error', ...options }),
    info: (message, options={}) => push({ message, type: 'info', ...options }),
    remove,
  }), [push, remove])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={[
            'rounded-lg shadow border px-3 py-2 text-sm max-w-xs bg-white/90 backdrop-blur',
            t.type === 'success' && 'border-emerald-200 text-emerald-800',
            t.type === 'error' && 'border-red-200 text-red-700',
            t.type === 'info' && 'border-gray-200 text-gray-700',
          ].filter(Boolean).join(' ')}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
