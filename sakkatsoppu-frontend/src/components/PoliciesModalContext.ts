import { createContext, useContext } from 'react';

export type PoliciesModalCtx = {
  open: (opts?: { whatsappNumber?: string }) => void;
  close: () => void;
};

export const PoliciesModalContext = createContext<PoliciesModalCtx | null>(null);

export function usePoliciesModal() {
  const ctx = useContext(PoliciesModalContext);
  if (!ctx) throw new Error('usePoliciesModal must be used within PoliciesModalProvider');
  return ctx;
}
