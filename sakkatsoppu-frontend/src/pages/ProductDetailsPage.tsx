import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Product, Farmer } from '../types';
import { products as dummyProducts } from '../constants/dummyData';
import { farmers as dummyFarmers } from '../constants/dummyData';
import { getProduct, getFarmer } from '../services/api';
import { useCart } from '../context/CartContext';

export function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      try {
        const response = await getProduct(id!);
        return response.data;
      } catch (e) {
        // fallback to dummy product
        const fallback = (dummyProducts as unknown as Product[]).find((p) => p._id === id);
        if (!fallback) throw e;
        return fallback as Product;
      }
    },
  });

  const { data: farmer, isLoading: farmerLoading } = useQuery<Farmer>({
    queryKey: ['farmer', product?.farmerId],
    enabled: !!product?.farmerId,
    queryFn: async () => {
      try {
        const response = await getFarmer(product!.farmerId);
        return response.data;
      } catch (e) {
        const fallback = (dummyFarmers as unknown as Farmer[]).find((f) => f._id === product!.farmerId);
        if (!fallback) throw e;
        return fallback;
      }
    },
  });

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product._id, quantity);
      // Show success message
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Show error message
    }
  };

  if (productLoading && !product) {
    return <div className="text-center py-8">Loading product details...</div>;
  }

  if (!product) {
    return <div className="text-center py-8">Product not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full rounded-lg shadow-md"
          />
          <div className="grid grid-cols-4 gap-2">
            {(product.images || []).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} ${index + 1}`}
                className="w-full h-24 object-cover rounded cursor-pointer"
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600 mt-2">{product.category}</p>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold">₹{product.price}</span>
            {product.isOrganic && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Organic
              </span>
            )}
          </div>

          <p className="text-gray-700">{product.description}</p>

          <div className="flex items-center space-x-4">
            <div className="flex items-center border rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-4 py-2">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100"
              >
                +
              </button>
            </div>
            <p className="text-gray-600">
              {product.stock} units available
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full py-3 rounded-lg font-semibold ${
              product.stock > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>

          {/* Farmer Info */}
          {farmer && !farmerLoading && (
            <div className="mt-8 p-4 bg-green-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">About the Farmer</h2>
              <Link
                to={`/farmers/${farmer._id}`}
                className="text-green-700 hover:underline"
              >
                <h3 className="font-medium">{farmer.farmName}</h3>
              </Link>
              <p className="text-gray-600 mt-1">by {farmer.name}</p>
              <p className="text-gray-600 mt-1">{farmer.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Videos */}
  {(product.videos || []).length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Product Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {(product.videos || []).map((video, index) => (
              <div key={index} className="aspect-w-16 aspect-h-9">
                <video
                  src={video}
                  controls
                  className="w-full rounded-lg shadow"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
