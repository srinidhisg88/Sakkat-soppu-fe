import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Product, Category } from '../types';
import { getProducts, getCategories } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

// Categories are derived from API data (no hardcoded list)

// Removed price-based sorting options per request

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// itemVariants removed to avoid first-paint invisibility on refresh


export function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products = [], isLoading, isError, refetch } = useQuery<Product[]>({
    queryKey: ['products', 'list'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 50 });
      const unwrap = (val: unknown): Product[] => {
        if (Array.isArray(val)) return val as Product[];
        if (val && typeof val === 'object') {
          const obj = val as Record<string, unknown>;
          const keys = ['data', 'products', 'items', 'results', 'payload'];
          for (const k of keys) {
            if (k in obj) {
              const nested = unwrap(obj[k]);
              if (Array.isArray(nested)) return nested as Product[];
            }
          }
          const firstArray = Object.values(obj).find(Array.isArray);
          if (firstArray) return unwrap(firstArray);
        }
        return [] as Product[];
      };
      return unwrap(res.data);
    },
    retry: (failureCount, error: unknown) => {
      const status = (error as AxiosError)?.response?.status;
      if (status === 429) return failureCount < 1; // retry once on rate limit
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnMount: false,
  });

  // Load categories from backend to support new normalized model
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'list'],
    queryFn: async () => {
      const res = await getCategories();
      type CatEnvelope = { data?: Category[]; categories?: Category[] } | Category[];
      const payload = res.data as CatEnvelope;
      return (Array.isArray(payload) ? payload : payload?.data ?? payload?.categories ?? []) as Category[];
    },
    staleTime: 10 * 60 * 1000,
    retry: (failureCount, error: unknown) => {
      const status = (error as AxiosError)?.response?.status;
      if (status === 429) return failureCount < 1;
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    refetchOnMount: false,
  });

  const catMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach(c => m.set(c._id, c));
    return m;
  }, [categories]);

  const effectiveProducts = products.map(p => ({
    ...p,
    // Backward-compatible category name: prefer category from API, else map from categoryId
    category: (p.category && p.category.trim()) || (p.categoryId && catMap.get(p.categoryId)?.name) || p.category,
    // Unit label derivation if not present
    unitLabel: p.unitLabel || (typeof p.g === 'number' && p.g > 0 ? `${p.g} g` : (typeof p.pieces === 'number' && p.pieces > 0 ? `${p.pieces} piece${p.pieces === 1 ? '' : 's'}` : undefined)),
    priceForUnitLabel: p.priceForUnitLabel || (typeof p.g === 'number' && p.g > 0 ? `${p.price} for ${p.g} g` : undefined),
  }));

  // Derive available categories from the current product list
  const categoriesFromData = useMemo(() => {
    const set = new Set<string>();
    // Prefer backend categories list; fallback to product.category
    if (categories.length > 0) {
      categories.forEach(c => set.add(c.name));
    } else {
      for (const p of effectiveProducts) {
        const c = (p.category ?? '').toString().trim();
        if (c) set.add(c);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [effectiveProducts, categories]);

  const categoryOptions = useMemo(() => ['All', ...categoriesFromData], [categoriesFromData]);

  // If selected category is no longer available, reset to All
  useEffect(() => {
    if (
      selectedCategory !== 'All' &&
      !categoriesFromData.some(
        (c) => c.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
      )
    ) {
      setSelectedCategory('All');
    }
  }, [categoriesFromData, selectedCategory]);

  const filteredProducts = effectiveProducts
    .filter(product => {
      const prodCategory = (product.category ?? '').toString().toLowerCase().trim();
      const selected = (selectedCategory ?? 'All').toString().toLowerCase().trim();
      const q = (searchQuery ?? '').toString().toLowerCase().trim();

      const matchesCategory = selected === 'all' || prodCategory === selected;
      const name = (product.name ?? '').toString();
      const description = (product.description ?? '').toString();
      const matchesSearch = q === '' ||
        name.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
  })
  // Default to name ordering; price sorting removed
  .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <motion.div 
      className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="bg-gradient-to-r from-green-600 to-green-400 rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 text-white"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
  <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">Our Fresh Products</h1>
  <p className="text-green-50 text-sm sm:text-lg">
          Discover fresh, organic produce from local farmers
        </p>
      </motion.div>

    {/* Filters and Search */}
      <motion.div 
        className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 sm:pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter (only from API response) */}
          <div className="relative">
            <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-3 sm:pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              {categoryOptions.map((name) => (
                <option key={name} value={name}>
                  {name === 'All' ? 'All Products' : name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort options removed */}
        </div>
      </motion.div>

      {/* Results Summary */}
      <motion.div
  className="flex items-center justify-between mb-4 sm:mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-gray-600">
          <span className="font-semibold text-green-600">{filteredProducts.length}</span> products found
        </p>
        {isError && (
          <button
            onClick={() => refetch()}
            className="text-sm text-red-600 hover:underline"
          >
            Retry loading
          </button>
        )}
      </motion.div>

      {/* Products Grid */}
  <AnimatePresence mode="wait" initial={false}>
  {(isLoading && (!effectiveProducts || effectiveProducts.length === 0)) ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full"
            />
          </motion.div>
  ) : (
          <motion.div
            variants={containerVariants}
            initial={false}
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr"
          >
            {filteredProducts.map(product => (
              <motion.div
                key={product._id}
                layout
                className="h-full"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
            
            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <div className="text-4xl mb-4">😕</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter criteria
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
