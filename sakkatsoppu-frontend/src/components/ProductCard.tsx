import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingCartIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(product._id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <Link to={`/products/${product._id}`} className="block h-full">
        <div className="relative">
          <motion.img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-56 object-cover"
            whileHover={{ scale: 1.05 }}
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
        
        <div className="p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-2 hover:text-green-600 transition-colors">
            {product.name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-3">{product.category}</p>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-green-600">₹{product.price}</span>
              <span className="text-sm text-gray-500 ml-1">per kg</span>
            </div>
            
            <div className="text-sm text-gray-600">
              {product.stock > 0 ? (
                <span className="text-green-600 font-medium">{product.stock} in stock</span>
              ) : (
                <span className="text-red-500 font-medium">Out of stock</span>
              )}
            </div>
          </div>

          <motion.button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all duration-300
              ${
                product.stock > 0
                  ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
          >
            <ShoppingCartIcon className="h-5 w-5" />
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </motion.button>
        </div>
      </Link>
    </motion.div>
  );
}
