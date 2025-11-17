import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order, Product } from '../types';
import { deriveUnitLabel } from '../utils/format';
import { getOrders, getProducts } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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

  // Combined filter: by status AND search query
  const filtered: OrderLike[] = useMemo(() => {
    let result = effectiveOrders;

    // Filter by status
    if (status !== 'all') {
      result = result.filter((o) => normalizeStatus(o.status as string | undefined) === status);
    }

    // Filter by search query (product name or status)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((order) => {
        // Search by status
        const orderStatus = normalizeStatus(order.status as string | undefined);
        if (orderStatus.toLowerCase().includes(query)) return true;

        // Search by product name
        const items = (order.items || []) as Array<{ productId: string; name?: string; product?: Partial<Product> }>;
        return items.some((item) => {
          const pid = item.productId;
          const embedded = (typeof item.product === 'object' ? item.product as Partial<Product> : undefined);
          const prod: Partial<Product> | undefined = embedded || productMap.get(pid);
          const name = item.name || prod?.name || '';
          return name.toLowerCase().includes(query);
        });
      });
    }

    return result;
  }, [effectiveOrders, status, searchQuery, productMap]);

  // Helper function for status badge color
  const getStatusColor = (orderStatus: OrderStatus) => {
    switch (orderStatus) {
      case 'delivered':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      case 'pending':
      case 'confirmed':
      default:
        return 'bg-yellow-400 text-gray-900';
    }
  };

  const getStatusLabel = (orderStatus: OrderStatus) => {
    switch (orderStatus) {
      case 'delivered':
        return 'Completed';
      case 'pending':
      case 'confirmed':
        return 'In Process';
      case 'cancelled':
        return 'Cancelled';
      default:
        return orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Order</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Search and Filter Bar */}
        <div className="mb-6 flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Toggle filter menu"
          >
            <FunnelIcon className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Filter Menu */}
        <AnimatePresence>
          {showFilterMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-white rounded-lg border border-gray-200 p-4 overflow-hidden"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Status</h3>
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'confirmed', 'delivered', 'cancelled'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s);
                      setShowFilterMenu(false);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      status === s
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Orders List */}
        <div className="space-y-4">
          {filtered.map((order, index) => {
            const orderStatus = normalizeStatus(order.status as string | undefined);

            return (
              <motion.div
                key={order._id || order.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
              >
                {/* Order Header - Title and Status */}
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(order.createdAt ?? Date.now()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {(() => {
                        const items = (order.items || []) as Array<{ productId: string; name?: string; product?: Partial<Product> }>;
                        if (items.length === 0) return 'Order';
                        const firstItem = items[0];
                        const pid = firstItem.productId;
                        const embedded = (typeof firstItem.product === 'object' ? firstItem.product as Partial<Product> : undefined);
                        const prod: Partial<Product> | undefined = embedded || productMap.get(pid);
                        const name = firstItem.name || prod?.name || 'Items';
                        return items.length > 1 ? `${name} +${items.length - 1} more` : name;
                      })()}
                    </p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(orderStatus)}`}>
                    {getStatusLabel(orderStatus)}
                  </span>
                </div>

                {/* Order Items */}
                <div className="mb-3 space-y-2">
                  {(() => {
                    type ExtendedOrderItem = Order['items'][number] & {
                      id?: string;
                      product?: Partial<Product> | string;
                      name?: string;
                      g?: number;
                      pieces?: number;
                      unitLabel?: string;
                    };
                    const items = (order.items || []) as unknown as ExtendedOrderItem[];
                    return items.map((item, idx) => {
                      const pid = item.productId;
                      const embedded = (typeof item.product === 'object' ? item.product as Partial<Product> : undefined);
                      const prod: Partial<Product> | undefined = embedded || productMap.get(pid);
                      const name = item.name || prod?.name || 'Item';
                      const grams = typeof item.g === 'number' ? item.g : (typeof prod?.g === 'number' ? prod.g : 0);
                      const pcs = typeof item.pieces === 'number' ? item.pieces : (typeof prod?.pieces === 'number' ? prod.pieces! : 0);
                      const unitLabel = deriveUnitLabel({ unitLabel: (item.unitLabel as string | undefined) || (prod?.unitLabel as string | undefined), g: grams, pieces: pcs });

                      return (
                        <div key={String(item.productId || item.id || idx)} className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Qty: {item.quantity}{unitLabel ? ` • ${unitLabel}` : ''}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{(Number(item.price) || 0) * Number(item.quantity || 0)}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Pricing Breakdown */}
                <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                  {typeof order.subtotalPrice === 'number' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₹{order.subtotalPrice}</span>
                    </div>
                  )}
                  {order.couponCode && typeof order.discountAmount === 'number' && order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon ({order.couponCode})</span>
                      <span>-₹{order.discountAmount}</span>
                    </div>
                  )}
                  {typeof order.deliveryFee === 'number' && (
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span>{order.deliveryFee === 0 ? 'Free' : `₹${order.deliveryFee}`}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">₹{order.totalPrice ?? 0}</span>
                  </div>
                </div>

                {/* Delivery Address */}
                {order.address && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                    <p className="text-sm text-gray-700">{order.address}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
