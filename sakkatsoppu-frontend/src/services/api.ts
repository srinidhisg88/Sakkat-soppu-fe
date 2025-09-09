import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products
export const getProducts = () => api.get('/products');
export const getProduct = (id: string) => api.get(`/products/${id}`);
export const getFarmerProducts = (farmerId: string) => api.get(`/products/farmer/${farmerId}`);

// Farmers
export const getFarmer = (id: string) => api.get(`/farmers/${id}`);

// Cart
export const getCart = () => api.get('/cart');
export const addToCart = (productId: string, quantity: number) => 
  api.post('/cart', { productId, quantity });
export const updateCartItem = (productId: string, quantity: number) =>
  api.put('/cart', { productId, quantity });
export const removeFromCart = (productId: string) =>
  api.delete(`/cart/${productId}`);

// Orders
export const getOrders = () => api.get('/orders');
export const createOrder = (orderData: {
  address: string;
  latitude: number;
  longitude: number;
  paymentMode: 'COD';
}) => api.post('/orders', orderData);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });
export const signup = (userData: {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
}) => api.post('/auth/signup', userData);

// Auth helpers
export const resetPassword = (email: string, newPassword: string) =>
  api.post('/auth/reset-password', { email, newPassword });

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
