/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CartItem, Product } from '../types';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: (CartItem & { product: Product })[];
  totalItems: number;
  uniqueItems: number;
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

  type RemoteRow = { productId: Product | string; quantity: number };
  const mapRemoteCart = useMemo(() => (rows: RemoteRow[]) =>
    rows.map((row) => {
      if (typeof row.productId === 'string') {
        return {
          productId: row.productId,
          quantity: row.quantity,
          product: {
            _id: row.productId,
            name: 'Product',
            price: 0,
            stock: 0,
          } as Product,
        } as CartContextType['items'][number];
      }
      const prod = row.productId as unknown as Product;
      return { productId: prod._id, quantity: row.quantity, product: prod } as CartContextType['items'][number];
    }), []);

  const fetchCart = useCallback(async () => {
    // If user is authenticated, try fetching remote cart; otherwise load from localStorage
  if (isAuthenticated) {
      try {
        setLoading(true);
        const response = await api.getCart();
        const rows = (response.data?.cart || []) as RemoteRow[];
        setItems(mapRemoteCart(rows));
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Unauthenticated: keep cart empty (no dummy/local)
      setItems([]);
    }
  }, [isAuthenticated, mapRemoteCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity: number) => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const existing = items.find(i => i.productId === productId);
        // Enforce stock limits if product info is present in current items list
        const productInfo = existing?.product || items.find(i => i.product._id === productId)?.product;
        if (productInfo && typeof productInfo.stock === 'number') {
          const currentQty = existing?.quantity || 0;
          const remaining = Math.max(0, productInfo.stock - currentQty);
          if (remaining <= 0) {
            setLoading(false);
            throw new Error('No stock remaining');
          }
          if (quantity > remaining) {
            quantity = remaining;
          }
        }
        if (!existing) {
          // First add must use POST /cart/add to avoid 404 on PATCH increment
          const res = await api.addToCartRemote({ productId, quantity: Math.max(1, quantity) });
          const rows = (res.data?.cart || []) as RemoteRow[];
          setItems(mapRemoteCart(rows));
        } else {
          if (quantity > 1) {
            // Increase to desired total using absolute set: current + quantity
            const targetQty = existing.quantity + quantity;
            const res = await api.patchCartItem({ productId, quantity: targetQty });
            const rows = (res.data?.cart || []) as RemoteRow[];
            setItems(mapRemoteCart(rows));
          } else {
            // Simple increment
            const res = await api.patchCartItem({ productId, action: 'increment' });
            const rows = (res.data?.cart || []) as RemoteRow[];
            setItems(mapRemoteCart(rows));
          }
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      throw new Error('Please log in to add items to the cart.');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (isAuthenticated) {
      try {
        // Optimistic update to avoid flashing a loader on every +/- click
        const prev = items;
        if (quantity <= 0) {
          // Optimistically remove
          setItems(prev.filter((i) => i.productId !== productId));
          const res = await api.removeFromCart(productId);
          const rows = (res.data?.cart || []) as RemoteRow[];
          setItems(mapRemoteCart(rows));
        } else {
          // Optimistically set the new quantity
          const next = prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
          setItems(next);
          const res = await api.patchCartItem({ productId, quantity });
          const rows = (res.data?.cart || []) as RemoteRow[];
          setItems(mapRemoteCart(rows));
        }
      } catch (error) {
        console.error('Error updating cart:', error);
        // Rollback optimistic update
        await fetchCart();
        throw error;
      }
    } else {
      throw new Error('Please log in to update cart.');
    }
  };

  const removeItem = async (productId: string) => {
    if (isAuthenticated) {
      try {
  // Optimistic remove to avoid loader flicker
  const prev = items;
  setItems(prev.filter((i) => i.productId !== productId));
  const res = await api.removeFromCart(productId);
  const rows = (res.data?.cart || []) as RemoteRow[];
  setItems(mapRemoteCart(rows));
      } catch (error) {
        console.error('Error removing from cart:', error);
  await fetchCart();
        throw error;
      }
    } else {
      throw new Error('Please log in to remove items from cart.');
    }
  };

  const clearCart = () => {
    setItems([]);
    if (isAuthenticated) {
      api.clearCartRemote()
        .then((res) => {
          const rows = (res.data?.cart || []) as RemoteRow[];
          setItems(mapRemoteCart(rows));
        })
        .catch(() => {});
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = items.length;
  const totalPrice = items.reduce((sum, item) => sum + item.quantity * (item.product.price || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
  uniqueItems,
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
