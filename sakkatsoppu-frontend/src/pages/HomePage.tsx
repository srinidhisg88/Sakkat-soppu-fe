import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/api';
import { products as dummyProducts } from '../constants/dummyData';
import { ProductCard } from '../components/ProductCard';
import {
  ShoppingBagIcon,
  SparklesIcon,
  TruckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';


const features = [
  {
    icon: <SparklesIcon className="h-6 w-6" />,
    title: "Fresh & Organic",
    description: "100% organic produce from local farms"
  },
  {
    icon: <TruckIcon className="h-6 w-6" />,
    title: "Fast Delivery",
    description: "Same day delivery to your doorstep"
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

export function HomePage() {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await getProducts();
      return response.data;
    },
  });

  const effectiveProducts = (!isLoading && products && products.length > 0) ? products : (dummyProducts as unknown as Product[]);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-r from-green-600 to-green-400 text-white py-24 px-4 rounded-3xl mx-4 overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-[url('/pattern.svg')] bg-center"
        />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            Fresh from Farmers,
            <br />
            Straight to You
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl md:text-2xl mb-8 text-green-100"
          >
            Supporting local farmers while bringing you the freshest organic produce
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Link
              to="/products"
              className="inline-flex items-center space-x-2 bg-white text-green-600 px-8 py-4 rounded-full font-semibold hover:bg-green-50 transform hover:scale-105 transition-all shadow-lg"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              <span>Shop Now</span>
            </Link>
          </motion.div>
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
        ) : (
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
        )}
      </section>
    </div>
  );
}
