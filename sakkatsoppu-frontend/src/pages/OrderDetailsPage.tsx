import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../services/api';
import { useLocation as useGeo } from '../hooks/useLocation';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLocation, error: locError } = useGeo();
  const [updateMsg, setUpdateMsg] = useState('');

  const { data: remoteOrders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await getOrders();
      return res.data;
    },
  });

  const order: any = useMemo(() => {
    const localRaw = localStorage.getItem('sakkat_orders');
    const localOrders = localRaw ? JSON.parse(localRaw) : [];
    const combined = [...localOrders, ...remoteOrders];
    return combined.find((o: any) => (o._id || o.id) === id);
  }, [id, remoteOrders]);

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="mb-4">Order not found.</p>
        <button className="text-green-600 underline" onClick={() => navigate('/orders')}>Back to Orders</button>
      </div>
    );
  }

  const applyAddressUpdate = (updates: Partial<{ address: string; latitude: number; longitude: number }>) => {
    // update localStorage order if it's a local order; for remote, just show UI change
    const isLocal = !!order.id && !order._id;
    if (isLocal) {
      const localRaw = localStorage.getItem('sakkat_orders');
      const localOrders = localRaw ? JSON.parse(localRaw) : [];
      const updated = localOrders.map((o: any) => {
        if (o.id === order.id) {
          return { ...o, ...updates };
        }
        return o;
      });
      localStorage.setItem('sakkat_orders', JSON.stringify(updated));
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      const coords = await getLocation();
      applyAddressUpdate({ latitude: coords.latitude, longitude: coords.longitude });
      setUpdateMsg('Location updated for this order');
    } catch (e) {
      setUpdateMsg('Failed to fetch location');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-600">Order ID: {order._id || order.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
          {order.status}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Placed on</span>
          <span className="font-medium">{new Date(order.createdAt || order.date || Date.now()).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payment mode</span>
          <span className="font-medium">{order.paymentMode || 'COD'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold">₹{order.totalPrice || order.total || order.totalAmount}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
        <p className="mb-3">{order.address || 'No address provided'}</p>
        {(order.latitude && order.longitude) && (
          <p className="text-sm text-gray-600">Location: {order.latitude.toFixed(6)}, {order.longitude.toFixed(6)}</p>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <Link to="/checkout" className="px-4 py-2 rounded-lg border text-green-700 bg-green-50 hover:bg-green-100">Update Address</Link>
          <button onClick={handleUseCurrentLocation} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Use My Current Location</button>
        </div>
        {updateMsg && <p className="text-sm text-green-700 mt-2">{updateMsg}</p>}
        {locError && <p className="text-sm text-red-700 mt-1">{locError}</p>}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Items</h2>
        <div className="divide-y">
          {(order.items || []).map((item: any, idx: number) => (
            <div key={idx} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium">Product ID: {item.productId}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
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
