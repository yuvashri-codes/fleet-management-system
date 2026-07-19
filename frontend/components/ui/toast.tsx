'use client';

import React, { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastContextType {
  toast: (props: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(({ type, title, description }: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, title, description }])
    
    // Automatically remove after 4 seconds
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      
      {/* Toast container overlay */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-card p-4 shadow-lg glass-panel"
            >
              {/* Type Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                {t.type === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
                {t.type === 'info' && <Info className="h-5 w-5 text-primary" />}
              </div>

              {/* Text */}
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold leading-none">{t.title}</h4>
                {t.description && (
                  <p className="text-xs text-muted-foreground leading-normal">{t.description}</p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
