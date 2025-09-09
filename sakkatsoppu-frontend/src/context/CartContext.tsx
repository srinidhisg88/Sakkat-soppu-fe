import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product } from '../types';
import * as api from '../services/api';
import { products as dummyProducts } from '../constants/dummyData';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: (CartItem & { product: Product })[];
  totalItems: number;
  totalPrice: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => void;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<(CartItem & { product: Product })[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    // If user is authenticated, try fetching remote cart; otherwise load from localStorage
    if (isAuthenticated) {
      try {
        setLoading(true);
        const response = await api.getCart();
        setItems(response.data);
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Load from localStorage for unauthenticated users
      try {
        const raw = localStorage.getItem('sakkat_cart');
        if (raw) {
          setItems(JSON.parse(raw));
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error('Error reading local cart:', err);
        setItems([]);
      }
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity: number) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        await api.addToCart(productId, quantity);
        await fetchCart();
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      // local cart logic
      setItems((prev) => {
        const existing = prev.find((i) => i.product._id === productId);
        if (existing) {
          const next = prev.map((i) =>
            i.product._id === productId ? { ...i, quantity: i.quantity + quantity } : i
          );
          localStorage.setItem('sakkat_cart', JSON.stringify(next));
          return next;
        }
        // Need to fetch product details from dummy data if available
  const product = (dummyProducts as any[]).find((p: any) => p._id === productId);
  const prod = product || ({ _id: productId, name: 'Product', price: 0, imageUrl: '', category: '', stock: 0, unit: '' } as any);
        // CartItem shape: { productId, quantity, product }
        const newItem = {
          productId: prod._id,
          quantity,
          product: prod,
        } as unknown as (CartItem & { product: Product });
        const next = [...prev, newItem];
        localStorage.setItem('sakkat_cart', JSON.stringify(next));
        return next;
      });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        if (quantity <= 0) {
          await removeItem(productId);
        } else {
          await api.updateCartItem(productId, quantity);
          await fetchCart();
        }
      } catch (error) {
        console.error('Error updating cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      setItems((prev) => {
        let next = prev
          .map((i) => (i.product._id === productId ? { ...i, quantity } : i))
          .filter((i) => i.quantity > 0);
        localStorage.setItem('sakkat_cart', JSON.stringify(next));
        return next;
      });
    }
  };

  const removeItem = async (productId: string) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        await api.removeFromCart(productId);
        await fetchCart();
      } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      setItems((prev) => {
        const next = prev.filter((i) => i.product._id !== productId);
        localStorage.setItem('sakkat_cart', JSON.stringify(next));
        return next;
      });
    }
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem('sakkat_cart');
    } catch (err) {
      // ignore
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
