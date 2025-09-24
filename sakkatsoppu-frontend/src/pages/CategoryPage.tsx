import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Product, Category } from '../types';
import { getPublicCategories, getProductsByCategory } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // URL state: page & limit
  const params = new URLSearchParams(location.search);
  const initialPage = Math.max(1, Number(params.get('page') || 1));
  const initialLimit = Math.max(1, Number(params.get('limit') || 24));
  const [page, setPage] = useState<number>(initialPage);
  const limit = initialLimit;

  // Keep URL in sync
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    p.set('page', String(page));
    p.set('limit', String(limit));
    const nextSearch = p.toString();
    if (nextSearch !== location.search.replace(/^\?/, '')) {
      navigate({ pathname: location.pathname, search: nextSearch }, { replace: true });
    }
  }, [page, limit, location.pathname, location.search, navigate]);

  // Fetch categories to get category name
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'list'],
    queryFn: async () => {
      const res = await getPublicCategories();
      const payload = res.data;
      return (Array.isArray(payload) ? payload : payload?.data ?? payload?.categories ?? []) as Category[];
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Find current category
  const currentCategory = categories.find(cat => cat._id === categoryId);

  // Fetch products by category
  type ProductsEnvelope = {
    products: Product[];
    category: Category;
    total: number;
    page: number;
    totalPages: number;
  };

  const { data, isLoading, isError } = useQuery<ProductsEnvelope>({
    queryKey: ['products', 'by-category', categoryId, { page, limit }],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID is required');
      const res = await getProductsByCategory(categoryId, { page, limit });
      return res.data as ProductsEnvelope;
    },
    keepPreviousData: true,
    enabled: !!categoryId,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  if (!categoryId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >

          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center text-green-600 hover:text-green-700 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Products
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {currentCategory?.name || 'Category Products'}
            </h1>
          </motion.div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              title="Error Loading Products"
              description="There was an error loading products for this category. Please try again."
              actionLabel="Try Again"
              actionTo="#"
            />
          ) : products.length === 0 ? (
            <EmptyState
              title="No Products Found"
              description={`No products are currently available in the ${currentCategory?.name || 'selected'} category.`}
              actionLabel="Browse All Products"
              actionTo="/products"
            />
          ) : (
            <>
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6"
              >
                {products.map((product) => (
                  <motion.div key={product._id} variants={itemVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div variants={itemVariants} className="flex justify-center">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </motion.div>
              )}

              {/* Results Summary */}
              <motion.div variants={itemVariants} className="text-center text-gray-600">
                Showing {products.length} of {total} products in {currentCategory?.name}
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}