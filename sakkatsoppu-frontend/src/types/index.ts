export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  images: string[];
  videos: string[];
  description: string;
  isOrganic: boolean;
  farmerId: string;
}

export interface Farmer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  farmName: string;
  farmDescription: string;
  farmImages: string[];
  farmVideos: string[];
  latitude: number;
  longitude: number;
  role: 'farmer';
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  paymentMode: 'COD';
  address: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  address: string;
  latitude: number;
  longitude: number;
  cart: CartItem[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
