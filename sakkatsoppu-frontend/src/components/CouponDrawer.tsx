import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';

type Coupon = {
  code: string;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  description?: string | null;
};

interface CouponDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  coupons: Coupon[];
  totalAmount: number;
  appliedCode?: string | null;
  onApply: (coupon: Coupon) => void;
}

function computeSavings(c: Coupon, total: number) {
  const totalNum = Number(total) || 0;
  const value = Number(c.discountValue) || 0;
  const max = c.maxDiscount == null ? null : (Number(c.maxDiscount) || 0);
  if (c.discountType === 'amount') return Math.max(0, Math.min(value, totalNum));
  const pct = (value / 100) * totalNum;
  const capped = max == null ? pct : Math.min(pct, max);
  return Math.floor(capped);
}

function eligibilityReason(c: Coupon, total: number): { eligible: boolean; reason?: string; addMore?: number } {
  const min = Number(c.minOrderValue ?? 0) || 0;
  const totalNum = Number(total) || 0;
  if (min > 0 && totalNum < min) {
    return { eligible: false, reason: `Add ₹${min - totalNum} more to avail this offer`, addMore: min - totalNum };
  }
  return { eligible: true };
}

function parseDateBoundary(ts?: string | null, boundary: 'start' | 'end' = 'start'): number | null {
  if (ts == null) return null;
  // Support numbers (epoch seconds/ms) and strings
  if (typeof ts === 'number') {
    const n = ts > 1e12 ? ts : ts * 1000; // seconds vs ms
    return Number.isFinite(n) ? n : null;
  }
  const raw = String(ts).trim();
  if (!raw) return null;
  // Pure epoch string
  if (/^\d{10,13}$/.test(raw)) {
    const n = Number(raw.length <= 10 ? Number(raw) * 1000 : Number(raw));
    return Number.isFinite(n) ? n : null;
  }
  // Normalize space-separated datetime to ISO-like by replacing space with 'T'
  const hasTime = /[T\s]\d{1,2}:\d{2}/.test(raw);
  const normalized = hasTime ? raw.replace(' ', 'T') : raw + (boundary === 'start' ? 'T00:00:00' : 'T23:59:59.999');
  const d = new Date(normalized);
  const ms = d.getTime();
  return isNaN(ms) ? null : ms;
}

function parseActiveFlag(v: unknown): boolean {
  if (v == null) return true; // default to active if not provided
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return !/^(false|0|no|off)$/i.test(v.trim());
  return true;
}

