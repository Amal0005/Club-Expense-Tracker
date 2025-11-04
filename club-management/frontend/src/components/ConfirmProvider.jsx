import { createContext, useContext, useState, useCallback } from 'react'

const ConfirmCtx = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false })

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: options.title || 'Are you sure?',
        message: options.message || 'Please confirm this action.',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        intent: options.intent || 'default',
        onResult: (v) => resolve(v),
      })
    })
  }, [])

  const close = (v) => {
    const cb = state.onResult
    setState({ open: false })
    if (cb) cb(v)
  }

  return (
    <ConfirmCtx.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => close(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900">{state.title}</h3>
            <p className="text-sm text-gray-600 mt-1.5">{state.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1.5 text-sm rounded-md border border-gray-200 bg-white hover:bg-gray-50" onClick={() => close(false)}>
                {state.cancelText}
              </button>
              <button
                className={[
                  'px-3 py-1.5 text-sm rounded-md text-white',
                  state.intent === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-black',
                ].join(' ')}
                onClick={() => close(true)}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmCtx)
