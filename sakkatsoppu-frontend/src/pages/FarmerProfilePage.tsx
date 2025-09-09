import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFarmer, getFarmerProducts } from '../services/api';
import { Farmer, Product } from '../types';
import { farmers as dummyFarmers, products as dummyProducts } from '../constants/dummyData';
import { ProductCard } from '../components/ProductCard';

export function FarmerProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: farmer, isLoading: farmerLoading } = useQuery<Farmer>({
    queryKey: ['farmer', id],
    queryFn: async () => {
      try {
        const response = await getFarmer(id!);
        return response.data;
      } catch (e) {
        const fallback = (dummyFarmers as unknown as Farmer[]).find((f) => f._id === id);
        if (!fallback) throw e;
        return fallback;
      }
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['farmerProducts', id],
    queryFn: async () => {
      try {
        const response = await getFarmerProducts(id!);
        return response.data;
      } catch (e) {
        return (dummyProducts as unknown as Product[]).filter((p) => p.farmerId === id);
      }
    },
  });

  if (farmerLoading || !farmer) {
    return <div className="text-center py-8">Loading farmer details...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Farm Images */}
  {(farmer.farmImages || []).length > 0 && (
          <div className="relative h-64 md:h-96">
            <img
              src={farmer.farmImages[0]}
              alt={farmer.farmName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Farm Info */}
        <div className="p-6">
          <h1 className="text-3xl font-bold">{farmer.farmName}</h1>
          <p className="text-gray-600 mt-2">by {farmer.name}</p>
          <p className="text-gray-700 mt-4">{farmer.farmDescription}</p>

          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-700">Location</h2>
              <p className="mt-1">{farmer.address}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-700">Contact</h2>
              <p className="mt-1">{farmer.phone}</p>
              <p className="mt-1">{farmer.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Videos */}
  {(farmer.farmVideos || []).length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Farm Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {(farmer.farmVideos || []).map((video, index) => (
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

      {/* Farmer's Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Products from {farmer.farmName}</h2>
        {productsLoading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
        {!productsLoading && products.length === 0 && (
          <p className="text-center text-gray-600">
            No products available from this farmer at the moment.
          </p>
        )}
      </div>
    </div>
  );
}
