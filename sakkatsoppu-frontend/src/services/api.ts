import axios from 'axios';

const API_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token only for protected endpoints
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const url = config.url || '';
  const publicPrefixes = ['/products', '/admin/categories', '/farmers', '/farmer', '/coupons', '/public'];
  const isPublic = publicPrefixes.some((p) => url.startsWith(p));
  const isAuthRoute = url.startsWith('/auth/');
  if (token && !isPublic && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products
export const getProducts = (params?: {
  page?: number; limit?: number; search?: string; lowStock?: boolean; threshold?: number;
}) => api.get('/products', { params });
export const getProduct = (id: string) => api.get(`/products/${id}`);
export const getFarmerProducts = (farmerId: string) => api.get(`/products/farmer/${farmerId}`);

// Categories
export const getCategories = () => api.get('/admin/categories');
export const getPublicCategories = () => api.get('/public/categories');
export const getProductsByCategory = (categoryId: string, params?: { page?: number; limit?: number }) =>
  api.get(`/public/categories/${categoryId}/products`, { params });
export const getCoupons = (params?: { page?: number; limit?: number; search?: string }) => api.get('/public/coupons', { params });
export const getPublicCoupons = (params?: { page?: number; limit?: number; search?: string }) => api.get('/coupons', { params });
// Delivery settings (public)
export const getPublicDeliverySettings = () => api.get('/public/settings/delivery');

// Homepage videos (public)
export const getHomepageVideos = () => api.get('/public/homepage-videos');

// Farmers
export const getFarmers = (params?: { page?: number; limit?: number; q?: string }) =>
  api.get('/farmer', { params });
export const getFarmerById = (id: string) => api.get(`/farmer/${id}`);

// Cart (spec-compliant)
export const getCart = () => api.get('/cart');
export const addToCartRemote = (payload: { productId: string; quantity: number }) =>
  api.post('/cart/add', payload);
export const patchCartItem = (payload: { productId: string; action?: 'increment' | 'decrement'; quantity?: number; }) =>
  api.patch('/cart/item', payload);
export const removeFromCart = (productId: string) => api.delete(`/cart/remove/${productId}`);
export const clearCartRemote = () => api.post('/cart/clear');

// Orders
export const getOrders = () => api.get('/orders');
export const createOrder = (orderData: {
  address: {
    houseNo: string;
    landmark: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  latitude: number;
  longitude: number;
  paymentMode: 'COD';
  idempotencyKey: string;
  couponCode?: string;
  phone?: string;
  items?: Array<{ productId: string; quantity: number }>; // optional: include cart items if backend requires
}) => {
  const payload: Record<string, unknown> = { ...orderData };
  // Remove optional/zero coordinates if backend rejects 0,0
  if (!payload.latitude || Number(payload.latitude) === 0) delete payload.latitude;
  if (!payload.longitude || Number(payload.longitude) === 0) delete payload.longitude;
  if (typeof orderData.couponCode === 'string' && orderData.couponCode.trim() !== '') {
    const code = orderData.couponCode.trim();
  payload.couponCode = code; // Send only couponCode, per backend contract
  } else {
    delete payload.couponCode;
  }
  // Include phone if provided
  if (typeof orderData.phone === 'string' && orderData.phone.trim() !== '') {
    payload.phone = orderData.phone.trim();
  } else {
    delete payload.phone;
  }
  // Only include items if provided and non-empty
  if (Array.isArray(orderData.items) && orderData.items.length > 0) {
    payload.items = orderData.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  } else {
    delete payload.items;
  }
  // Dev: POST /orders payload debug log removed to satisfy lint rules
  return api.post('/orders', payload);
};

// Auth
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const signup = (userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}) => {
  const payload: Record<string, unknown> = { ...userData };
  // Remove optional/empty fields that can trip backend validation
  if (payload.latitude == null || payload.latitude === 0) delete payload.latitude;
  if (payload.longitude == null || payload.longitude === 0) delete payload.longitude;
  if (payload.address === '') delete payload.address;
  if (payload.phone === '') delete payload.phone;
  return api.post('/auth/signup', payload);
};
export const logout = () => api.post('/auth/logout');
export const forgotPassword = (email: string) => api.post('/auth/forgot-password', { email });
export const resetPassword = (payload: { token: string; newPassword: string; email?: string }) =>
  api.post('/auth/reset-password', payload);

// Google OAuth
export const googleAuth = (idToken: string) => api.post('/auth/google', { idToken });

// User Profile
export const getProfile = () => api.get('/users/profile');
export const updateProfile = (userData: {
  name?: string;
  phone?: string;
  address?: {
    houseNo: string;
    landmark: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  latitude?: number;
  longitude?: number;
}) => api.put('/users/profile', userData);

export default api;

// Geocoding via backend proxy with fallback to OSM (dev only)
type GeocodeSearchParams = { q: string; limit?: number };
type GeocodeReverseParams = { lat: number; lon: number };

export const geocodeSearch = async (params: GeocodeSearchParams) => {
  try {
    return await api.get('/proxy/geocode/search', { params });
  } catch (err: unknown) {
    // Fallback to public OSM Nominatim in dev if proxy missing
    if (import.meta.env.DEV) {
      const searchParams = new URLSearchParams({
        q: params.q,
        format: 'json',
        addressdetails: '1',
        limit: String(params.limit ?? 6),
      });
      return await api.get(`https://nominatim.openstreetmap.org/search?${searchParams.toString()}`, {
        headers: {
          'Accept': 'application/json',
          // Provide a descriptive UA per OSM policy; no PII
          'User-Agent': 'SakkatSoppuFrontend/1.0 (dev)'
        },
      });
    }
    throw err;
  }
};

export const geocodeReverse = async (params: GeocodeReverseParams) => {
  try {
    return await api.get('/proxy/geocode/reverse', { params });
  } catch (err: unknown) {
    if (import.meta.env.DEV) {
      const searchParams = new URLSearchParams({
        lat: String(params.lat),
        lon: String(params.lon),
        format: 'json',
        addressdetails: '1',
      });
      return await api.get(`https://nominatim.openstreetmap.org/reverse?${searchParams.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SakkatSoppuFrontend/1.0 (dev)'
        },
      });
    }
    throw err;
  }
};
