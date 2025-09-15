import { createContext } from 'react';
import type { ToastContextValue } from './Toast.types';

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
