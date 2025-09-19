export interface Product {
  _id: string;
  name: string;
  category?: string;
  categoryId?: string;
  price: number;
  stock: number;
  // Media
  imageUrl?: string;
  images?: string[];
  videos?: string[];
  // Details
  description?: string;
  isOrganic?: boolean;
  farmerId?: string;
  // Units from backend schema
  g?: number;
  pieces?: number | null;
  unitLabel?: string; // e.g., "250 g"
  priceForUnitLabel?: string; // e.g., "30 for 250 g"
  pricePerKg?: number | null;
  pricePerPiece?: number | null;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
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
  // Some list APIs may return these alternate fields
  imageUrl?: string;
  images?: string[];
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
  // Optional pricing breakdown from backend
  subtotalPrice?: number;
  discountAmount?: number;
  couponCode?: string;
  deliveryFee?: number;
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
