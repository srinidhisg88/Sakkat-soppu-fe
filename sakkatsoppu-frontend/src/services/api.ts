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
  const publicPrefixes = ['/products', '/admin/categories', '/farmers', '/coupons'];
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
export const getCoupons = (params?: { page?: number; limit?: number; search?: string }) => api.get('/public/coupons', { params });
export const getPublicCoupons = (params?: { page?: number; limit?: number; search?: string }) => api.get('/coupons', { params });

// Farmers (kept if backend supports)
export const getFarmer = (id: string) => api.get(`/farmers/${id}`);

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
  address: string;
  latitude: number;
  longitude: number;
  paymentMode: 'COD';
  idempotencyKey: string;
  couponCode?: string;
}) => api.post('/orders', orderData);

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
  address?: string;
  latitude?: number;
  longitude?: number;
}) => api.put('/users/profile', userData);

export default api;
