import React, { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PoliciesSection from './PoliciesSection';
import { PoliciesModalContext } from './PoliciesModalContext';

type CtxOpts = { whatsappNumber?: string };

export const PoliciesModalProvider: React.FC<React.PropsWithChildren<{ whatsappNumber?: string }>> = ({ children, whatsappNumber }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [whatsApp, setWhatsApp] = useState<string | undefined>(whatsappNumber);

  const open = useCallback((opts?: CtxOpts) => {
    if (opts?.whatsappNumber) setWhatsApp(opts.whatsappNumber);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <PoliciesModalContext.Provider value={value}>
      {children}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={close}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-green-50">
                <div className="flex items-center gap-2 text-green-800">
                  <ShieldCheckIcon className="h-5 w-5" />
                  <h2 className="font-semibold">Policies</h2>
                </div>
                <button onClick={close} aria-label="Close policies" className="p-1 rounded-lg hover:bg-green-100">
                  <XMarkIcon className="h-5 w-5 text-green-800" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <PoliciesSection compact whatsappNumber={whatsApp} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </PoliciesModalContext.Provider>
  );
};

export default PoliciesModalProvider;
