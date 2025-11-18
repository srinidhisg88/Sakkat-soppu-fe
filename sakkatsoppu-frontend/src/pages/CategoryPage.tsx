import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {  useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { MagnifyingGlassIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { AlertCircle, Search as SearchIcon } from 'lucide-react';
import { ProductCardShimmer } from '../components/Shimmer';


export function CategoryPage() {
 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // Get selected category from URL
  const selectedCategory = searchParams.get('category') || null;

  // Fetch products using the simple /api/products endpoint
  type ProductsEnvelope = {
    products?: Product[];
    data?: Product[];
    items?: Product[];
    total?: number;
  };

  const { data: productsData, isLoading, isError } = useQuery<Product[]>({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 1000 });
      const payload = res.data as ProductsEnvelope;
      const list = payload?.products ?? payload?.data ?? payload?.items ?? [];

      // Filter out of stock products
      const inStockProducts = (list as Product[]).filter(p => {
        const stock = Number(p.stock ?? 0);
        return stock > 0;
      });
      return inStockProducts;
    },
  });

  const products = productsData ?? [];

  // Derive categories from products
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { name: string; image: string }>();

    products.forEach(product => {
      const categoryName = product.category || 'Uncategorized';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          image: product.imageUrl || product.images?.[0] || ''
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      id: name,
      name: name,
      image: data.image
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      const categoryMatch = !selectedCategory || product.category === selectedCategory;

      // Search filter
      if (!searchQuery.trim()) return categoryMatch;

      const query = searchQuery.toLowerCase();
      const searchMatch = (
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );

      return categoryMatch && searchMatch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleCategoryClick = (categoryName: string | null) => {
    setSearchQuery(''); // Reset search when changing category
    if (categoryName) {
      navigate(`/categories/all?category=${encodeURIComponent(categoryName)}`);
    } else {
      navigate('/categories/all');
    }
  };

  // Get category icon
  const getCategoryIcon = () => {
    return <Squares2X2Icon className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="flex gap-6">
            {/* Left Sidebar - Desktop only, sticky */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="w-64 flex-shrink-0"
            >
              <div className="sticky top-20 space-y-2">
                <h2 className="text-lg font-bold text-gray-900 mb-4 px-3">Categories</h2>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                {/* All Products option */}
                <button
                  onClick={() => handleCategoryClick(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                    !selectedCategory
                      ? 'bg-green-600 text-white font-semibold shadow-md'
                      : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  All Products
                </button>

                {/* Category list */}
                <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.name)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                        selectedCategory === category.name
                          ? 'bg-green-600 text-white font-semibold shadow-md'
                          : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {selectedCategory || 'All Products'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {isLoading ? 'Loading...' : `${filteredProducts.length} products available`}
                  </p>
                </div>

                {/* Products Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <ProductCardShimmer key={i} />
                    ))}
                  </div>
                ) : isError ? (
                  <EmptyState
                    title="Error Loading Products"
                    description="There was an error loading products. Please try again."
                    actionLabel="Retry"
                    actionTo="#"
                    IconComponent={AlertCircle}
                  />
                ) : filteredProducts.length === 0 ? (
                  <EmptyState
                    title="No Products Found"
                    description={searchQuery ? `No products found for "${searchQuery}"` : `No products are currently available${selectedCategory ? ` in ${selectedCategory}` : ''}.`}
                    actionLabel="Browse All Products"
                    actionTo="/categories/all"
                    IconComponent={SearchIcon}
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredProducts.map((product) => (
                      <div key={product._id}>
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View - Like Screenshot */}
      <div className="md:hidden">
        {/* Search Bar */}
        <div className="bg-white px-4 pt-4 pb-3 sticky top-16 z-40 shadow-sm">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
        </div>

        {/* Title */}
        <div className="px-4 py-3 bg-white">
          <h2 className="text-lg font-bold text-gray-800">Recommended Categories</h2>
        </div>

        <div className="flex">
          {/* Left Sidebar - Categories with Images */}
          <aside className="w-24 bg-gray-50 border-r border-gray-200 overflow-y-auto h-[calc(100vh-200px)] flex-shrink-0">
            <div className="py-2">
              {/* All Products */}
              <button
                onClick={() => handleCategoryClick(null)}
                className={`w-full px-2 py-3 flex flex-col items-center justify-center gap-2 transition-colors ${
                  !selectedCategory
                    ? 'bg-white border-l-4 border-green-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <Squares2X2Icon className={`h-6 w-6 ${!selectedCategory ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                <span className={`text-xs text-center leading-tight ${!selectedCategory ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                  Popular
                </span>
              </button>

              {/* Category List */}
              {categories.map((category) => {
                const isActive = selectedCategory === category.name;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`w-full px-2 py-3 flex flex-col items-center justify-center gap-2 transition-colors ${
                      isActive
                        ? 'bg-white border-l-4 border-green-600'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category.image ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 flex items-center justify-center ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                        {getCategoryIcon()}
                      </div>
                    )}
                    <span className={`text-xs text-center leading-tight px-1 ${isActive ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Products Grid */}
          <div className="flex-1 px-3 py-4 overflow-y-auto h-[calc(100vh-200px)]">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardShimmer key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="px-4">
                <EmptyState
                  title="Error Loading Products"
                  description="There was an error loading products. Please try again."
                  IconComponent={AlertCircle}
                />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="px-4">
                <EmptyState
                  title="No Products Found"
                  description={searchQuery ? `No products found for "${searchQuery}"` : 'No products available'}
                  IconComponent={SearchIcon}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <div key={product._id}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
