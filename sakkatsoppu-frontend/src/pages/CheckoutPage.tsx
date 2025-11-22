import { formatWeightFromGrams } from '../utils/format';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../hooks/useToast';
import { useStockSubscription } from '../hooks/useStockSubscription';
import { useCartAutoReconcile } from '../hooks/useCartAutoReconcile';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder, getCoupons, getPublicDeliverySettings, getProduct, updateProfile } from '../services/api';
// Drawer animations handled inside CouponDrawer
import CouponDrawer from '../components/CouponDrawer';
import MapAddressModal from '../components/MapAddressModal';

export function CheckoutPage() {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  // Subscribe to cart items to receive live stock updates and auto-reconcile
  useStockSubscription(items.map(i => i.product._id));
  const [reconcileEnabled, setReconcileEnabled] = useState(true);
  const { Banner } = useCartAutoReconcile({ enabled: reconcileEnabled, mutate: false });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [partialOOS, setPartialOOS] = useState<Array<{ productId: string; requested?: number; available?: number; name?: string }>>([]);
  const { show } = useToast();

  // Prevent body scroll on mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, []);
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
    address: user?.address || {
      houseNo: '',
      landmark: '',
      area: '',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '',
    },
    latitude: user?.latitude || 0,
    longitude: user?.longitude || 0,
    phone: user?.phone || '',
  });
  const defaultCenter = useMemo(() => {
    // Prefer user coords if available; else none and let modal autoGeo use device location
    if (user?.latitude && user?.longitude) return { lat: user.latitude, lon: user.longitude };
    if (formData.latitude && formData.longitude) return { lat: formData.latitude, lon: formData.longitude };
    return null;
  }, [user?.latitude, user?.longitude, formData.latitude, formData.longitude]);

  // Delivery settings with city-specific pricing
  type DeliverySettings = {
    enabled: boolean;
    minOrderSubtotal: number;
    cities: Array<{
      name: string;
      basePrice: number;
      pricePerKg: number;
      freeDeliveryThreshold: number;
    }>;
    updatedAt?: string;
  };
  const { data: deliverySettings } = useQuery<DeliverySettings, Error>(
    ['public', 'delivery-settings'],
    async () => {
      try {
        const res = await getPublicDeliverySettings();
        const d = res.data as Record<string, unknown>;
        if (!d) throw new Error('No data');

        // Backend schema: { enabled, minOrderSubtotal, cities: [{name, basePrice, pricePerKg, freeDeliveryThreshold}] }
        const citiesArray = (d.cities || []) as DeliverySettings['cities'];

        const settings: DeliverySettings = {
          enabled: (d.enabled as boolean) ?? true,
          minOrderSubtotal: (d.minOrderSubtotal as number) ?? 0,
          cities: citiesArray,
          updatedAt: d.updatedAt as string | undefined,
        };

        return settings;
      } catch (err) {
        console.error('Error fetching delivery settings:', err);
        // fallback and continue silently
        const fallback: DeliverySettings = {
          enabled: true,
          minOrderSubtotal: 0,
          cities: [
            { name: 'Mysuru', basePrice: 50, pricePerKg: 15, freeDeliveryThreshold: 600 },
            { name: 'Bengaluru', basePrice: 40, pricePerKg: 10, freeDeliveryThreshold: 500 }
          ],
        };
        return fallback;
      }
    },
    {
      staleTime: 5 * 60_000, // Cache for 5 minutes (production-friendly)
      cacheTime: 10 * 60_000, // Keep in cache for 10 minutes
      refetchOnMount: 'always', // Always fetch fresh data when component mounts
    }
  );


  // Always sync formData with latest user address/phone/coords when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        address: user.address || {
          houseNo: '',
          landmark: '',
          area: '',
          city: 'Mysuru',
          state: 'Karnataka',
          pincode: '',
        },
        latitude: prev.latitude && prev.latitude !== 0 ? prev.latitude : (user.latitude || 0),
        longitude: prev.longitude && prev.longitude !== 0 ? prev.longitude : (user.longitude || 0),
        phone: user.phone || '',
      }));
    }
  }, [user, user?.address, user?.address?.city]);

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

  // Removed device geolocation button per requirement; address can be set via map

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

  // Calculate total weight from cart items (in kg)
  const totalWeight = useMemo(() => {
    return items.reduce((total, item) => {
      const weightInGrams = item.product.g || 0;
      const weightInKg = weightInGrams / 1000;
      return total + (weightInKg * item.quantity);
    }, 0);
  }, [items]);

  // Calculate delivery fee based on city, weight, and order subtotal
  const computedDeliveryFee = useMemo(() => {
    const settings = deliverySettings as DeliverySettings | undefined;
    // Return 0 if no delivery settings available
    if (!settings || !settings.cities || settings.cities.length === 0) {
      return 0;
    }

    // Get city from user's address (case-insensitive match)
    const userCity = (formData.address.city || '').toLowerCase().trim();
    if (!userCity) {
      return 0;
    }

    // Find matching city settings
    const citySettings = settings.cities.find(c => c.name.toLowerCase() === userCity);
    if (!citySettings) {
      return 0;
    }

    // Check if order qualifies for free delivery
    if (citySettings.freeDeliveryThreshold > 0 && netSubtotal >= citySettings.freeDeliveryThreshold) {
      return 0; // Free delivery
    }

    // Calculate weight-based delivery fee
    // Base price covers first 1kg, then pricePerKg for each additional kg (rounded up)
    const basePrice = citySettings.basePrice;

    if (totalWeight <= 1) {
      return basePrice;
    }

    const additionalWeight = totalWeight - 1;
    const additionalKg = Math.ceil(additionalWeight); // Round up to nearest kg
    const additionalCost = additionalKg * citySettings.pricePerKg;

    return basePrice + additionalCost;
  }, [deliverySettings, formData, netSubtotal, totalWeight]);

  const finalAmount = Math.max(0, netSubtotal + computedDeliveryFee);
  // Minimum order is checked on subtotal BEFORE coupon and EXCLUDING delivery fee
  const belowMinBy = (() => {
    const s = deliverySettings as DeliverySettings | undefined;
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
          console.debug('Failed to set reconcile pause flag', e);
        }
      }

      // Client-side guards to avoid avoidable 400s
      const phoneDigits = String(formData.phone || '').replace(/\D/g, '');
      if (!phoneDigits || phoneDigits.length < 10) {
        setError('Please enter a valid phone number.');
        show('Please enter a valid phone number.', { type: 'warning' });
        return;
      }
      if (!formData.address || [formData.address.houseNo, formData.address.area, formData.address.landmark, formData.address.city, formData.address.state, formData.address.pincode].every(field => !field || field.trim().length === 0)) {
        setError('Please enter your delivery address.');
        show('Please enter your delivery address.', { type: 'warning' });
        return;
      }
      if ((deliverySettings as DeliverySettings | undefined)?.enabled && belowMinBy > 0) {
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
          phone: phoneDigits,
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
          phone: phoneDigits,
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
      console.debug('Failed to clear reconcile pause flag', e);
    }
  }
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="md:min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-orange-50">
      {/* Desktop layout */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-all"
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">Cart</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-green-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Delivery Details - Desktop only */}
          <div className="lg:col-span-2 order-1">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Delivery Details</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl mb-6">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md border border-green-100 p-6 md:p-8 space-y-6">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter 10-digit mobile number"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">10-digit mobile number</p>
              </div>
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
                  value={[formData.address.houseNo, formData.address.area, formData.address.landmark, formData.address.city, formData.address.state, formData.address.pincode].filter(Boolean).join(', ')}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  readOnly
                />
              </div>

              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="w-full py-3 px-4 rounded-xl font-medium bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-all"
              >
                📍 Edit address
              </button>

              {locationConfirmed && (
                <p className="text-sm text-green-700 bg-green-50 p-2 rounded-lg">✓ Location confirmed</p>
              )}

              {/* Coupon section */}
              <div className="border-t border-green-100 pt-6">
                {Banner}
                <button
                  type="button"
                  onClick={() => setCouponOpen(true)}
                  className="w-full text-left text-green-700 font-medium flex items-center justify-between bg-green-50 p-3 rounded-xl hover:bg-green-100 transition-all"
                >
                  <span className="flex items-center gap-2">
                    🎟️ Apply Coupon
                  </span>
                  {!couponOpen && <span className="transition-transform">⌄</span>}
                </button>
                {appliedCoupon && (
                  <p className="text-sm text-green-700 mt-2 bg-green-50 p-2 rounded-lg">✓ Applied {appliedCoupon.code}. You save ₹{discountAmount}.</p>
                )}
                {partialOOS.length > 0 && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 space-y-1">
                    <p className="text-sm font-medium">⚠️ Removed due to stock:</p>
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

              <div className="border-t border-green-100 pt-6">
                <h3 className="text-lg font-semibold mb-4 text-green-900">Payment Method</h3>
                <div className="flex items-center space-x-2 text-gray-700">
                  <span className="bg-green-50 text-green-800 px-4 py-3 rounded-xl text-sm font-medium border border-green-200">
                    💵 Cash on Delivery / UPI on Delivery
                  </span>
                </div>
              </div>

              {belowMinBy > 0 && (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">Add ₹{belowMinBy} more to reach minimum order value.</p>
              )}

              {!formData.address.city && (
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">Please select a delivery city to continue.</p>
              )}

              {/* Desktop submit button - hidden on mobile */}
              <button
                type="submit"
                disabled={loading || belowMinBy > 0 || !formData.address.city}
                className={`hidden md:block w-full py-4 rounded-xl font-semibold transition-all ${
                  loading || belowMinBy > 0 || !formData.address.city
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? 'Placing Order...' : `Place Order${appliedCoupon ? ` • ₹${finalAmount}` : ''}`}
              </button>
            </form>
            <MapAddressModal
              isOpen={mapOpen}
              onClose={() => setMapOpen(false)}
              defaultCenter={defaultCenter}
              autoGeo={true}
              showSaveCheckbox={true}
              initialAddress={formData.address}
              showMap={false}
              onConfirm={async (data) => {
                setFormData(prev => ({ ...prev, address: data.address, latitude: data.latitude, longitude: data.longitude }));
                setLocationConfirmed(true);

                if (data.saveToProfile) {
                  try {
                    await updateProfile({ address: data.address, latitude: data.latitude, longitude: data.longitude });
                    await refreshProfile();
                    show('Address saved to your profile', { type: 'success' });
                  } catch (err) {
                    console.error('Failed to save address to profile:', err);
                    show('Address updated for this order, but failed to save to profile', { type: 'warning' });
                  }
                }
              }}
            />
          </div>

          {/* Order Summary - Desktop only */}
          <div className="order-2">
            <div className="lg:sticky lg:top-6">
              <h2 className="text-xl font-semibold mb-4 text-green-800">Order Summary</h2>
              <div className="bg-white rounded-2xl shadow-md border border-green-100 p-6 md:p-8 space-y-4">
                {items.map((item) => {
                  const perG = typeof item.product.g === 'number' ? item.product.g : 0;
                  const perPieces = typeof item.product.pieces === 'number' ? item.product.pieces : 0;
                  const totalG = perG > 0 ? perG * item.quantity : 0;
                  const totalWeight = totalG > 0 ? (formatWeightFromGrams(totalG) || `${totalG} g`) : null;
                  const totalPieces = perPieces > 0 ? perPieces * item.quantity : 0;
                  return (
                    <div key={item.product._id} className="flex justify-between items-start py-3 border-b border-green-50 last:border-0">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-green-900 truncate">{item.product.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        {perG > 0 && (
                          <p className="text-xs text-gray-500">Each: {formatWeightFromGrams(perG) || `${perG} g`} • Total: {totalWeight}</p>
                        )}
                        {perPieces > 0 && (
                          <p className="text-xs text-gray-500">Each: {perPieces} pcs • Total: {totalPieces} pcs</p>
                        )}
                      </div>
                      <p className="font-semibold text-green-900 whitespace-nowrap">
                        ₹{item.product.price * item.quantity}
                      </p>
                    </div>
                  );
                })}
                <div className="border-t border-green-200 pt-4 mt-4 space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-medium">₹{totalPrice}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-700 bg-green-50 -mx-2 px-2 py-2 rounded-lg">
                      <span className="font-medium">🎉 Coupon ({appliedCoupon.code})</span>
                      <span className="font-semibold">-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery Fee</span>
                    <span className="font-medium">
                      {computedDeliveryFee === 0 ? '🎁 Free' : `₹${computedDeliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg pt-3 border-t border-green-200">
                    <span className="font-bold text-green-900">Total Payable</span>
                    <span className="font-bold text-green-900">₹{finalAmount}</span>
                  </div>
                  {deliverySettings && (deliverySettings as unknown as DeliverySettings).enabled && (deliverySettings as unknown as DeliverySettings).cities && (() => {
                    const settings = deliverySettings as unknown as DeliverySettings;
                    const userCity = (formData.address.city || '').toLowerCase();
                    const citySettings = settings.cities.find((c) => c.name.toLowerCase() === userCity);
                    if (!citySettings) return null;

                    return (
                      <div className="text-xs text-gray-600 bg-amber-50 p-2 rounded-lg">
                        {citySettings.freeDeliveryThreshold > 0 && netSubtotal < citySettings.freeDeliveryThreshold ? (
                          <p> Free delivery over ₹{citySettings.freeDeliveryThreshold}</p>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Full Checkout - Sticky non-scrollable */}
      <div className="md:hidden fixed top-16 bottom-16 left-0 right-0 bg-white z-40 flex flex-col">
          {/* Header with back button */}
          <div className="flex-shrink-0 bg-gradient-to-r from-green-50 to-amber-50 border-b-2 border-green-200 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/cart')}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white border border-green-200 text-green-700 hover:bg-green-50 transition-all"
              >
                <span className="text-base">←</span>
                <span className="text-xs font-medium">Cart</span>
              </button>
              <h1 className="text-lg font-bold text-green-900">Checkout</h1>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Delivery Details */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 space-y-3">
              <h3 className="text-base font-bold text-blue-900 mb-2">📍 Delivery Details</h3>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full px-3 py-2.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Delivery Address</label>
                  <div className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-blue-200 min-h-[3rem] leading-relaxed">
                    {[formData.address.houseNo, formData.address.area, formData.address.landmark, formData.address.city, formData.address.state, formData.address.pincode].filter(Boolean).join(', ') || 'No address set'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="w-full py-2.5 px-3 text-sm rounded-lg font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200 transition-all"
                >
                  📍 Edit Address
                </button>

                {locationConfirmed && (
                  <p className="text-xs text-green-700 bg-green-50 p-2 rounded-lg">✓ Location confirmed</p>
                )}

                {/* Coupon Button */}
                <button
                  type="button"
                  onClick={() => setCouponOpen(true)}
                  className="w-full text-left text-green-700 text-sm font-medium flex items-center justify-between bg-green-50 p-3 rounded-lg hover:bg-green-100 border border-green-200 transition-all"
                >
                  <span className="flex items-center gap-2">
                    🎟️ Apply Coupon
                  </span>
                  {!couponOpen && <span className="text-sm">⌄</span>}
                </button>

                {appliedCoupon && (
                  <p className="text-xs text-green-700 bg-green-50 p-2 rounded-lg">✓ Applied {appliedCoupon.code}. Save ₹{discountAmount}</p>
                )}

                {partialOOS.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs">
                    <p className="font-medium">⚠️ Stock issues:</p>
                    <p className="mt-1">{partialOOS.length} item(s) affected</p>
                  </div>
                )}

                {belowMinBy > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    Add ₹{belowMinBy} more for minimum order
                  </p>
                )}

                <div className="text-xs bg-green-50 border border-green-200 p-3 rounded-lg">
                  <span className="font-medium text-green-900">💵 Payment:</span>
                  <span className="text-green-700 ml-1">COD / UPI on Delivery</span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-br from-green-50 to-amber-50 rounded-2xl p-4 space-y-3">
              <h3 className="text-base font-bold text-green-900 mb-2">🛒 Order Summary</h3>

              {/* Items List */}
              <div className="space-y-2.5 max-h-36 overflow-y-auto">
                {items.map((item) => {
                  const perG = typeof item.product.g === 'number' ? item.product.g : 0;
                  const perPieces = typeof item.product.pieces === 'number' ? item.product.pieces : 0;
                  const totalG = perG > 0 ? perG * item.quantity : 0;
                  const totalWeight = totalG > 0 ? (formatWeightFromGrams(totalG) || `${totalG} g`) : null;
                  const totalPieces = perPieces > 0 ? perPieces * item.quantity : 0;
                  return (
                    <div key={item.product._id} className="flex justify-between items-start text-sm border-b border-green-100 pb-2 last:border-0">
                      <div className="min-w-0 pr-2 flex-1">
                        <p className="font-semibold text-green-900 truncate text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        {perG > 0 && (
                          <p className="text-xs text-gray-500">{formatWeightFromGrams(perG) || `${perG} g`} • {totalWeight}</p>
                        )}
                        {perPieces > 0 && (
                          <p className="text-xs text-gray-500">{perPieces} pcs • {totalPieces} pcs</p>
                        )}
                      </div>
                      <p className="font-semibold text-green-900 whitespace-nowrap text-sm">
                        ₹{item.product.price * item.quantity}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-green-200 pt-2.5 space-y-2">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{totalPrice}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-700 bg-green-100 -mx-1 px-2 py-1.5 rounded">
                    <span className="font-medium">🎉 {appliedCoupon.code}</span>
                    <span className="font-semibold">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Delivery</span>
                  <span className="font-medium">
                    {computedDeliveryFee === 0 ? '🎁 Free' : `₹${computedDeliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-green-300">
                  <span className="text-base font-bold text-green-900">Total</span>
                  <span className="text-xl font-bold text-green-900">₹{finalAmount}</span>
                </div>
                {deliverySettings && (deliverySettings as unknown as DeliverySettings).enabled && (deliverySettings as unknown as DeliverySettings).cities && (() => {
                  const settings = deliverySettings as unknown as DeliverySettings;
                  const userCity = (formData.address.city || '').toLowerCase();
                  const citySettings = settings.cities.find((c) => c.name.toLowerCase() === userCity);
                  if (!citySettings) return null;
                  if (citySettings.freeDeliveryThreshold > 0 && netSubtotal < citySettings.freeDeliveryThreshold) {
                    return (
                      <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded">
                         Free delivery over ₹{citySettings.freeDeliveryThreshold}
                      </p>
                    );
                  }
                  return null;
                })()}
                {!formData.address.city && (
                  <p className="text-xs text-red-700 bg-red-50 px-2 py-1.5 rounded mt-2">
                    Please select a delivery city
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Place Order Button at bottom */}
          <div className="flex-shrink-0 border-t-2 border-green-200 bg-gradient-to-t from-white to-green-50 px-4 py-3 shadow-2xl">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || belowMinBy > 0 || !formData.address.city}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                loading || belowMinBy > 0 || !formData.address.city
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg active:scale-95'
              }`}
            >
              {loading ? '⏳ Placing Order...' : '🛒 Place Order'}
            </button>
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
