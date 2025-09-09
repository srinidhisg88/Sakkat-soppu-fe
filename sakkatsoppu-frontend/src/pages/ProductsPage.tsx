import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Product } from '../types';
import { getProducts } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const categories = [
  { id: 'All', name: 'All Products', icon: '🌟' },
  { id: 'Fruits', name: 'Fruits', icon: '🍎' },
  { id: 'Vegetables', name: 'Vegetables', icon: '🥕' },
  { id: 'Grains', name: 'Grains', icon: '🌾' },
  { id: 'Dairy', name: 'Dairy', icon: '🥛' },
];

const sortOptions = [
  { value: 'name', label: 'Name', icon: '📝' },
  { value: 'price-asc', label: 'Price: Low to High', icon: '💰' },
  { value: 'price-desc', label: 'Price: High to Low', icon: '💎' },
  { value: 'rating', label: 'Rating', icon: '⭐' },
];

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
    transition: { duration: 0.3 }
  }
};

import { products as dummyProducts } from '../constants/dummyData';

export function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await getProducts();
      return response.data;
    },
  });

  // Use dummy products as fallback in development or while the query is loading
  const effectiveProducts = (!isLoading && products && products.length > 0) ? products : (dummyProducts as unknown as Product[]);

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
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        default:
          return 0;
      }
    });

  return (
    <motion.div 
      className="max-w-7xl mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="bg-gradient-to-r from-green-600 to-green-400 rounded-2xl p-8 mb-8 text-white"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-4xl font-bold mb-4">Our Fresh Products</h1>
        <p className="text-green-50 text-lg">
          Discover fresh, organic produce from local farmers
        </p>
      </motion.div>

      {/* Filters and Search */}
      <motion.div 
        className="bg-white rounded-xl shadow-lg p-6 mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="relative">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Results Summary */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-gray-600">
          <span className="font-semibold text-green-600">{filteredProducts.length}</span> products found
        </p>
      </motion.div>

      {/* Products Grid */}
      <AnimatePresence mode="wait">
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
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map(product => (
              <motion.div
                key={product._id}
                variants={itemVariants}
                layout
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
