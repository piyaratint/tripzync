'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; type: ToastType }
interface ToastContextValue { toast: (msg: string, type?: ToastType) => void }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export const useToast = () => useContext(ToastContext)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId++
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
        alignItems: 'center', pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'error'
              ? 'rgba(220,30,30,.95)'
              : t.type === 'success'
              ? 'rgba(20,160,70,.95)'
              : 'rgba(40,40,55,.97)',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 13,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '.08em',
            boxShadow: '0 4px 24px rgba(0,0,0,.45)',
            animation: 'fadeUp .25s ease',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
