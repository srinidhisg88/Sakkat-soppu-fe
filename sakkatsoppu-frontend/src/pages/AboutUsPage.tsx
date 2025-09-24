import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartIcon,
  SparklesIcon,
  TruckIcon,
  UsersIcon,
  ShieldCheckIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

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
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

const AboutUsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-500 text-white py-20"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            About Sakkat Soppu
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto"
          >
            Connecting you directly with local farmers for the freshest, most sustainable produce
          </motion.p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="space-y-16"
        >

          {/* Mission Section */}
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Our Mission
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
                At Sakkat Soppu, we believe in creating a sustainable food ecosystem that benefits everyone.
                We're bridging the gap between local farmers and conscious consumers, ensuring fair prices
                for farmers while delivering exceptional quality to your doorstep.
              </p>
            </div>
          </motion.div>

          {/* What We Offer */}
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
              What We Offer
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-xl shadow-lg p-6 text-center"
              >
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BeakerIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Fresh Organic Produce</h3>
                <p className="text-gray-600">
                  Handpicked vegetables and greens sourced directly from local organic farms,
                  ensuring maximum freshness and nutritional value.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-xl shadow-lg p-6 text-center"
              >
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <TruckIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Reliable Delivery</h3>
                <p className="text-gray-600">
                  Convenient doorstep delivery on Sundays and Mondays, timed perfectly
                  to bring you the freshest produce when you need it most.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-xl shadow-lg p-6 text-center"
              >
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Farmer Support</h3>
                <p className="text-gray-600">
                  Supporting over 50 local farmers with fair pricing and sustainable practices,
                  building stronger communities through ethical agriculture.
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Why Choose Us */}
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
              Why Choose Sakkat Soppu?
            </h2>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                      <SparklesIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Quality</h3>
                      <p className="text-gray-700">
                        Every product undergoes strict quality checks to ensure you receive
                        only the best organic produce available.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                      <HeartIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Focused</h3>
                      <p className="text-gray-700">
                        Nutrient-rich, pesticide-free vegetables that support your healthy lifestyle
                        and contribute to better overall wellness.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                      <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Sustainable Practices</h3>
                      <p className="text-gray-700">
                        Committed to eco-friendly farming methods that protect our environment
                        and promote long-term agricultural sustainability.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 rounded-full p-2 flex-shrink-0">
                      <UsersIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Driven</h3>
                      <p className="text-gray-700">
                        Building stronger local communities by connecting consumers directly
                        with farmers and supporting regional agriculture.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            variants={itemVariants}
            className="text-center bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 md:p-12 text-white"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Join Our Community
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Experience the difference that fresh, local, organic produce can make in your life.
              Start your journey towards healthier eating today.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Shop Now
              <motion.div
                whileHover={{ x: 5 }}
                className="ml-2"
              >
                →
              </motion.div>
            </Link>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

export default AboutUsPage;