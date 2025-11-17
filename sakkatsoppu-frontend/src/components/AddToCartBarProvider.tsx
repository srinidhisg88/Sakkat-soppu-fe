import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useQuery } from '@tanstack/react-query';
import { getCoupons, getPublicDeliverySettings } from '../services/api';
import { AddToCartBarContext } from '../context/AddToCartBarContext';

type Ctx = {
  showBar: (addedCount: number) => void;
};

type Coupon = {
  code: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  isActive?: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
};

type DeliverySettings = {
  enabled: boolean;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minOrderSubtotal: number;
};

export function AddToCartBarProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalPrice, items } = useCart();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Fetch coupons (public/admin hybrid already handled in api.getCoupons path)
  const { data: coupons = [] } = useQuery<Coupon[]>({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => {
      try {
        const res = await getCoupons({ page: 1, limit: 100 });
        const d = res.data as unknown;
        const arr = (Array.isArray(d)
          ? d
          : (d as { data?: unknown[]; coupons?: unknown[]; items?: unknown[]; results?: unknown[] })?.data
          || (d as { coupons?: unknown[] }).coupons
          || (d as { items?: unknown[] }).items
          || (d as { results?: unknown[] }).results
          || []) as unknown[];
        const list: Coupon[] = arr.map((raw) => {
          const c = raw as Record<string, unknown>;
          const code = ((c?.code as string) || (c?.couponCode as string) || '').toString();
          return {
            code,
            discountType: ((c?.discountType as string) === 'percentage' ? 'percentage' : 'amount') as 'percentage' | 'amount',
            discountValue: Number((c?.discountValue as number | undefined) ?? (c?.value as number | undefined) ?? 0),
            minOrderValue: c?.minOrderValue != null ? Number(c.minOrderValue as number) : undefined,
            maxDiscount: c?.maxDiscount != null ? Number(c.maxDiscount as number) : undefined,
            isActive: (c?.isActive as boolean | undefined) !== false,
            startsAt: (c?.startsAt as string | undefined) ?? null,
            expiresAt: (c?.expiresAt as string | undefined) ?? null,
          } as Coupon;
        });
        return list.filter((c) => c.code);
      } catch {
        return [] as Coupon[];
      }
    },
  staleTime: 5 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  });

  // Delivery settings for minimum order hint
  const { data: deliverySettings } = useQuery<DeliverySettings>({
    queryKey: ['public', 'delivery-settings'],
    queryFn: async () => {
      try {
        const res = await getPublicDeliverySettings();
        const d = res.data as Partial<DeliverySettings> | undefined;
        if (!d) throw new Error('No data');
        return {
          enabled: d.enabled ?? true,
          deliveryFee: d.deliveryFee ?? 0,
          freeDeliveryThreshold: d.freeDeliveryThreshold ?? 0,
          minOrderSubtotal: d.minOrderSubtotal ?? 0,
        };
      } catch {
        return { enabled: true, deliveryFee: 0, freeDeliveryThreshold: 0, minOrderSubtotal: 0 } as DeliverySettings;
      }
    },
  staleTime: 10 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  });

  const hints = useMemo(() => {
    const hints: string[] = [];
    // Minimum order
    if (deliverySettings && deliverySettings.enabled) {
      const min = deliverySettings.minOrderSubtotal ?? 0;
      const below = Math.max(0, min - totalPrice);
      if (below > 0) hints.push(`Add ₹${below} more to reach minimum order`);
    }
    // Best coupon suggestion (simple heuristic)
    if (coupons.length > 0 && totalPrice > 0) {
      // pick highest savings given current total
      let best: { code: string; savings: number } | null = null;
      for (const c of coupons) {
        if (c.isActive === false) continue;
        if (typeof c.minOrderValue === 'number' && totalPrice < c.minOrderValue) continue;
        let savings = 0;
        if (c.discountType === 'amount') savings = Math.min(c.discountValue, totalPrice);
        else if (c.discountType === 'percentage') {
          const pct = (c.discountValue / 100) * totalPrice;
          savings = Math.floor(c.maxDiscount == null ? pct : Math.min(pct, c.maxDiscount));
        }
        if (!best || savings > best.savings) best = { code: c.code, savings };
      }
      if (best && best.savings > 0) hints.push(`Use ${best.code} to save ₹${best.savings}`);
    }
  return hints;
  }, [coupons, deliverySettings, totalPrice]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showBar = useCallback((_addedCount: number) => {
    // Just ensure the bar is visible; count is derived from cart items
    setOpen(true);
  }, []);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  // Disable auto re-open on scroll; we keep the bar visible while the cart has items
  useEffect(() => {
    const noop = () => {};
    window.addEventListener('scroll', noop, { passive: true });
    return () => window.removeEventListener('scroll', noop);
  }, []);

  // If we navigate to the cart page (e.g., by pressing View Cart), hide and prevent re-open
  useEffect(() => {
    if (location.pathname === '/cart' || location.pathname === '/checkout' || location.pathname === '/about') {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setOpen(false);
    }
  }, [location.pathname]);

  // Hide and prevent re-open if cart becomes empty (e.g., decremented from product card)
  useEffect(() => {
    if (!items || items.length === 0) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setOpen(false);
      setCount(0);
    }
  }, [items]);

  // Keep the bar visible while there are items; update count to number of items
  useEffect(() => {
    const c = Array.isArray(items) ? items.length : 0;
    setCount(c);
    if (c > 0 && location.pathname !== '/cart' && location.pathname !== '/checkout' && location.pathname !== '/about') setOpen(true);
  }, [items, location.pathname]);

  const value = useMemo<Ctx>(() => ({ showBar }), [showBar]);

  const handleViewCart = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setOpen(false);
    navigate('/cart');
  }, [navigate]);

  return (
    <AddToCartBarContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="fixed inset-x-0 bottom-20 md:bottom-3 z-50 px-3 sm:px-4"
          >
            <div className="mx-auto w-full max-w-xl">
              <div className="rounded-xl shadow-lg bg-green-600 text-white flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">{count} product{count !== 1 ? 's' : ''} in cart</p>
                  {hints.length > 0 && (
                    <div className="text-[11px] sm:text-xs text-white/90 space-y-0.5">
                      {hints.slice(0, 2).map((h, i) => (
                        <p key={i} className="truncate">{h}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleViewCart}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-white text-green-700 font-semibold text-sm sm:text-base"
                  >
                    View Cart
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AddToCartBarContext.Provider>
  );
}

// Hook exported from a separate file to avoid fast-refresh warnings
