import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Product, Category } from '../types';
import { getCategories, getProducts } from '../services/api';
import { deriveUnitLabel, derivePriceForUnit } from '../utils/format';
import { useStockSubscription } from '../hooks/useStockSubscription';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const { items: cartItems } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // URL state: page & limit
  const params = new URLSearchParams(location.search);
  const initialPage = Math.max(1, Number(params.get('page') || 1));
  const initialLimit = Math.max(1, Number(params.get('limit') || 24));
  const [page, setPage] = useState<number>(initialPage);
  const limit = initialLimit; // fixed page size across devices

  // Debounce search to avoid excessive requests
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // When search changes, start from page 1
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

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

  // Client-side full-catalog fetch toggle for search-only mode
  const ALL_FETCH_LIMIT = 100; // batch size used only for all-pages retrieval
  const allEnabled = debouncedSearch.length > 0;

  type ProductsEnvelope = { products: Product[]; total: number; page: number; totalPages: number };
  const { data, isLoading, isError, refetch, isFetching } = useQuery<ProductsEnvelope>({
    queryKey: ['products', { page, limit, search: debouncedSearch || undefined }],
    queryFn: async () => {
      const res = await getProducts({ page, limit, search: debouncedSearch || undefined });
      // Backend contract: { products, total, page, totalPages }
      return res.data as ProductsEnvelope;
    },
    keepPreviousData: true,
    retry: (failureCount, error: unknown) => {
      const status = (error as AxiosError)?.response?.status;
      if (status === 429) return failureCount < 1; // retry once
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  enabled: !allEnabled, // when searching, we fetch all pages once and paginate client-side
  });

  const products: Product[] = data?.products ?? [];
  const [allCatalog, setAllCatalog] = useState<Product[] | null>(null);
  const [allLoading, setAllLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      if (!allEnabled) {
        setAllCatalog(null);
        return;
      }
      setAllLoading(true);
      try {
        const first = (await getProducts({ page: 1, limit: ALL_FETCH_LIMIT })).data as ProductsEnvelope;
  const totalPagesAll = Math.max(1, first.totalPages);
  const MAX_PAGES_FETCH = 10; // safety cap to avoid too many requests
        if (totalPagesAll <= 1) {
          if (!cancelled) setAllCatalog(first.products);
        } else {
          const results: Product[][] = [first.products];
          for (let p = 2; p <= Math.min(totalPagesAll, MAX_PAGES_FETCH); p++) {
            const r = (await getProducts({ page: p, limit: ALL_FETCH_LIMIT })).data as ProductsEnvelope;
            results.push(r.products);
          }
          if (!cancelled) setAllCatalog(results.flat());
        }
      } catch (e) {
        // Failed to fetch full catalog for client-side search; proceed without all-catalog
        if (!cancelled) setAllCatalog([]);
      } finally {
        if (!cancelled) setAllLoading(false);
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [allEnabled]);

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
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  });

  const catMap = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach(c => m.set(c._id, c));
    return m;
  }, [categories]);

  const mapProduct = (p: Product): Product => ({
    ...p,
    // Backward-compatible category name: prefer category from API, else map from categoryId
    category: (p.category && p.category.trim()) || (p.categoryId && catMap.get(p.categoryId)?.name) || p.category,
    // Unit label derivation if not present
    unitLabel: deriveUnitLabel({ unitLabel: p.unitLabel, g: p.g ?? null, pieces: p.pieces ?? null }) || p.unitLabel,
    priceForUnitLabel: derivePriceForUnit(p.price, { g: p.g ?? null, unitLabel: p.unitLabel ?? null }) || p.priceForUnitLabel,
  });
  const catalogProducts: Product[] = (allEnabled ? (allCatalog ?? []) : products).map(mapProduct);

  // Derive available categories from the current product list
  const categoriesFromData = useMemo(() => {
    const set = new Set<string>();
    // Prefer backend categories list; fallback to product.category
    if (categories.length > 0) {
      categories.forEach(c => set.add(c.name));
    } else {
      for (const p of catalogProducts) {
        const c = (p.category ?? '').toString().trim();
        if (c) set.add(c);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catalogProducts, categories]);

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

  const filteredProducts: Product[] = catalogProducts
    .filter((product: Product) => {
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
  .sort((a: Product, b: Product) => a.name.localeCompare(b.name));

  // Paginate locally only in search mode (so results are independent of original server page)
  const effectiveTotal = allEnabled ? filteredProducts.length : (data?.total ?? filteredProducts.length);
  const totalPagesUI = allEnabled ? Math.max(1, Math.ceil(effectiveTotal / limit)) : (data?.totalPages ?? 1);
  const displayedProducts: Product[] = allEnabled
    ? filteredProducts.slice((page - 1) * limit, page * limit)
    : filteredProducts;

  // Live stock subscription for products displayed + items in cart
  useStockSubscription([
    ...displayedProducts.map((p) => p._id).filter(Boolean),
    ...cartItems.map((ci) => ci.product._id).filter(Boolean),
  ]);

  const isPageFetching = isFetching || allLoading;
  const isFirstLoad = (isLoading || (allEnabled && allCatalog === null)) && displayedProducts.length === 0;

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
          <span className="font-semibold text-green-600">{effectiveTotal}</span> products found
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
  {isFirstLoad ? (
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
            // Mobile: 2 columns like reference; tablet 3, desktop 4 (from lg)
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
          >
      {displayedProducts.map((product: Product, idx: number) => (
              <motion.div
        key={product._id || `${product.name}-${idx}`}
                layout
        className=""
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
            
            {displayedProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full"
              >
                <EmptyState
                  title="No products found"
                  description="Try adjusting your search or filter criteria."
                  icon={<span>😕</span>}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPagesUI}
        onPageChange={setPage}
        className="mt-6 sm:mt-8"
      />

      {/* Subtle loading bar during page fetch */}
  {isPageFetching && (
        <div className="fixed left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-green-400 via-green-600 to-green-400 animate-pulse z-40" />
      )}
    </motion.div>
  );
}
