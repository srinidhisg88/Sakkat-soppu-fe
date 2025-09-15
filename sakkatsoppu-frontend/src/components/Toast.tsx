import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Toast, ToastContextValue } from './Toast.types';
import { ToastContext } from './ToastContext';

// Tiny toast system: useToast().show(message, { type })
// Renders small bottom-center toasts. No external deps.

// Context is defined in a separate file to comply with fast-refresh rules

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  useEffect(() => () => {
    // cleanup timers on unmount
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current.clear();
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback<ToastContextValue['show']>((message: string, opts?: { type?: 'info' | 'success' | 'warning' | 'error'; durationMs?: number }) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const toast: Toast = { id, message, type: opts?.type ?? 'info' };
    setToasts((prev) => [...prev, toast]);
    const timeout = window.setTimeout(() => remove(id), opts?.durationMs ?? 2200);
    timers.current.set(id, timeout);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div className="fixed inset-x-0 bottom-4 flex justify-center z-50 pointer-events-none">
        <div className="space-y-2 w-full max-w-md px-4">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-lg shadow px-4 py-3 text-sm text-white flex items-center justify-between
                ${t.type === 'success' ? 'bg-green-600' : t.type === 'warning' ? 'bg-amber-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}
            >
              <span>{t.message}</span>
              <button
                className="ml-3 text-white/80 hover:text-white"
                onClick={() => remove(t.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

// Hook is exported from a separate file to satisfy fast-refresh rule
