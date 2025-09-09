import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order } from '../types';
import { getOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
  const response = await getOrders();
  return response.data;
    },
  });

  // If unauthenticated, read local orders from localStorage
  let effectiveOrders: any[] = orders;
  if (!isAuthenticated) {
    const raw = localStorage.getItem('sakkat_orders');
    effectiveOrders = raw ? JSON.parse(raw) : [];
  }

  const filtered = status === 'all' ? effectiveOrders : effectiveOrders.filter((o: any) => o.status === status);

  if (isLoading && effectiveOrders.length === 0) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Orders Yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't placed any orders yet. Start shopping to place your first order!
          </p>
          <button
            onClick={() => navigate('/products')}
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all','pending','confirmed','delivered','cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s as any)}
            className={`px-3 py-1 rounded-full text-sm ${status===s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {s[0].toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filtered.map((order: any) => (
          <div
      key={order._id || order.id}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  Order placed on{' '}
                  {new Date(order.createdAt || order.date || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-600">
          Order ID: {order._id || order.id}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium
                  ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                `}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            <div className="border-t border-b py-4 mb-4">
              {(order.items || []).map((item: any) => (
                <div
                  key={item.productId}
                  className="flex justify-between items-center py-2"
                >
                  <div>
                    <p className="font-medium">Product ID: {item.productId}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">₹{(item.price || 0) * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Delivery Address:</p>
                <p className="mt-1">{order.address}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold">₹{order.totalPrice || order.total || order.totalAmount}</p>
              </div>
            </div>

            <div className="mt-4 text-right">
              <Link to={`/orders/${order._id || order.id}`} className="text-green-600 hover:underline">View details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
