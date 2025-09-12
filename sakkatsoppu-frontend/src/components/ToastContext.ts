import { createContext } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export type ToastContextValue = {
  show: (message: string, opts?: { type?: ToastType; durationMs?: number }) => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
