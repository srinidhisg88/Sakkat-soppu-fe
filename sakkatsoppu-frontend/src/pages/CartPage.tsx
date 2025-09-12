import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../hooks/useToast';
// import { useAuth } from '../context/AuthContext';

export function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem, loading } = useCart();
  // const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();

  // Guests can view local cart; encourage login during checkout

  if (loading) {
    return <div className="text-center py-8">Loading cart...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">
            Browse our products and add some items to your cart
          </p>
          <Link
            to="/products"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
          >
            Browse Products
          </Link>
        </div>
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
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
