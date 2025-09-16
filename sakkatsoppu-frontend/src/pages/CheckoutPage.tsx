import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../hooks/useToast';
import { useStockSubscription } from '../hooks/useStockSubscription';
import { useCartAutoReconcile } from '../hooks/useCartAutoReconcile';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder, getCoupons, getPublicDeliverySettings, getProduct } from '../services/api';
import { useLocation } from '../hooks/useLocation';
// Drawer animations handled inside CouponDrawer
import CouponDrawer from '../components/CouponDrawer';

export function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  // Subscribe to cart items to receive live stock updates and auto-reconcile
  useStockSubscription(items.map(i => i.product._id));
  const [reconcileEnabled, setReconcileEnabled] = useState(true);
  const { Banner } = useCartAutoReconcile({ enabled: reconcileEnabled, mutate: false });
  const navigate = useNavigate();
  const { getLocation, error: locationError, loading: locating } = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [partialOOS, setPartialOOS] = useState<Array<{ productId: string; requested?: number; available?: number; name?: string }>>([]);
  const { show } = useToast();
  // manual input moved into drawer component
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

  // Delivery settings
  type DeliverySettings = {
    enabled: boolean;
    deliveryFee: number;
    freeDeliveryThreshold: number;
    minOrderSubtotal: number;
    updatedAt?: string;
  };
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
          updatedAt: d.updatedAt,
        };
      } catch {
        // fallback and continue silently
        return { enabled: true, deliveryFee: 0, freeDeliveryThreshold: 0, minOrderSubtotal: 0 } as DeliverySettings;
      }
    },
    staleTime: 10 * 60_000,
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
  type RawCoupon = Partial<Coupon> & { couponCode?: string; description?: string | null };

  const { data: coupons = [] } = useQuery<Coupon[]>({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => {
      try {
        const res = await getCoupons({ page: 1, limit: 100 });
        console.log(res)
        const d: unknown = res.data;
        let list: RawCoupon[] = [];
        if (Array.isArray(d)) list = d as RawCoupon[];
        else if (d && typeof d === 'object' && Array.isArray((d as { data?: unknown[] }).data)) list = ((d as { data?: unknown[] }).data || []) as RawCoupon[];
        // Normalize: ensure `code` exists (fallback to couponCode)
        const norm: Coupon[] = list
          .map((c): Coupon | null => {
            const code = ((c.code ?? c.couponCode ?? '') as string).toString().toUpperCase();
            if (!code) return null;
            const discountType = (c.discountType === 'percentage' || c.discountType === 'amount') ? c.discountType : 'amount';
            const discountValue = typeof c.discountValue === 'number' ? c.discountValue : 0;
            return {
              code,
              discountType,
              discountValue,
              minOrderValue: (c.minOrderValue ?? null) as number | null,
              maxDiscount: (c.maxDiscount ?? null) as number | null,
              startsAt: (c.startsAt ?? null) as string | null,
              expiresAt: (c.expiresAt ?? null) as string | null,
              isActive: c.isActive,
            };
          })
          .filter((c): c is Coupon => !!c);
        return norm;
      } catch (err: unknown) {
        // If forbidden or unauthenticated, treat as no coupons available
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) return [] as Coupon[];
        throw err;
      }
    },
    staleTime: 5 * 60_000,
  });

  // validateCoupon now handled implicitly inside drawer by eligibility checks

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'amount') return Math.max(0, Math.min(appliedCoupon.discountValue, totalPrice));
    const pct = (appliedCoupon.discountValue / 100) * totalPrice;
    const capped = appliedCoupon.maxDiscount == null ? pct : Math.min(pct, appliedCoupon.maxDiscount);
    return Math.floor(capped);
  }, [appliedCoupon, totalPrice]);

  const netSubtotal = Math.max(0, totalPrice - discountAmount);
  const computedDeliveryFee = (() => {
    const s = deliverySettings;
    if (!s) return 0;
    if (!s.enabled) return 0;
    if (s.freeDeliveryThreshold > 0 && netSubtotal >= s.freeDeliveryThreshold) return 0;
    return s.deliveryFee || 0;
  })();
  const finalAmount = Math.max(0, netSubtotal + computedDeliveryFee);
  // Minimum order is checked on subtotal BEFORE coupon and EXCLUDING delivery fee
  const belowMinBy = (() => {
    const s = deliverySettings;
    if (!s) return 0;
    const min = s.minOrderSubtotal || 0;
    return Math.max(0, min - totalPrice);
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      // Temporarily disable auto-reconcile to avoid cart changes mid-submit
      setReconcileEnabled(false);
      // Also pause the global reconciler
      try {
        (globalThis as unknown as { __RECONCILE_PAUSED?: boolean }).__RECONCILE_PAUSED = true;
      } catch (e) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.debug('Failed to set reconcile pause flag', e);
        }
      }

      // Client-side guards to avoid avoidable 400s
      if (!formData.address || formData.address.trim().length === 0) {
        setError('Please enter your delivery address.');
        show('Please enter your delivery address.', { type: 'warning' });
        return;
      }
      if (deliverySettings?.enabled && belowMinBy > 0) {
        setError(`Add ₹${belowMinBy} more to reach minimum order value.`);
        show(`Add ₹${belowMinBy} more to reach minimum order value.`, { type: 'warning' });
        return;
      }

      // Try to create remote order; unauthenticated will use local fallback
      // Dev note: submitting order with couponCode (debug log removed to satisfy lint)
      let newOrderId: string | undefined;
      if (!isAuthenticated) {
        setError('Please log in to place an order.');
        navigate('/login');
        return;
      }

      // Preflight: re-validate stock and auto-adjust cart if needed
      try {
        const adjustments: Array<{ productId: string; requested: number; available: number; name?: string }> = [];
        await Promise.all(
          items.map(async (ci) => {
            try {
              const res = await getProduct(ci.product._id);
              const fresh = res.data as { stock?: number; name?: string };
              const available = Math.max(0, Number(fresh?.stock ?? ci.product.stock ?? 0));
              const requested = ci.quantity;
              if (available <= 0 && requested > 0) {
                adjustments.push({ productId: ci.product._id, requested, available, name: fresh?.name || ci.product.name });
              } else if (requested > available) {
                adjustments.push({ productId: ci.product._id, requested, available, name: fresh?.name || ci.product.name });
              }
            } catch {
              // If product fetch fails, skip adjustment and let server validate.
            }
          })
        );

        if (adjustments.length > 0) {
          setPartialOOS(adjustments);
          const allRemoved = adjustments.every((a) => a.available <= 0) && adjustments.length === items.length;
          if (allRemoved) {
            setError('All items appear out of stock. Please review your cart.');
            show('All items appear out of stock. Please review your cart.', { type: 'error' });
            return; // Stop here; avoid submitting an empty order
          }
          show(`${adjustments.length} item(s) may be reduced due to stock.`, { type: 'warning' });
        }
      } catch {
        // Ignore preflight failures and proceed; server is source of truth
      }

      try {
        const res = await createOrder({
          ...formData,
          paymentMode: 'COD',
          idempotencyKey: (globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random()}`),
          couponCode: appliedCoupon?.code?.trim() ? appliedCoupon.code.trim() : undefined,
          items: items.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
        });
        const data = res.data || {};
        // Success: 201 Created or 200 OK (idempotent replay)
        const order = data.order || data;
        newOrderId = order?._id || order?.id;
        // Update orders cache
        await queryClient.invalidateQueries({ queryKey: ['orders'] });
        await queryClient.refetchQueries({ queryKey: ['orders'], type: 'active' });
        // Partial fulfillment info
        if (Array.isArray(data.itemsOutOfStock) && data.itemsOutOfStock.length > 0) {
          setPartialOOS(data.itemsOutOfStock as typeof partialOOS);
          show(`${data.itemsOutOfStock.length} item(s) removed due to stock.`, { type: 'warning' });
        } else {
          show('Order placed successfully', { type: 'success' });
        }
      } catch (err) {
        type ApiErrorData = {
          message?: string;
          error?: string;
          reason?: string;
          minOrderSubtotal?: number;
          subtotal?: number;
          shortfall?: number;
          itemsOutOfStock?: unknown[];
        };
        const axiosErr = err as { response?: { status?: number; data?: ApiErrorData } };
        const status = axiosErr?.response?.status;
        const data = axiosErr?.response?.data;
        if (import.meta.env.DEV && data) {
          // Surface server error payload to dev console for quick diagnosis
          // eslint-disable-next-line no-console
          console.debug('Order creation error payload:', data);
        }
        if (typeof status === 'number') {
          // Handle known responses explicitly
          if (status === 400) {
            // Cart empty or min order not met
            const reason = data?.reason as string | undefined;
            if (reason === 'MIN_ORDER_NOT_MET') {
              const shortfall = Number(data?.shortfall ?? 0);
              setError(`Add ₹${shortfall} more to reach minimum order value.`);
              show(`Add ₹${shortfall} more to reach minimum order value.`, { type: 'warning' });
            } else {
              const msg = data?.message || 'Cart seems empty or invalid request.';
              setError(msg);
              show(msg, { type: 'error' });
            }
            return; // stop flow, don't clear cart
          }
          if (status === 401) {
            setError('Your session expired. Please log in again.');
            show('Your session expired. Please log in again.', { type: 'error' });
            navigate('/login');
            return;
          }
          if (status === 404) {
            setError(data?.message || 'User not found. Please log in again.');
            show('User not found. Please log in again.', { type: 'error' });
            navigate('/login');
            return;
          }
          if (status === 409) {
            // All items out of stock
            setError(data?.message || 'All items are out of stock.');
            show('All items are out of stock.', { type: 'error' });
            return; // stop flow, don't clear cart
          }
          // 5xx or other 4xx
          setError(data?.message || 'Error creating order. Please try again.');
          show(data?.message || 'Error creating order. Please try again.', { type: 'error' });
          return;
        }

        // Network error (no status): create local order as a graceful fallback
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

      // If we don't have an order id, it means we hit a handled error and stayed on the page
      if (!newOrderId) return;

  clearCart();
      navigate(`/orders/${newOrderId}`);
    } catch (err) {
  // Unexpected error that slipped through
  setError('Failed to place order. Please try again.');
  show('Failed to place order. Please try again.', { type: 'error' });
    } finally {
  setLoading(false);
  // Re-enable auto-reconcile after submit cycle completes
  setReconcileEnabled(true);
  try {
    (globalThis as unknown as { __RECONCILE_PAUSED?: boolean }).__RECONCILE_PAUSED = false;
  } catch (e) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('Failed to clear reconcile pause flag', e);
    }
  }
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
                <span>{computedDeliveryFee === 0 ? 'Free' : `₹${computedDeliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="font-semibold">Payable</span>
                <span className="font-bold">₹{finalAmount}</span>
              </div>
              {deliverySettings && deliverySettings.enabled && (
                <div className="text-xs text-gray-600">
                  {deliverySettings.freeDeliveryThreshold > 0 && netSubtotal < deliverySettings.freeDeliveryThreshold ? (
                    <p>Free delivery over ₹{deliverySettings.freeDeliveryThreshold}</p>
                  ) : null}
                </div>
              )}
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
              {Banner}
              <button
                type="button"
                onClick={() => setCouponOpen(true)}
                className="w-full text-left text-green-700 font-medium flex items-center justify-between"
              >
                Apply Coupon
                <span className={`transition-transform ${couponOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              {appliedCoupon && (
                <p className="text-sm text-green-700 mt-2">Applied {appliedCoupon.code}. You save ₹{discountAmount}.</p>
              )}
              {partialOOS.length > 0 && (
                <div className="mt-3 bg-amber-50 text-amber-800 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium">Removed due to stock:</p>
                  <ul className="list-disc list-inside text-sm">
                    {partialOOS.slice(0, 3).map((it, idx) => (
                      <li key={`${it.productId}-${idx}`}>{it.name || it.productId} ({it.available ?? 0}/{it.requested ?? 0})</li>
                    ))}
                    {partialOOS.length > 3 && (
                      <li>+{partialOOS.length - 3} more…</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div className="flex items-center space-x-2 text-gray-700">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  Cash on Delivery / UPI on Delivery
                </span>
              </div>
            </div>

            {belowMinBy > 0 && (
              <p className="text-sm text-amber-700">Add ₹{belowMinBy} more to reach minimum order value.</p>
            )}

            <button
              type="submit"
              disabled={loading || belowMinBy > 0}
              className={`w-full py-3 rounded-lg font-semibold ${
                loading || belowMinBy > 0
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? 'Placing Order...' : `Place Order${appliedCoupon ? ` • ₹${finalAmount}` : ''}`}
            </button>
          </form>
        </div>
      </div>
      <CouponDrawer
        isOpen={couponOpen}
        onClose={() => setCouponOpen(false)}
        coupons={coupons}
        totalAmount={totalPrice}
        appliedCode={appliedCoupon?.code || null}
        onApply={(c) => {
          setAppliedCoupon({
            code: c.code,
            discountType: c.discountType,
            discountValue: c.discountValue,
            minOrderValue: c.minOrderValue ?? null,
            maxDiscount: c.maxDiscount ?? null,
            startsAt: c.startsAt ?? null,
            expiresAt: c.expiresAt ?? null,
            isActive: c.isActive,
          });
        }}
      />
    </div>
  );
}
