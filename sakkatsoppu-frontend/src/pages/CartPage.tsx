import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useQuery } from '@tanstack/react-query';
import { getPublicDeliverySettings } from '../services/api';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/EmptyState';
import { useStockSubscription } from '../hooks/useStockSubscription';
import { useStockContext } from '../context/StockContext';
import { useCartAutoReconcile } from '../hooks/useCartAutoReconcile';
import { deriveUnitLabel } from '../utils/format';
import { ArrowLeftIcon, TrashIcon, ArrowLongLeftIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useState } from 'react';

export function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem, loading } = useCart();
  const navigate = useNavigate();
  const { show } = useToast();
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null);

  // Public delivery settings
  type DeliverySettings = {
    enabled: boolean;
    deliveryFee: number;
    freeDeliveryThreshold: number;
    minOrderSubtotal: number;
  };
  const { data: deliverySettings, isLoading: settingsLoading } = useQuery<DeliverySettings>({
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

  // Subscribe to all items in cart
  useStockSubscription(items.map(i => i.product._id));
  const { Banner } = useCartAutoReconcile({ enabled: true, mutate: false });
  const { stocks } = useStockContext();

  // Minimum order gating for Checkout: BEFORE coupon (no coupon here) and EXCLUDING delivery fee
  const belowMinBy = (() => {
    const s = deliverySettings;
    if (!s || !s.enabled) return 0;
    const min = s.minOrderSubtotal ?? 0;
    return Math.max(0, min - totalPrice);
  })();
  const disableCheckout = !settingsLoading && !!deliverySettings && deliverySettings.enabled && belowMinBy > 0;

  // Guests can view local cart; encourage login during checkout

  if (loading) {
    return <div className="text-center py-8">Loading cart...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back to home"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Cart</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <EmptyState
            title="Your Cart is Empty"
            description="Browse our products and add some items to your cart."
            actionLabel="Continue Shopping"
            actionTo="/"
            icon={<span>🧺</span>}
          />
        </div>
      </div>
    );
  }

  const handleSwipe = (productId: string, info: PanInfo) => {
    if (info.offset.x < -100) {
      // Swiped left sufficiently
      removeItem(productId);
      setSwipingItemId(null);
    } else {
      setSwipingItemId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-8">
      {/* Header with back button */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back to home"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Cart</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Swipe to Delete Hint - Mobile Only */}
        {items.length > 0 && (
          <div className="md:hidden mb-4 flex items-center justify-center gap-2 text-gray-500 text-sm">
            <ArrowLongLeftIcon className="h-5 w-5" />
            <span>Swipe left to delete</span>
          </div>
        )}

        {/* Cart Items */}
        <div className="space-y-3 mb-4">
          <AnimatePresence>
            {items.map((item, index) => {
              const unitLabel = deriveUnitLabel({
                unitLabel: item.product.unitLabel,
                g: item.product.g,
                pieces: item.product.pieces
              });

              return (
                <motion.div
                  key={item.product._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ delay: index * 0.05 }}
                  drag="x"
                  dragConstraints={{ left: -200, right: 0 }}
                  dragElastic={0.2}
                  onDragStart={() => setSwipingItemId(item.product._id)}
                  onDragEnd={(_e, info) => handleSwipe(item.product._id, info)}
                  className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Delete background (shown when swiping) */}
                  {swipingItemId === item.product._id && (
                    <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6">
                      <TrashIcon className="h-6 w-6 text-white" />
                    </div>
                  )}

                  {/* Cart Item Content */}
                  <div className="relative bg-white flex items-center gap-3 p-3">
                    {/* Product Image */}
                    <Link
                      to={`/products/${item.product._id}`}
                      className="flex-shrink-0"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={item.product.imageUrl || item.product.images?.[0] || ''}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product._id}`}
                        className="block"
                      >
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500">{item.product.category}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{unitLabel}</p>

                      {/* Price */}
                      <p className="text-base font-bold text-gray-900 mt-1">
                        ₹{item.product.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls & Delete */}
                    <div className="flex flex-col items-end gap-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.product._id, Math.max(0, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity.toString().padStart(2, '0')}</span>
                        <button
                          onClick={() => {
                            const live = stocks.get(item.product._id);
                            const stock = typeof live === 'number' ? live : (item.product.stock || 0);
                            if (stock <= 0) {
                              show('This item is currently out of stock', { type: 'warning' });
                              return;
                            }
                            if (item.quantity >= stock) {
                              show('Cannot exceed available stock', { type: 'warning' });
                              updateQuantity(item.product._id, stock);
                            } else {
                              updateQuantity(item.product._id, item.quantity + 1);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Delete Button (desktop) */}
                      <button
                        onClick={() => removeItem(item.product._id)}
                        className="hidden md:flex p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label="Remove item"
                      >
                        <TrashIcon className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      {/* Sticky Order Summary - Mobile & Desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {Banner}

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-3">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Sub Total</span>
                <span className="font-semibold">₹{totalPrice.toFixed(2)}</span>
              </div>

              {settingsLoading ? (
                <div className="flex justify-between text-gray-700">
                  <span>Delivery fee</span>
                  <span className="inline-block h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              ) : deliverySettings && deliverySettings.enabled ? (
                <div className="flex justify-between text-gray-700">
                  <span>Delivery fee</span>
                  <span className="font-semibold">
                    {deliverySettings.freeDeliveryThreshold > 0 && totalPrice >= deliverySettings.freeDeliveryThreshold
                      ? 'Free'
                      : (deliverySettings.deliveryFee > 0 ? `₹${deliverySettings.deliveryFee.toFixed(2)}` : 'Free')}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total</span>
              {settingsLoading ? (
                <span className="inline-block h-6 w-20 bg-gray-200 rounded animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  ₹{(deliverySettings && deliverySettings.enabled
                    ? (deliverySettings.freeDeliveryThreshold > 0 && totalPrice >= deliverySettings.freeDeliveryThreshold
                        ? totalPrice
                        : totalPrice + (deliverySettings.deliveryFee || 0))
                    : totalPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Hints */}
            {!settingsLoading && deliverySettings && deliverySettings.enabled && deliverySettings.freeDeliveryThreshold > 0 && totalPrice < deliverySettings.freeDeliveryThreshold && (
              <p className="text-xs text-gray-600 mt-2">Free delivery over ₹{deliverySettings.freeDeliveryThreshold}</p>
            )}
            {!settingsLoading && disableCheckout && (
              <p className="text-xs text-amber-700 mt-2">Add ₹{belowMinBy} more to reach minimum order value.</p>
            )}
          </div>

          {/* Checkout Button */}
          <motion.button
            onClick={() => { if (!disableCheckout) navigate('/checkout'); }}
            disabled={disableCheckout}
            aria-disabled={disableCheckout}
            whileHover={!disableCheckout ? { scale: 1.02 } : {}}
            whileTap={!disableCheckout ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
              disableCheckout
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Checkout
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
