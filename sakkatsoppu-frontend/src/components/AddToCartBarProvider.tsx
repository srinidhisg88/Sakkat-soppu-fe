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
  const { totalPrice } = useCart();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const timerRef = useRef<number | null>(null);
  const lastCountRef = useRef(0);
  const reappearUntilRef = useRef<number>(0);
  const lastReopenAtRef = useRef<number>(0);

  // Fetch coupons (public/admin hybrid already handled in api.getCoupons path)
  const { data: coupons = [] } = useQuery<Coupon[]>({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => {
      try {
        const res = await getCoupons({ page: 1, limit: 100 });
        const d: unknown = res.data;
        if (Array.isArray(d)) return d as Coupon[];
        if (d && typeof d === 'object' && Array.isArray((d as { data?: unknown[] }).data)) {
          return ((d as { data?: unknown[] }).data || []) as Coupon[];
        }
        return [] as Coupon[];
      } catch {
        return [] as Coupon[];
      }
    },
    staleTime: 5 * 60_000,
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
  });

  const hint = useMemo(() => {
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
    return hints.join(' • ');
  }, [coupons, deliverySettings, totalPrice]);

  const showBar = useCallback((addedCount: number) => {
    const now = Date.now();
    const withinWindow = now < reappearUntilRef.current || open; // accumulate when visible or within reappear window
    const base = withinWindow ? lastCountRef.current : 0;
    const nextCount = Math.max(0, base) + Math.max(0, addedCount);
    lastCountRef.current = nextCount;
    reappearUntilRef.current = now + 60_000; // allow scroll re-open for 60s
    setCount(nextCount);
    setOpen(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(false), 3000);
  }, [open]);

  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  // Re-open the bar briefly if user scrolls within a short window after an add
  useEffect(() => {
    const onScroll = () => {
      const now = Date.now();
      if (open) return; // already visible
      if (now > reappearUntilRef.current) return; // window elapsed
      // throttle reopens to avoid spam
      if (now - lastReopenAtRef.current < 1200) return;
      lastReopenAtRef.current = now;
      if (lastCountRef.current > 0) {
        setCount(lastCountRef.current);
        setOpen(true);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setOpen(false), 3000);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);

  // If we navigate to the cart page (e.g., by pressing View Cart), hide and prevent re-open
  useEffect(() => {
    if (location.pathname === '/cart') {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setOpen(false);
      reappearUntilRef.current = 0;
    }
  }, [location.pathname]);

  const value = useMemo<Ctx>(() => ({ showBar }), [showBar]);

  const handleViewCart = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setOpen(false);
    reappearUntilRef.current = 0; // disable re-open on scroll after explicit view
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
            className="fixed inset-x-0 bottom-3 z-50 px-3 sm:px-4"
          >
            <div className="mx-auto w-full max-w-xl">
              <div className="rounded-xl shadow-lg bg-green-600 text-white flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">{count} product{count !== 1 ? 's' : ''} added</p>
                  {hint && (
                    <p className="text-[11px] sm:text-xs text-white/90 truncate">{hint}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="hidden sm:inline-flex px-3 py-2 rounded-lg bg-white/15 hover:bg-white/20 text-white text-sm"
                  >
                    Hide
                  </button>
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
