import { motion } from 'framer-motion';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Product } from '../types';
import { getProducts } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { VideoHeroSection } from '../components/VideoHeroSection';
import { Link } from 'react-router-dom';
import { ProductCardShimmer } from '../components/Shimmer';
// import AboutFarmersSection from '../components/AboutFarmersSection';
import {
  SparklesIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: <SparklesIcon className="h-6 w-6" />,
    title: "Fresh & Organic",
    description: "100% organic produce from local farms"
  },
  {
    icon: <CalendarDaysIcon className="h-6 w-6" />,
    title: "Delivery Schedule",
    description: "Order anytime and enjoy doorstep delivery right after harvesting – freshness delivered straight to you!"
  },
  {
    icon: <UserGroupIcon className="h-6 w-6" />,
    title: "Support Farmers",
    description: "Backed by 50+ local farmers — fair pay, stronger communities."
  }
];


type HomePageProps = { startAnimations?: boolean };

export const HomePage: React.FC<HomePageProps> = ({ startAnimations = true }) => {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', 'home-featured'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 20 });
      type ProductsEnvelope = { data?: Product[]; products?: Product[]; items?: Product[]; results?: Product[] } | Product[];
      const payload = res.data as ProductsEnvelope;
      const list = Array.isArray(payload)
        ? payload
        : payload?.data ?? payload?.products ?? payload?.items ?? payload?.results ?? [];
      // Filter out products with stock <= 0 and take first 8
      const inStockProducts = (list as Product[]).filter(p => {
        const stock = Number(p.stock ?? 0);
        return stock > 0;
      });
      return inStockProducts.slice(0, 8) as Product[];
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Fetch all products to derive categories
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products', 'all-for-categories'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 1000 });
      type ProductsEnvelope = { data?: Product[]; products?: Product[]; items?: Product[] } | Product[];
      const payload = res.data as ProductsEnvelope;
      const list = Array.isArray(payload) ? payload : payload?.data ?? payload?.products ?? payload?.items ?? [];
      return list as Product[];
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Derive categories from products
  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, { name: string; image: string }>();

    allProducts.forEach(product => {
      const categoryName = product.category || 'Uncategorized';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          image: product.imageUrl || product.images?.[0] || ''
        });
      }
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      _id: name,
      name: name,
      image: data.image
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);


  const effectiveProducts = products;


  return (
    <div className="space-y-16 pb-16">
      {/* Video Hero Section */}
      <VideoHeroSection startAnimations={startAnimations} />

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4">
        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden -mx-4">
          <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white p-4 rounded-xl shadow-md flex-shrink-0 w-[280px] border border-green-100/70"
              >
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-green-500 via-emerald-400 to-green-500" />
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-green-50 text-green-700 flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border border-green-100/70 hover:-translate-y-0.5"
            >
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-green-500 via-emerald-400 to-green-500" />
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 text-green-700 ring-1 ring-green-200 group-hover:ring-green-300 shadow-sm flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5">{feature.title}</h3>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold mb-8"
          >
            Shop by Category
          </motion.h2>

          {/* Horizontally scrollable categories */}
          <div className="relative -mx-4 md:mx-0">
            <div className="overflow-x-auto scrollbar-hide px-4 md:px-0">
              <div className="flex gap-6 pb-4">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className="flex-shrink-0 animate-fade-in-scale"
                  >
                    <Link
                      to={`/categories/all?category=${encodeURIComponent(category.name)}`}
                      className="flex flex-col items-center gap-3 group"
                    >
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-200 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600"></div>
                        )}
                      </div>
                      <span className="text-sm md:text-base font-semibold text-gray-800 text-center max-w-[100px] md:max-w-[140px] group-hover:text-green-600 transition-colors">
                        {category.name}
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold mb-8"
        >
          Featured Products
        </motion.h2>
        
        {(isLoading && (!effectiveProducts || effectiveProducts.length === 0)) ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardShimmer key={i} />
            ))}
          </div>
        ) : effectiveProducts && Array.isArray(effectiveProducts) && effectiveProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {effectiveProducts.map(product => (
              <div key={product._id} className="h-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">No products to show.</div>
        )}
      </section>

        {/** Farmers CTA hidden for now **/}
        {/**
        <div className="max-w-6xl mx-auto px-4 mt-12">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-green-800">Meet the farmers behind your food</h2>
              <p className="text-green-700 mt-1">From seed to plate — honest produce from people you can trust.</p>
            </div>
            <a href="/farmers" className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 shadow">
              Explore Farmers
            </a>
          </div>
        </div>
        **/}

        {/** About our farmers hidden for now **/}
        {/** <AboutFarmersSection /> **/}
    </div>
  );
}
