import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, updateQuantity, items } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useRouterLocation();
  const { show } = useToast();
  const [qty, setQty] = useState(1);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    try {
      const existingQty = items.find(i => i.productId === product._id)?.quantity || 0;
      const remaining = Math.max(0, (product.stock || 0) - existingQty);
      if (remaining <= 0) {
        show('No more stock available for this item', { type: 'warning' });
        return;
      }
      const desired = Math.max(1, Math.min(qty, remaining));
      if (desired < qty) {
        show(`Only ${remaining} remaining. Adding ${desired}.`, { type: 'warning' });
      }
      await addToCart(product._id, desired);
      show('Added to cart', { type: 'success' });
    } catch (error) {
      console.error('Error adding to cart:', error);
      show('Failed to add to cart', { type: 'error' });
    }
  };

  const numericStock = Number((product as unknown as { stock?: unknown })?.stock ?? 0);
  const existingQty = items.find(i => i.productId === product._id)?.quantity || 0;
  const inCart = existingQty > 0;
  const remaining = Math.max(0, numericStock - existingQty);

  const incDesired = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (remaining <= 0) {
      show('No more stock available for this item', { type: 'warning' });
      return;
    }
    setQty((q) => {
      const next = q + 1;
      if (next > remaining) {
        show('Cannot exceed available stock', { type: 'warning' });
        return Math.max(1, remaining);
      }
      return next;
    });
  };

  const decDesired = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty((q) => Math.max(1, q - 1));
  };

  const incCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = existingQty + 1;
    if (next > numericStock) {
      show('Cannot exceed available stock', { type: 'warning' });
      return;
    }
    try {
      await updateQuantity(product._id, next);
    } catch {
      show('Failed to update quantity', { type: 'error' });
    }
  };

  const decCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = existingQty - 1;
    try {
      await updateQuantity(product._id, next);
    } catch {
      show('Failed to update quantity', { type: 'error' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 h-full"
    >
      <Link to={`/products/${product._id}`} className="h-full flex flex-col">
        <div className="relative w-full" style={{ aspectRatio: '4 / 3' }}>
          <motion.img
            src={product.imageUrl || (product.images && product.images[0]) || '/placeholder.png'}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
          />
          {product.isOrganic && (
            <motion.div 
              className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Organic</span>
            </motion.div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2 hover:text-green-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-1">{product.category}</p>
          
    <div className="flex items-center justify-between mb-4 gap-2">
            <div>
              <span className="text-xl sm:text-2xl font-bold text-green-600">₹{product.price}</span>
              {(() => {
                const unitLabel = product.unitLabel || (typeof product.g === 'number' && product.g > 0
                  ? `${product.g} g`
                  : typeof product.pieces === 'number' && product.pieces > 0
                  ? `${product.pieces} piece${product.pieces === 1 ? '' : 's'}`
                  : undefined);
                return unitLabel ? (
  <span className="text-xs sm:text-sm text-gray-500 ml-1 truncate">for {unitLabel}</span>
                ) : null;
              })()}
            </div>
            
            {(() => {
              const stock = numericStock;
              const g = typeof product.g === 'number' ? product.g : 0;
              const pcs = typeof product.pieces === 'number' ? product.pieces : 0;
              if (stock <= 0) {
                return <div className="text-sm text-red-500 font-medium">Out of stock</div>;
              }
              let text = `In stock: ${stock}`;
              if (g > 0) {
                const kg = ((stock * g) / 1000).toFixed(1);
                text = `In stock: ${stock} packs (~${kg} kg)`;
              } else if (pcs > 0) {
                text = `In stock: ${stock} packs (${stock * pcs} pcs)`;
              } else {
                text = `In stock: ${stock}`;
              }
              return (
                <div className="text-[10px] sm:text-xs">
                  <span className="inline-block bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                    {text}
                  </span>
                </div>
              );
            })()}
          </div>

          {numericStock > 0 && numericStock <= 5 && (
            <div className="text-[10px] sm:text-xs text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded">
              Only {numericStock} left
            </div>
          )}

          {/* Quantity / Add Controls */}
          {inCart ? (
            <div className="mt-auto">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">In your cart</div>
                <div className="flex items-center border rounded overflow-hidden">
                  <button
                    onClick={decCart}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 min-w-[2.5rem] text-center">{existingQty}</span>
                  <button
                    onClick={incCart}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-auto flex items-center gap-2 sm:gap-3">
              {remaining > 0 && (
                <div className="flex items-center border rounded overflow-hidden">
                  <button
                    onClick={decDesired}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 active:scale-95"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 min-w-[2.5rem] text-center">{qty}</span>
                  <button
                    onClick={incDesired}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 active:scale-95"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}
              <motion.button
                onClick={handleAddToCart}
                disabled={remaining <= 0}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all duration-300
                  ${
                    remaining > 0
                      ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {remaining > 0 ? 'Add to Cart' : 'Out of Stock'}
              </motion.button>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
