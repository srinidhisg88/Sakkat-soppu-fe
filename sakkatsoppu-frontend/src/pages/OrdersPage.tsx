import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order, Product } from '../types';
import { getOrders, getProducts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');

  type OrderLike = Partial<Order> & {
    _id?: string;
    id?: string;
    status?: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | string;
    items?: Array<{ productId: string; quantity: number; price?: number }>;
    createdAt?: string;
    totalPrice?: number;
  };

  const { data: orders = [], isLoading } = useQuery<OrderLike[]>({
    queryKey: ['orders'],
    queryFn: async () => {
  const response = await getOrders();
  const d = response.data as unknown;
  if (Array.isArray(d)) return d as OrderLike[];
  if (d && typeof d === 'object' && Array.isArray((d as { data?: unknown[] }).data)) {
    return ((d as { data?: unknown[] }).data || []) as OrderLike[];
  }
  return [] as OrderLike[];
    },
  });

  // Fetch products to enrich order items with name/unit label
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products', 'for-orders'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 500 });
      const unwrap = (val: unknown): Product[] => {
        if (Array.isArray(val)) return val as Product[];
        if (val && typeof val === 'object') {
          const obj = val as Record<string, unknown>;
          const keys = ['data', 'products', 'items', 'results', 'payload'];
          for (const k of keys) {
            if (k in obj) {
              const nested = unwrap(obj[k]);
              if (Array.isArray(nested)) return nested as Product[];
            }
          }
          const firstArray = Object.values(obj).find(Array.isArray);
          if (firstArray) return unwrap(firstArray);
        }
        return [] as Product[];
      };
      return unwrap(res.data);
    },
    staleTime: 60_000,
  });

  const productMap = new Map(products.map((p) => [p._id, p] as const));

  // If unauthenticated, read local orders from localStorage
  let effectiveOrders: OrderLike[] = orders;
  if (!isAuthenticated) {
    const raw = localStorage.getItem('sakkat_orders');
    effectiveOrders = raw ? (JSON.parse(raw) as OrderLike[]) : [];
  }

  const filtered: OrderLike[] = status === 'all' ? effectiveOrders : effectiveOrders.filter((o) => o.status === status);

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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
    {(['all','pending','confirmed','delivered','cancelled'] as const).map((s) => (
          <button
            key={s}
      onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded-full text-sm ${status===s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {s[0].toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>

  <div className="space-y-4">
  {filtered.map((order) => (
          <div
      key={order._id || order.id}
    className="bg-white rounded-lg shadow-sm p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
        <p className="text-xs text-gray-600">
                  Order placed on{' '}
                  {new Date(order.createdAt ?? Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
        <p className="text-xs text-gray-600">
          Order ID: {order._id || order.id}
                </p>
              </div>
        <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium
                  ${
          order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                `}
              >
        {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
              </span>
            </div>

    <div className="border-t border-b py-3 mb-3">
              {(order.items || []).map((item) => (
                <div
                  key={item.productId}
      className="flex justify-between items-center py-1.5"
                >
                  <div>
                    {(() => {
                      const pid: unknown = item.productId as unknown;
                      let prod: Partial<Product> | undefined;
                      if (typeof pid === 'string') {
                        prod = productMap.get(pid);
                      } else if (pid && typeof pid === 'object') {
                        prod = pid as Partial<Product>;
                      }
                      const name = prod?.name || (typeof pid === 'string' ? `Product ${pid.slice(0,6)}…` : 'Product');
                      const unitLabel = prod?.unitLabel || (typeof prod?.g === 'number' && (prod.g as number) > 0
                        ? `${prod.g} g`
                        : typeof prod?.pieces === 'number' && (prod.pieces as number) > 0
                        ? `${prod.pieces} piece${prod.pieces === 1 ? '' : 's'}`
                        : undefined);
                      return (
                        <>
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}{unitLabel ? ` • for ${unitLabel}` : ''}</p>
                        </>
                      );
                    })()}
                  </div>
                  <p className="font-medium text-sm">₹{(item.price || 0) * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-600">Delivery Address</p>
                <p className="mt-0.5 text-sm">{order.address}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Total Amount</p>
                <p className="text-lg font-bold">₹{order.totalPrice ?? 0}</p>
              </div>
            </div>

            {order.couponCode && typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
              <div className="mt-2 flex justify-between items-center bg-green-50 rounded-md px-3 py-2">
                <p className="text-xs text-green-800">
                  Coupon <span className="font-semibold">{order.couponCode}</span> applied
                  {typeof order.subtotalPrice === 'number' && order.subtotalPrice > 0
                    ? (() => {
                        const pct = Math.round((order.discountAmount! / order.subtotalPrice!) * 100);
                        return ` • Saved ${pct}%`;
                      })()
                    : ''}
                </p>
                <p className="text-sm font-medium text-green-700">-₹{order.discountAmount}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