export default function CouponDrawer({ isOpen, onClose, coupons, totalAmount, appliedCode, onApply }: CouponDrawerProps) {
  const [manualCode, setManualCode] = useState('');
  const now = Date.now();

  const parsed = useMemo(() => {
    const list = coupons.map((c) => {
      const startMs = parseDateBoundary(c.startsAt, 'start');
      const endMs = parseDateBoundary(c.expiresAt, 'end');
      // If date parsing fails (null), do not penalize the coupon
      const withinWindow = (startMs == null || startMs <= now) && (endMs == null || now <= endMs);
      const expired = endMs != null && now > endMs;
      const notStarted = startMs != null && now < startMs;
      const inactive = !parseActiveFlag(c.isActive);
      const active = !inactive && !expired && !notStarted && withinWindow;
      const elig = eligibilityReason(c, totalAmount);
      const savings = active && elig.eligible ? computeSavings(c, totalAmount) : 0;
      return { c, active, elig, savings, expired, notStarted, inactive };
    });
    const eligible = list.filter(x => x.active && x.elig.eligible).sort((a,b) => b.savings - a.savings);
    const ineligible = list.filter(x => !(x.active && x.elig.eligible));
    const best = eligible[0]?.c.code || null;
    return { eligible, ineligible, best };
  }, [coupons, totalAmount, now]);

  const tryApplyManual = () => {
    const code = manualCode.trim().toLowerCase();
    const entry = parsed.eligible.find(x => x.c.code.toLowerCase() === code);
    if (entry) {
      onApply(entry.c);
      onClose();
    }
    // else ignore for now; could surface inline error
  };

  const Card = ({ data }: { data: { c: Coupon; active: boolean; elig: { eligible: boolean; reason?: string }; savings: number; expired?: boolean; notStarted?: boolean; inactive?: boolean } }) => {
    const isPercent = data.c.discountType === 'percentage';
    const ribbon = isPercent ? 'PERCENT OFF' : 'FLAT OFF';
    const mainLine = isPercent
      ? `Save ${data.c.discountValue}%${data.c.maxDiscount ? ` up to ₹${data.c.maxDiscount}` : ''}`
      : `Get Flat ₹${data.c.discountValue} off`;
    const ruleLine = isPercent
      ? `Use code ${data.c.code} & save ${data.c.discountValue}%${data.c.maxDiscount ? ` (max ₹${data.c.maxDiscount})` : ''}${data.c.minOrderValue ? ` on orders above ₹${data.c.minOrderValue}` : ''}`
      : `Use code ${data.c.code} & get ₹${data.c.discountValue} off${data.c.minOrderValue ? ` on orders above ₹${data.c.minOrderValue}` : ''}`;
    const disabled = !(data.active && data.elig.eligible);
    const isBest = parsed.best && parsed.best === data.c.code;
    let buttonLabel = appliedCode && appliedCode === data.c.code ? 'APPLIED' : 'APPLY';
    if (disabled) {
      if (data.expired) buttonLabel = 'EXPIRED';
      else if (data.notStarted) buttonLabel = 'SOON';
      else if (data.inactive) buttonLabel = 'UNAVAILABLE';
    }

    return (
      <div className={`relative overflow-hidden rounded-xl border ${disabled ? 'border-gray-200 opacity-70' : 'border-green-200'} bg-white`}> 
        {/* Ribbon */}
        <div className="absolute left-0 top-0 bottom-0 w-14 bg-gray-100 flex flex-col items-center justify-center text-[10px] tracking-wider text-gray-600">
          <div className="rotate-[-90deg] whitespace-nowrap">{ribbon}</div>
        </div>
        {/* Content */}
        <div className="pl-16 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-extrabold tracking-wide">{data.c.code}</p>
              {!data.elig.eligible && data.elig.reason && (
                <p className="text-xs text-amber-700 mt-1">{data.elig.reason}</p>
              )}
              {data.elig.eligible && (
                <p className="text-xs text-green-700 mt-1">You save ₹{data.savings}</p>
              )}
            </div>
            <button
              disabled={disabled}
              onClick={() => { onApply(data.c); onClose(); }}
              className={`text-sm font-semibold ${disabled ? 'text-gray-400 cursor-not-allowed' : 'text-green-700 hover:text-green-800'}`}
            >
              {buttonLabel}
            </button>
          </div>
          <p className="text-sm text-gray-800 mt-2">{mainLine}</p>
          <div className="my-2 border-t border-dashed"></div>
          <p className="text-xs text-gray-600">{ruleLine}</p>
          {disabled && data.expired && (
            <p className="text-xs text-red-600 mt-1">Coupon expired</p>
          )}
          {data.c.description && (
            <p className="text-xs text-gray-500 mt-1">{data.c.description}</p>
          )}
          {isBest && (
            <span className="inline-block mt-2 text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Best savings</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          {/* Drawer - Below bottom nav on mobile */}
          <motion.div
            className="absolute inset-x-0 bottom-0 md:bottom-0 bg-gray-50 rounded-t-2xl shadow-2xl max-h-[calc(85vh-4rem)] md:max-h-[85vh] overflow-auto mb-16 md:mb-0"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="p-4 border-b bg-white rounded-t-2xl">
              <div className="h-1 w-10 bg-gray-200 rounded mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Apply Coupon</p>
                  <p className="text-xs text-gray-500">Your cart: ₹{totalAmount}</p>
                </div>
                <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-800">Close</button>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={tryApplyManual}
                  className="px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 pb-6">
              {parsed.eligible.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600">Eligible for you</p>
                  {parsed.eligible.map((e) => (
                    <Card key={e.c.code} data={e} />
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">More offers</p>
                {parsed.ineligible.length === 0 ? (
                  <p className="text-xs text-gray-500">No other offers.</p>
                ) : (
                  parsed.ineligible.map((e) => <Card key={e.c.code} data={e} />)
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
