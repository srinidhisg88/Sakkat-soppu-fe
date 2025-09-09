import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import { useLocation } from '../hooks/useLocation';

export function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { getLocation, error: locationError, loading: locating } = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: user?.address || '',
    latitude: user?.latitude || 0,
    longitude: user?.longitude || 0,
  });

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

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
    } catch (err) {
      setError((err as Error).message || 'Failed to get location');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      // Try to create remote order; if that fails or user is unauthenticated, create a local order
      let newOrderId: string | undefined;
      try {
        if (isAuthenticated) {
          const res = await createOrder({
            ...formData,
            paymentMode: 'COD',
          });
          newOrderId = res.data?._id || res.data?.id;
        } else {
          throw new Error('Unauthenticated - create local order');
        }
      } catch (err) {
        // create local order fallback
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            {items.map((item) => (
              <div key={item.product._id} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">
                  ₹{item.product.price * item.quantity}
                </p>
              </div>
            ))}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>₹{totalPrice}</span>
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

            {formData.latitude && formData.longitude && (
              <p className="text-sm text-gray-600">
                Location: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            )}
            {locationError && (
              <p className="text-sm text-red-600">{locationError}</p>
            )}

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
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
