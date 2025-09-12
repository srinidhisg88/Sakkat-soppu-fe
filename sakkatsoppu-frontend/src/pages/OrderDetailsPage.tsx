import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrders, getProducts } from '../services/api';
import { Product } from '../types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  type OrderLike = {
    _id?: string;
    id?: string;
    items?: Array<{ productId: string; quantity: number; price?: number }>;
    status?: string;
    createdAt?: string;
    paymentMode?: string;
  subtotalPrice?: number;
  discountAmount?: number;
  couponCode?: string;
  totalPrice?: number;
    address?: string;
    latitude?: number;
    longitude?: number;
  };

  const { data: remoteOrders = [], isLoading: ordersLoading, isFetching: ordersFetching } = useQuery<OrderLike[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await getOrders();
      const d = res.data as unknown;
      if (Array.isArray(d)) return d as OrderLike[];
      if (d && typeof d === 'object' && Array.isArray((d as { data?: unknown[] }).data)) {
        return ((d as { data?: unknown[] }).data || []) as OrderLike[];
      }
      return [] as OrderLike[];
    },
  });

  // Load products to enrich item names/unit labels
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products', 'for-order-details'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 500 });
      const d = res.data as unknown;
      if (Array.isArray(d)) return d as Product[];
      if (d && typeof d === 'object' && Array.isArray((d as { data?: unknown[] }).data)) {
        return ((d as { data?: unknown[] }).data || []) as Product[];
      }
      return [] as Product[];
    },
    staleTime: 60_000,
  });
  const productMap = new Map(products.map((p) => [p._id, p] as const));

  const order: OrderLike | undefined = useMemo(() => {
    const localRaw = localStorage.getItem('sakkat_orders');
    const localOrders = (localRaw ? JSON.parse(localRaw) : []) as OrderLike[];
    const combined = [...localOrders, ...remoteOrders];
    return combined.find((o) => (o._id || o.id) === id);
  }, [id, remoteOrders]);

  if (ordersLoading || ordersFetching) {
    return <div className="max-w-3xl mx-auto p-6">Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="mb-4">Order not found.</p>
        <button className="text-green-600 underline" onClick={() => navigate('/orders')}>Back to Orders</button>
      </div>
    );
  }

  // Address/location update controls removed per requirement

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-600">Order ID: {order._id || order.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status || 'pending'] || 'bg-gray-100 text-gray-800'}`}>
          {order.status || 'pending'}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Placed on</span>
          <span className="font-medium">{new Date(order.createdAt ?? Date.now()).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payment mode</span>
          <span className="font-medium">{order.paymentMode || 'COD'}</span>
        </div>
        {typeof order.subtotalPrice === 'number' && (
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">₹{order.subtotalPrice}</span>
          </div>
        )}
        {order.couponCode && typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
          <div>
            <div className="flex justify-between">
              <span className="text-gray-600">Coupon ({order.couponCode})</span>
              <span className="font-medium text-green-700">-₹{order.discountAmount}</span>
            </div>
            {typeof order.subtotalPrice === 'number' && order.subtotalPrice > 0 && (
              <p className="text-xs text-green-700 mt-1">
                You saved {Math.round((order.discountAmount! / order.subtotalPrice!) * 100)}% on this order.
              </p>
            )}
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold">₹{order.totalPrice ?? 0}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
        <p className="mb-0">{order.address || 'No address provided'}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Items</h2>
        <div className="divide-y">
          {(order.items || []).map((item: { productId: string; quantity: number; price?: number }, idx: number) => (
            <div key={idx} className="py-3 flex justify-between items-center">
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
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}{unitLabel ? ` • for ${unitLabel}` : ''}</p>
                    </>
                  );
                })()}
              </div>
              <p className="font-medium">₹{(item.price || 0) * item.quantity}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-right">
        <Link to="/orders" className="text-green-600 hover:underline">Back to all orders</Link>
      </div>
    </div>
  );
}
