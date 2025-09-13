import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useQuery } from '@tanstack/react-query';
import { getPublicDeliverySettings } from '../services/api';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/EmptyState';
// import { useAuth } from '../context/AuthContext';

export function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem, loading } = useCart();
  // const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState
          title="Your Cart is Empty"
          description="Browse our products and add some items to your cart."
          actionLabel="Browse Products"
          actionTo="/products"
          icon={<span>🧺</span>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product._id}
              className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 space-y-3 sm:space-y-0 bg-white p-4 rounded-lg shadow"
            >
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded"
              />
              <div className="flex-grow min-w-0">
                <Link
                  to={`/products/${item.product._id}`}
                  className="text-lg font-semibold hover:text-green-600"
                >
                  {item.product.name}
                </Link>
                <p className="text-gray-600">{item.product.category}</p>
                <p className="font-semibold mt-1">₹{item.product.price}</p>
                {/* Unit-aware stock breakdown */}
                <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                  {item.product.stock > 0 ? (
                    <>
                      <p>{item.product.stock} packs available</p>
                      {typeof item.product.g === 'number' && item.product.g > 0 && (() => {
                        const per = item.product.g;
                        const totalG = item.product.stock * per;
                        const total = totalG >= 1000 ? `${(totalG/1000).toFixed(1)} kg` : `${totalG} g`;
                        return (
                          <p>Each: {per} g • Total ~{total}</p>
                        );
                      })()}
                      {typeof item.product.pieces === 'number' && item.product.pieces > 0 && (
                        <p>Each: {item.product.pieces} pcs • Total {item.product.stock * item.product.pieces} pcs</p>
                      )}
                      {item.product.stock <= 5 && (
                        <p className="text-amber-700">Only {item.product.stock} left</p>
                      )}
                    </>
                  ) : (
                    <p className="text-red-600">Out of stock</p>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center border rounded">
                    <button
                      onClick={() => 
                        updateQuantity(item.product._id, Math.max(0, item.quantity - 1))
                      }
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-3 py-1">{item.quantity}</span>
                    <button
                      onClick={() => {
                        if (item.product.stock && item.quantity >= item.product.stock) {
                          show('Cannot exceed available stock', { type: 'warning' });
                          updateQuantity(item.product._id, item.product.stock);
                        } else {
                          updateQuantity(item.product._id, item.quantity + 1);
                        }
                      }}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="text-lg font-semibold whitespace-nowrap">
                ₹{item.product.price * item.quantity}
              </p>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              {settingsLoading ? (
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Delivery Fee</span>
                  <span className="inline-block h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              ) : deliverySettings && deliverySettings.enabled ? (
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Delivery Fee</span>
                  <span>
                    {deliverySettings.freeDeliveryThreshold > 0 && totalPrice >= deliverySettings.freeDeliveryThreshold
                      ? 'Free'
                      : (deliverySettings.deliveryFee > 0 ? `₹${deliverySettings.deliveryFee}` : 'Free')}
                  </span>
                </div>
              ) : null}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  {settingsLoading ? (
                    <span className="inline-block h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <span>
                      ₹{(deliverySettings && deliverySettings.enabled
                        ? (deliverySettings.freeDeliveryThreshold > 0 && totalPrice >= deliverySettings.freeDeliveryThreshold
                            ? totalPrice
                            : totalPrice + (deliverySettings.deliveryFee || 0))
                        : totalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!settingsLoading && deliverySettings && deliverySettings.enabled && deliverySettings.freeDeliveryThreshold > 0 && totalPrice < deliverySettings.freeDeliveryThreshold && (
              <p className="text-xs text-gray-600">Free delivery over ₹{deliverySettings.freeDeliveryThreshold}</p>
            )}
            {!settingsLoading && disableCheckout && (
              <p className="text-xs text-amber-700 mt-1">Add ₹{belowMinBy} more to reach minimum order value.</p>
            )}
            <button
              onClick={() => { if (!disableCheckout) navigate('/checkout'); }}
              disabled={disableCheckout}
              aria-disabled={disableCheckout}
              className={`w-full py-3 rounded-lg font-semibold ${disableCheckout ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
