import { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { Product } from '../types';
import { deriveUnitLabel } from '../utils/format';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { useAddToCartBar } from '../hooks/useAddToCartBar';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, updateQuantity, items } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useRouterLocation();
  const { show } = useToast();
  const { showBar } = useAddToCartBar();
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
  // Count distinct products (not quantity)
  showBar(1);
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
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col animate-fade-in-scale">
      <Link to={`/products/${product._id}`} className="flex-shrink-0">
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
          <img
            src={product.imageUrl || (product.images && product.images[0]) || '/placeholder.png'}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {product.isOrganic && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <SparklesIcon className="h-4 w-4" />
              <span>Organic</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <Link to={`/products/${product._id}`}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1.5 sm:mb-2 hover:text-green-600 transition-colors line-clamp-2 min-h-[42px] sm:min-h-[48px]">
            {product.name}
          </h3>
        </Link>
        <p className="text-[11px] sm:text-xs text-gray-600 mb-2 sm:mb-2.5 line-clamp-1 min-h-[14px] sm:min-h-[16px]">{product.category}</p>

        <div className="flex items-center justify-between mb-2 gap-2">
          <div>
            <span className="text-lg sm:text-xl font-bold text-green-600">₹{product.price}</span>
            {(() => {
              const unitLabel = deriveUnitLabel({ unitLabel: product.unitLabel, g: product.g ?? null, pieces: product.pieces ?? null });
              return unitLabel ? (
                <span className="text-[11px] sm:text-xs text-gray-500 ml-1 truncate">for {unitLabel}</span>
              ) : null;
            })()}
          </div>
        </div>

        {/* Spacer to push controls to bottom */}
        <div className="flex-1"></div>

        {/* Quantity / Add Controls */}
        {inCart ? (
          <div className="mt-auto">
              <div className="text-xs sm:text-sm text-gray-700 mb-2">In your cart</div>
              <div className="flex items-center border rounded-lg overflow-hidden w-full">
                <button
                  onClick={decCart}
                  className="px-2 sm:px-3 py-2 text-gray-600 hover:bg-gray-100 active:scale-95 text-lg"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="flex-1 py-2 text-center font-medium text-sm sm:text-base">{existingQty}</span>
                <button
                  onClick={incCart}
                  className="px-2 sm:px-3 py-2 text-gray-600 hover:bg-gray-100 active:scale-95 text-lg"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-auto flex flex-col gap-2 min-w-0">
              {remaining > 0 && (
                <div className="flex items-center border rounded-lg overflow-hidden w-full">
                  <button
                    onClick={decDesired}
                    className="px-2 sm:px-3 py-2 text-gray-600 hover:bg-gray-100 active:scale-95 text-lg"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="flex-1 py-2 text-center font-medium text-sm sm:text-base">{qty}</span>
                  <button
                    onClick={incDesired}
                    className="px-2 sm:px-3 py-2 text-gray-600 hover:bg-gray-100 active:scale-95 text-lg"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={remaining <= 0}
                className={`w-full py-2.5 px-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 text-sm sm:text-base active:scale-95
                  ${
                    remaining > 0
                      ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg active:shadow-sm'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                <ShoppingCartIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">{remaining > 0 ? 'Add' : 'Out of Stock'}</span>
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
