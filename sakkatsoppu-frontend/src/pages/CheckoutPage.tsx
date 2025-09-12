import { useState, useEffect, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder, getCoupons } from '../services/api';
import { useLocation } from '../hooks/useLocation';
import { motion, AnimatePresence } from 'framer-motion';

export function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { getLocation, error: locationError, loading: locating } = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<null | {
    code: string;
    discountType: 'percentage' | 'amount';
    discountValue: number;
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    isActive?: boolean;
  }>(null);
  const [formData, setFormData] = useState({
    address: user?.address || '',
    latitude: user?.latitude || 0,
    longitude: user?.longitude || 0,
  });

  // If user address becomes available later (e.g., after fetch), seed it once
  useEffect(() => {
    setFormData(prev => {
      if (user?.address && !prev.address) {
        return { ...prev, address: user.address };
      }
      return prev;
    });
  }, [user?.address]);

  // Redirect to cart if no items
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGetLocation = async () => {
    try {
      const coords = await getLocation();
      setFormData(prev => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));
  setLocationConfirmed(true);
    } catch (err) {
      setError((err as Error).message || 'Failed to get location');
  setLocationConfirmed(false);
    }
  };

  // Fetch coupons for validation
  type Coupon = {
    code: string;
    discountType: 'percentage' | 'amount';
    discountValue: number;
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    isActive?: boolean;
  };

  const { data: coupons = [], isLoading: couponsLoading } = useQuery<Coupon[]>({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => {
      try {
        const res = await getCoupons({ page: 1, limit: 100 });
        console.log(res)
        const d: unknown = res.data;
        if (Array.isArray(d)) return d as Coupon[];
        if (d && typeof d === 'object' && Array.isArray((d as { data?: unknown[] }).data)) {
          return ((d as { data?: unknown[] }).data || []) as Coupon[];
        }
        return [] as Coupon[];
      } catch (err: unknown) {
        // If forbidden or unauthenticated, treat as no coupons available
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) return [] as Coupon[];
        throw err;
      }
    },
    staleTime: 5 * 60_000,
  });

  const validateCoupon = (code: string) => {
    const now = Date.now();
    const c = coupons.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
    
    if (!c) return { valid: false, reason: 'Coupon not found' } as const;
    if (c.isActive === false) return { valid: false, reason: 'Coupon is inactive' } as const;
    if (c.startsAt && new Date(c.startsAt).getTime() > now) return { valid: false, reason: 'Coupon not started yet' } as const;
    if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return { valid: false, reason: 'Coupon expired' } as const;
    if (c.minOrderValue && totalPrice < c.minOrderValue) return { valid: false, reason: `Minimum order ₹${c.minOrderValue}` } as const;
    return { valid: true, coupon: c } as const;
  };

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'amount') return Math.max(0, Math.min(appliedCoupon.discountValue, totalPrice));
    const pct = (appliedCoupon.discountValue / 100) * totalPrice;
    const capped = appliedCoupon.maxDiscount == null ? pct : Math.min(pct, appliedCoupon.maxDiscount);
    return Math.floor(capped);
  }, [appliedCoupon, totalPrice]);

  const finalAmount = Math.max(0, totalPrice - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Try to create remote order; unauthenticated will use local fallback
      let newOrderId: string | undefined;
  try {
        if (isAuthenticated) {
          const res = await createOrder({
            ...formData,
            paymentMode: 'COD',
            idempotencyKey: (globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random()}`),
            couponCode: appliedCoupon?.code || undefined,
          });
          const data = res.data || {};
          // Handle 201 structure with order object
          const order = data.order || data;
          newOrderId = order?._id || order?.id;
          // Ensure orders list reflects the new order before navigation
          await queryClient.invalidateQueries({ queryKey: ['orders'] });
          await queryClient.refetchQueries({ queryKey: ['orders'], type: 'active' });
          // Optionally show partial success info
          if (Array.isArray(data.itemsOutOfStock) && data.itemsOutOfStock.length > 0) {
            // Surface minimal info for now
            setError(`${data.itemsOutOfStock.length} item(s) were out of stock and not included.`);
          }
        } else {
          throw new Error('Unauthenticated - create local order');
        }
      } catch (err) {
        // create local order fallback (for unauthenticated or hard API failure)
        const localOrdersRaw = localStorage.getItem('sakkat_orders');
        const localOrders = localOrdersRaw ? JSON.parse(localOrdersRaw) : [];
        const id = `local_${Date.now()}`;
        const orderItems = items.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity,
          price: i.product.price,
        }));
        const order = {
          id,
          items: orderItems,
          totalPrice: totalPrice,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          createdAt: new Date().toISOString(),
          paymentMode: 'COD',
          status: 'pending',
        };
        localStorage.setItem('sakkat_orders', JSON.stringify([order, ...localOrders]));
        newOrderId = id;
      }

      clearCart();
      if (newOrderId) {
        navigate(`/orders/${newOrderId}`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            {items.map((item) => {
              const perG = typeof item.product.g === 'number' ? item.product.g : 0;
              const perPieces = typeof item.product.pieces === 'number' ? item.product.pieces : 0;
              const totalG = perG > 0 ? perG * item.quantity : 0;
              const totalWeight = totalG >= 1000 ? `${(totalG/1000).toFixed(1)} kg` : (totalG > 0 ? `${totalG} g` : null);
              const totalPieces = perPieces > 0 ? perPieces * item.quantity : 0;
              return (
                <div key={item.product._id} className="flex justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    {perG > 0 && (
                      <p className="text-xs text-gray-600">Each: {perG} g • Total: {totalWeight}</p>
                    )}
                    {perPieces > 0 && (
                      <p className="text-xs text-gray-600">Each: {perPieces} pcs • Total: {totalPieces} pcs</p>
                    )}
                  </div>
                  <p className="font-medium whitespace-nowrap">
                    ₹{item.product.price * item.quantity}
                  </p>
                </div>
              );
            })}
            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-700">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Fee</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="font-semibold">Payable</span>
                <span className="font-bold">₹{finalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label 
                htmlFor="address" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Delivery Address
              </label>
              <textarea
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locating}
              className={`w-full py-2 px-4 rounded-lg font-medium ${locating ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
            >
              {locating ? 'Getting location...' : 'Use My Current Location'}
            </button>

            {/* Coordinates hidden per requirement; still stored and sent to API */}
            {locationConfirmed && !locationError && (
              <p className="text-sm text-green-700">Location confirmed</p>
            )}
            {locationError && (
              <p className="text-sm text-red-600">{locationError}</p>
            )}

            {/* Coupon form */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setCouponOpen((v) => !v)}
                className="w-full text-left text-green-700 font-medium flex items-center justify-between"
              >
                Apply Coupon
                <span className={`transition-transform ${couponOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              <AnimatePresence initial={false}>
                {couponOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        type="button"
                        disabled={couponsLoading || !couponInput.trim()}
                        onClick={() => {
                          const res = validateCoupon(couponInput);
              if (!res.valid) {
                            setAppliedCoupon(null);
                            setCouponError(res.reason);
                          } else {
                            setAppliedCoupon({
                code: res.coupon.code,
                discountType: res.coupon.discountType,
                discountValue: res.coupon.discountValue,
                minOrderValue: res.coupon.minOrderValue ?? null,
                maxDiscount: res.coupon.maxDiscount ?? null,
                startsAt: res.coupon.startsAt ?? null,
                expiresAt: res.coupon.expiresAt ?? null,
                isActive: res.coupon.isActive,
                            });
                            setCouponOpen(false);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-white ${couponsLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {couponsLoading ? 'Checking…' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-sm text-red-600 mt-2">{couponError}</p>
                    )}
                    {appliedCoupon && (
                      <p className="text-sm text-green-700 mt-2">Applied {appliedCoupon.code}. You save ₹{discountAmount}.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div className="flex items-center space-x-2 text-gray-700">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  Cash on Delivery / UPI on Delivery
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? 'Placing Order...' : `Place Order${appliedCoupon ? ` • ₹${finalAmount}` : ''}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
