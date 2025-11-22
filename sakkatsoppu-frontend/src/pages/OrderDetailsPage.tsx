import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrders, getProducts, getProduct } from '../services/api';
import { Product } from '../types';
import { deriveUnitLabel } from '../utils/format';
import { Shimmer } from '../components/Shimmer';

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
  deliveryFee?: number;
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
  // Map by both _id and id to be safe
  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) {
      if (p && typeof p === 'object') {
        const rec = p as unknown as Record<string, unknown>;
        const idA = typeof rec._id === 'string' ? (rec._id as string) : undefined;
        const idB = typeof rec.id === 'string' ? (rec.id as string) : undefined;
        if (idA) m.set(idA, p);
        if (idB) m.set(idB, p);
      }
    }
    return m;
  }, [products]);

  const order: OrderLike | undefined = useMemo(() => {
    const localRaw = localStorage.getItem('sakkat_orders');
    const localOrders = (localRaw ? JSON.parse(localRaw) : []) as OrderLike[];
    const combined = [...localOrders, ...remoteOrders];
    return combined.find((o) => (o._id || o.id) === id);
  }, [id, remoteOrders]);

  // Fetch any missing products for this order so names always display
  const [extraProducts, setExtraProducts] = useState<Map<string, Product>>(new Map());
  useEffect(() => {
    let cancelled = false;
    const items = (order?.items || []) as Array<{ productId: string; quantity: number; price?: number }>;
    const missing = items
      .map((it) => it.productId)
      .filter((pid) => typeof pid === 'string' && !productMap.has(pid) && !extraProducts.has(pid));
    if (missing.length === 0) return;
    (async () => {
      const entries: Array<[string, Product]> = [];
      await Promise.all(
        missing.slice(0, 100).map(async (pid) => {
          try {
            const res = await getProduct(pid);
            const p = res.data as Product;
            if (p) entries.push([pid, p]);
          } catch {
            // ignore
          }
        })
      );
      if (!cancelled && entries.length > 0) {
        setExtraProducts((prev) => {
          const m = new Map(prev);
          for (const [k, v] of entries) m.set(k, v);
          return m;
        });
      }
    })();
    return () => { cancelled = true; };
  }, [order?.items, productMap, extraProducts]);

  if (ordersLoading || ordersFetching) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Shimmer width="w-48" height="h-8" />
        <div className="bg-white rounded-lg p-6 space-y-4">
          <Shimmer width="w-32" height="h-6" />
          <Shimmer width="w-full" height="h-4" />
          <Shimmer width="w-full" height="h-4" />
          <Shimmer width="w-3/4" height="h-4" />
        </div>
        <div className="bg-white rounded-lg p-6 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <Shimmer width="w-16" height="h-16" className="rounded-lg" />
              <div className="flex-1 space-y-2">
                <Shimmer width="w-2/3" height="h-4" />
                <Shimmer width="w-1/3" height="h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
      {/* Thank you message */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center shadow-sm">
        <div className="text-green-800 font-bold text-xl mb-2">
          Thanks for ordering!
        </div>
        <p className="text-green-700 text-base">
          Your order has been confirmed.
        </p>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Order Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Placed on</span>
          <span className="font-medium">{new Date(order.createdAt ?? Date.now()).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payment mode</span>
          <span className="font-medium">Cash on Delivery / UPI on Delivery</span>
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
        {typeof order.deliveryFee === 'number' && (
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="font-medium">{order.deliveryFee === 0 ? 'Free' : `₹${order.deliveryFee}`}</span>
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
                    prod = productMap.get(pid) || extraProducts.get(pid);
                  } else if (pid && typeof pid === 'object') {
                    prod = pid as Partial<Product>;
                  }
                  const name = prod?.name || 'Item';
                  const unitLabel = deriveUnitLabel({ unitLabel: prod?.unitLabel, g: (prod?.g as number | undefined) ?? null, pieces: (prod?.pieces as number | undefined) ?? null });
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Link
          to="/products"
          className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
        >
          Continue Shopping
        </Link>
        <Link
          to="/orders"
          className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-md"
        >
          View All Orders
        </Link>
      </div>
    </div>
  );
}
