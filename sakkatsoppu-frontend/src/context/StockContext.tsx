/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type StockRecord = { productId: string; stock: number; version?: number; updatedAt?: string };

type StockContextValue = {
  stocks: Map<string, number>;
  updateWatched: (ids: string[]) => void;
};

const StockContext = createContext<StockContextValue | undefined>(undefined);

function buildUrl(ids: string[]) {
  const qs = ids.length ? `?ids=${encodeURIComponent(ids.join(','))}` : '';
  // Use relative path so Vite dev proxy or same-origin works
  return `/api/realtime/stock${qs}`;
}

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [stocks, setStocks] = useState<Map<string, number>>(new Map());
  const watchedRef = useRef<string[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const backoffRef = useRef<number>(1000); // start with 1s

  const closeES = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const openES = useCallback((ids: string[]) => {
    closeES();
    if (ids.length === 0) {
      return; // nothing to watch
    }
    const url = buildUrl(ids);
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    const handleSnapshot = (ev: MessageEvent) => {
      try {
        const arr: StockRecord[] = JSON.parse(ev.data);
        setStocks((prev) => {
          const next = new Map(prev);
          for (const r of arr || []) {
            if (r && r.productId) next.set(r.productId, Math.max(0, Number(r.stock || 0)));
          }
          return next;
        });
      } catch (e) {
        if (import.meta.env.DEV) console.debug('Failed to parse stock:snapshot', e);
      }
    };

    const handleUpdate = (ev: MessageEvent) => {
      try {
        const r: StockRecord = JSON.parse(ev.data);
        if (r && r.productId) {
          setStocks((prev) => {
            const next = new Map(prev);
            next.set(r.productId, Math.max(0, Number(r.stock || 0)));
            return next;
          });
        }
      } catch (e) {
        if (import.meta.env.DEV) console.debug('Failed to parse stock:update', e);
      }
    };

    es.addEventListener('stock:snapshot', handleSnapshot as EventListener);
    es.addEventListener('stock:update', handleUpdate as EventListener);

    es.onerror = () => {
      // Schedule reconnect with backoff (cap 30s)
      if (reconnectTimer.current) return;
      const delay = Math.min(backoffRef.current, 30000) + Math.floor(Math.random() * 400);
      reconnectTimer.current = window.setTimeout(() => {
        reconnectTimer.current = null;
        backoffRef.current = Math.min(backoffRef.current * 2, 30000);
        openES(watchedRef.current);
      }, delay);
    };

    es.onopen = () => {
      backoffRef.current = 1000; // reset backoff on successful open
    };
  }, [closeES]);

  // Pause stream when tab hidden; resume on focus
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden && watchedRef.current.length) {
        openES(watchedRef.current);
      } else {
        closeES();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, [openES, closeES]);

  const debTimer = useRef<number | null>(null);
  const updateWatched = useCallback((ids: string[]) => {
    const normalized = Array.from(new Set(ids.filter(Boolean)));
    watchedRef.current = normalized;
    if (debTimer.current) window.clearTimeout(debTimer.current);
    debTimer.current = window.setTimeout(() => {
      if (!document.hidden) openES(watchedRef.current);
    }, 250);
  }, [openES]);

  useEffect(() => () => closeES(), [closeES]);

  const value = useMemo<StockContextValue>(() => ({ stocks, updateWatched }), [stocks, updateWatched]);
  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStockContext() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStockContext must be used within StockProvider');
  return ctx;
}
