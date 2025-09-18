import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order, Product } from '../types';
import { getOrders, getProducts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';
// import { useNavigate } from 'react-router-dom';

export function OrdersPage() {
  const { isAuthenticated } = useAuth();
  // const navigate = useNavigate();
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');

  type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  const normalizeStatus = (val?: string): OrderStatus => {
    if (!val) return 'pending';
    const s = String(val).trim().toLowerCase();
    if (s === 'canceled') return 'cancelled';
    if (s.startsWith('deliver')) return 'delivered';
    if (s.startsWith('confirm')) return 'confirmed';
    if (s.startsWith('pend')) return 'pending';
    return (['pending','confirmed','delivered','cancelled'] as const).includes(s as OrderStatus)
      ? (s as OrderStatus)
      : 'pending';
  };

  type OrderLike = Partial<Order> & {
    _id?: string;
    id?: string;
    status?: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | string;
    items?: Array<{ productId: string; quantity: number; price?: number }>;
    createdAt?: string;
    totalPrice?: number;
  subtotalPrice?: number;
  discountAmount?: number;
  couponCode?: string;
  deliveryFee?: number;
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

  // Map by both _id and id to be safe
  const productMap = new Map<string, Product>();
  for (const p of products) {
    if (p && typeof p === 'object') {
      // Use a safe intermediate cast suggested by TS when converting to Record
      const rec = (p as unknown) as Record<string, unknown>;
      const idA = typeof rec._id === 'string' ? (rec._id as string) : undefined;
      const idB = typeof rec.id === 'string' ? (rec.id as string) : undefined;
      if (idA) productMap.set(idA, p);
      if (idB) productMap.set(idB, p);
    }
  }

  // If unauthenticated, read local orders from localStorage
  let effectiveOrders: OrderLike[] = orders;
  if (!isAuthenticated) {
    const raw = localStorage.getItem('sakkat_orders');
    effectiveOrders = raw ? (JSON.parse(raw) as OrderLike[]) : [];
  }

  const filtered: OrderLike[] = status === 'all'
    ? effectiveOrders
    : effectiveOrders.filter((o) => normalizeStatus(o.status as string | undefined) === status);

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

      {isLoading && effectiveOrders.length === 0 && (
        <div className="py-4">
          <EmptyState title="Loading orders..." icon={<span>⏳</span>} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-4">
          {effectiveOrders.length > 0 && status !== 'all' ? (
            <EmptyState
              title={`No orders with status "${status}"`}
              description="Try switching the status filter to see other orders."
              icon={<span>🔎</span>}
            />
          ) : (
            <EmptyState
              title="No Orders Yet"
              description="You haven't placed any orders yet. Start shopping to place your first order!"
              actionLabel="Browse Products"
              actionTo="/products"
              icon={<span>🧺</span>}
            />
          )}
        </div>
      ) : null}

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
          normalizeStatus(order.status as string | undefined) === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : normalizeStatus(order.status as string | undefined) === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                `}
              >
        {(() => {
          const s = normalizeStatus(order.status as string | undefined);
          return s.charAt(0).toUpperCase() + s.slice(1);
        })()}
              </span>
            </div>

  <div className="border-t border-b py-3 mb-3">
              {(() => {
                // Allow optional, backend-embedded fields without changing global OrderItem type
                type ExtendedOrderItem = Order['items'][number] & {
                  id?: string;
                  product?: Partial<Product> | string;
                  name?: string;
                  g?: number;
                  pieces?: number;
                  unitLabel?: string;
                };
                const items = (order.items || []) as unknown as ExtendedOrderItem[];
                return items.map((item) => (
                <div
                  key={String(item.productId || item.id || Math.random())}
      className="flex justify-between items-center py-1.5"
                >
                  <div>
                    {(() => {
                      const pid = item.productId;
                      // Prefer embedded product if present, otherwise map by productId
                      const embedded = (typeof item.product === 'object' ? item.product as Partial<Product> : undefined);
                      const prod: Partial<Product> | undefined = embedded || productMap.get(pid);
                      const fallbackName = 'Item';
                      const name = item.name || prod?.name || fallbackName;
                      const grams = typeof item.g === 'number' ? item.g : (typeof prod?.g === 'number' ? prod.g : 0);
                      const pcs = typeof item.pieces === 'number' ? item.pieces : (typeof prod?.pieces === 'number' ? prod.pieces! : 0);
                      const unitLabel = item.unitLabel || (prod?.unitLabel as string | undefined) || (grams && grams > 0
                        ? `${grams} g`
                        : pcs && pcs > 0
                        ? `${pcs} piece${pcs === 1 ? '' : 's'}`
                        : undefined);
                      return (
                        <>
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}{unitLabel ? ` • for ${unitLabel}` : ''}</p>
                        </>
                      );
                    })()}
                  </div>
                  <p className="font-medium text-sm">₹{(Number(item.price) || 0) * Number(item.quantity || 0)}</p>
                </div>
                ));
              })()}
            </div>
            {/* Pricing breakdown in the middle section */}
            <div className="mt-2 space-y-1 text-sm">
              {typeof order.subtotalPrice === 'number' && (
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₹{order.subtotalPrice}</span>
                </div>
              )}
              {order.couponCode && typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Coupon ({order.couponCode})</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              {typeof order.deliveryFee === 'number' && (
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Fee</span>
                  <span>{order.deliveryFee === 0 ? 'Free' : `₹${order.deliveryFee}`}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-3">
              <div>
                <p className="text-xs text-gray-600">Delivery Address</p>
                <p className="mt-0.5 text-sm">{order.address}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Total Amount</p>
                <p className="text-lg font-bold">₹{order.totalPrice ?? 0}</p>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
