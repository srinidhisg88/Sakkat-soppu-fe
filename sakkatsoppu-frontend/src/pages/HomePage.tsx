import { motion } from 'framer-motion';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import {
  ShoppingBagIcon,
  SparklesIcon,
  TruckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// Resolve logo asset (prefer public path for simplicity)
const heroLogo = new URL('../../logo_final.jpg', import.meta.url).href;

const features = [
  {
    icon: <SparklesIcon className="h-6 w-6" />,
    title: "Fresh & Organic",
    description: "100% organic produce from local farms"
  },
  {
    icon: <TruckIcon className="h-6 w-6" />,
    title: "Fast Delivery",
  description: "Fast, reliable delivery across the city"
  },
  {
    icon: <UserGroupIcon className="h-6 w-6" />,
    title: "Support Farmers",
    description: "Direct from farmers, better prices"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0
  }
};

type HomePageProps = { startAnimations?: boolean };

export const HomePage: React.FC<HomePageProps> = ({ startAnimations = true }) => {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', 'home-featured'],
    queryFn: async () => {
      const res = await getProducts({ page: 1, limit: 8 });
      type ProductsEnvelope = { data?: Product[]; products?: Product[]; items?: Product[]; results?: Product[] } | Product[];
      const payload = res.data as ProductsEnvelope;
      const list = Array.isArray(payload)
        ? payload
        : payload?.data ?? payload?.products ?? payload?.items ?? payload?.results ?? [];
      return list as Product[];
    },
  });

  const effectiveProducts = products;


  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <motion.section
        className="relative bg-gradient-to-r from-green-600 to-green-400 text-white py-24 px-4 rounded-3xl mx-4 overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={startAnimations ? { scale: 1, opacity: 0.1 } : { scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 bg-[url('/pattern.svg')] bg-center"
        />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Title/Logo/CTA */}
            <div className="text-center lg:text-left order-1">
              <div className="mx-auto lg:mx-0 mb-6 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white shadow p-2 overflow-hidden">
                <img
                  src={heroLogo}
                  alt="Sakkat Soppu logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <motion.div
                variants={{
                  hidden: { opacity: 1 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
                  }
                }}
                initial="hidden"
                animate={startAnimations ? 'visible' : 'hidden'}
              >
                <motion.h1
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
                >
                  Fresh from Farmers,
                  <br />
                  Straight to You
                </motion.h1>

                <motion.p
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="text-xl md:text-2xl mb-8 text-green-100"
                >
                  Supporting local farmers while bringing you the freshest organic produce
                </motion.p>

                <motion.div
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <Link
                    to="/products"
                    className="inline-flex items-center space-x-2 bg-white text-green-600 px-8 py-4 rounded-full font-semibold hover:bg-green-50 transform hover:scale-105 transition-all shadow-lg"
                  >
                    <ShoppingBagIcon className="h-5 w-5" />
                    <span>Shop Now</span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Right: Trust/Quote card */}
    <motion.aside
              initial={{ opacity: 0, x: 40 }}
              animate={startAnimations ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              className="order-2 lg:order-2 w-full max-w-sm mx-auto lg:ml-auto"
            >
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-white/40 to-transparent blur-md" />
                <div className="relative rounded-3xl border border-white/30 bg-white/90 text-green-800 shadow-2xl p-6">
      <p className="text-2xl font-extrabold tracking-tight">
                    Trusted by 5000+ people
                  </p>
                  <p className="mt-1 text-sm text-green-700/80">
                    Farm‑fresh goodness loved by our community.
                  </p>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      

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
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full"
            />
          </div>
        ) : effectiveProducts && Array.isArray(effectiveProducts) && effectiveProducts.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {effectiveProducts.map(product => (
              <motion.div key={product._id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 text-gray-600">No products to show.</div>
        )}
      </section>
    </div>
  );
}
