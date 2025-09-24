import { motion } from 'framer-motion';
import React from 'react';

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
            className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6"
          >
            About Sakkat Soppu
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl md:text-2xl opacity-90 max-w-3xl mx-auto px-4"
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

          {/* Our Story */}
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Our Story
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                Sakkath Soppu is a Mysore-based farmers' collective that started in 2022 with a simple vision – to connect farmers directly with families and bring back trust, freshness, and honesty into our food system.
              </p>
            </div>
          </motion.div>

          {/* Our Growth */}
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
              Our Growth
            </h2>
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex justify-center order-2 md:order-1"
              >
                <img
                  src="/sakkat_soppu.jpeg"
                  alt="Sakkat Soppu - Fresh Organic Produce"
                  className="w-full max-w-md h-auto rounded-2xl shadow-lg object-cover"
                />
              </motion.div>
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 order-1 md:order-2">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  What began as a small offline initiative with just 5 farmers has today grown into a strong network of 50+ organic farmers, all committed to delivering fresh, chemical-free produce straight from their fields.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Our Community */}
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Our Community
            </h2>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
                In this journey, Sakkath Soppu has built a customer base of 5,000+ households, with 300–500 people visiting the weekly farmers' sante (market) to pick up seasonal fruits, vegetables, greens, and other farm products freshly harvested for them.
              </p>
            </div>
          </motion.div>

          {/* Our Impact */}
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
              Our Impact
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
                By choosing Sakkath Soppu, you not only bring the best of nature to your plate but also support a sustainable ecosystem where farmers are fairly rewarded, middlemen are eliminated, and customers can shop with complete confidence in the source of their food.
              </p>
            </div>
          </motion.div>

          {/* Going Online */}
          <motion.div variants={itemVariants} className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Going Online
            </h2>
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 md:p-12 text-white">
              <p className="text-lg md:text-xl opacity-90 leading-relaxed max-w-4xl mx-auto">
                And now, with Sakkath Soppu going online, this trusted farmers' market experience is being extended right to your doorstep, making it easier than ever to access farm-fresh, local, and organic produce with just a few clicks.
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
};

export default AboutUsPage;