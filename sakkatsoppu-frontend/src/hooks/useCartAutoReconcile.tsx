import React from 'react';
import { useStockContext } from '../context/StockContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/useToast';

export function useCartAutoReconcile(opts?: { enabled?: boolean; mutate?: boolean }) {
  const enabled = opts?.enabled ?? true;
  const mutate = opts?.mutate ?? true;
  const { stocks } = useStockContext();
  const { items, updateQuantity } = useCart();
  const { show } = useToast();
  const [recent, setRecent] = React.useState<Array<{ id: string; name: string; from: number; to: number; kind: 'clamped' | 'oos' }>>([]);
  // Track notifications to avoid repeated toasts
  const oosNotifiedRef = React.useRef<Set<string>>(new Set());
  const clampNotifiedRef = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    if (!enabled) return;
    // Global pause guard (used by Checkout during submit)
    try {
      if ((globalThis as unknown as { __RECONCILE_PAUSED?: boolean }).__RECONCILE_PAUSED) return;
    } catch (e) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('Reconcile pause check failed', e);
      }
    }
    if (!items.length) return;
    // Clear OOS notified flags for items that came back in stock
    for (const it of items) {
      const id = it.product._id;
      const available = stocks.get(id);
      if (available != null && available > 0) {
        oosNotifiedRef.current.delete(id);
      }
    }
  const clamped: Array<{ id: string; name: string; from: number; to: number }> = [];
  const oos: Array<{ id: string; name: string; from: number; to: number }> = [];
  const ops: Promise<unknown>[] = [];

    for (const it of items) {
      const id = it.product._id;
      if (!id) continue;
      const available = stocks.get(id);
      if (available == null) continue; // no update known
      const requested = it.quantity;

      if (available <= 0 && requested > 0) {
        // Do NOT auto-remove on transient 0-stock; only notify.
        oos.push({ id, name: it.product.name || 'Item', from: requested, to: 0 });
        // No mutation here; checkout will block/guide, and user can remove manually.
      } else if (available < requested) {
        // Clamp down to available stock to keep server/cart consistent.
        clamped.push({ id, name: it.product.name || 'Item', from: requested, to: available });
        if (mutate) ops.push(updateQuantity(id, available));
      }
    }

    const hasMutations = ops.length > 0;
    const hasOOS = oos.length > 0;

    if (hasMutations) {
      Promise.allSettled(ops).then(() => {
        const recentCombined = [
          ...clamped.map((a) => ({ ...a, kind: 'clamped' as const })),
          ...oos.map((a) => ({ ...a, kind: 'oos' as const })),
        ];
        setRecent(recentCombined.slice(0, 3));
        if (mutate) {
          // Deduplicate clamped notifications by final quantity per product
          const clampedToNotify = clamped.filter((a) => clampNotifiedRef.current.get(a.id) !== a.to);
          for (const a of clampedToNotify) clampNotifiedRef.current.set(a.id, a.to);
          const n = clampedToNotify.length;
          if (n === 1) {
            const a = clampedToNotify[0];
            show(`${a.name} updated to ${a.to} due to stock change`, { type: 'warning' });
          } else if (n > 1) {
            show(`${n} item(s) adjusted to available stock`, { type: 'warning' });
          }
          if (hasOOS) {
            const oosToNotify = oos.filter((a) => !oosNotifiedRef.current.has(a.id));
            oosToNotify.forEach((a) => oosNotifiedRef.current.add(a.id));
            const m = oosToNotify.length;
            if (m === 1) show(`${oosToNotify[0].name} is now out of stock`, { type: 'warning' });
            else if (m > 1) show(`${m} item(s) now out of stock`, { type: 'warning' });
          }
        }
      });
    } else if (hasOOS) {
      // No mutations but still notify for out-of-stock
      setRecent(oos.map((a) => ({ ...a, kind: 'oos' as const })).slice(0, 3));
      if (mutate) {
        const oosToNotify = oos.filter((a) => !oosNotifiedRef.current.has(a.id));
        oosToNotify.forEach((a) => oosNotifiedRef.current.add(a.id));
        const m = oosToNotify.length;
        if (m === 1) show(`${oosToNotify[0].name} is now out of stock`, { type: 'warning' });
        else if (m > 1) show(`${m} item(s) now out of stock`, { type: 'warning' });
      }
    }
  }, [enabled, mutate, items, stocks, updateQuantity, show]);

  const Banner = React.useMemo(() => {
    if (!recent.length) return null;
    return (
      <div className="mt-3 bg-amber-50 text-amber-800 rounded-lg p-3 space-y-1">
        <p className="text-sm font-medium">Stock updates:</p>
        <ul className="list-disc list-inside text-sm">
          {recent.map((r) => (
            <li key={r.id}>
              {r.name}: {r.kind === 'oos' ? (
                <span>now out of stock (had {r.from})</span>
              ) : (
                <span>{r.from} → {r.to}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-amber-700">Items out of stock won’t be auto-removed. Please review your cart before checkout.</p>
      </div>
    );
  }, [recent]);

  return { Banner };
}
