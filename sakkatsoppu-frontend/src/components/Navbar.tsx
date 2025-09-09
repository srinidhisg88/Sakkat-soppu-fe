import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();

  const navItemVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="bg-white text-gray-800 shadow-lg sticky top-0 z-50"
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="text-2xl"
            >
              🌿
            </motion.div>
            <motion.span 
              className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              Sakkat Soppu
            </motion.span>
          </Link>

          <div className="flex items-center space-x-6">
            <motion.div
              variants={navItemVariants}
              whileHover="hover"
              className="relative group"
            >
              <Link to="/" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                <HomeIcon className="h-5 w-5 text-green-600" />
                <span>Home</span>
              </Link>
            </motion.div>

            <motion.div
              variants={navItemVariants}
              whileHover="hover"
              className="relative group"
            >
              <Link to="/products" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                <ShoppingBagIcon className="h-5 w-5 text-green-600" />
                <span>Products</span>
              </Link>
            </motion.div>

            {/* Cart - visible for all users */}
            <motion.div
              variants={navItemVariants}
              whileHover="hover"
              className="relative group"
            >
              <Link to="/cart" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                <div className="relative">
                  <ShoppingCartIcon className="h-5 w-5 text-green-600" />
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </div>
                <span>Cart</span>
              </Link>
            </motion.div>

            {/* Orders - visible for all users (shows local or remote) */}
            <motion.div
              variants={navItemVariants}
              whileHover="hover"
              className="relative group"
            >
              <Link to="/orders" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                <span>Orders</span>
              </Link>
            </motion.div>

            {isAuthenticated ? (
              <>
                <motion.div
                  variants={navItemVariants}
                  whileHover="hover"
                  className="relative group"
                >
                  <Link to="/profile" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                    <UserCircleIcon className="h-5 w-5 text-green-600" />
                    <span>{user?.name}</span>
                  </Link>
                </motion.div>

                <motion.button
                  variants={navItemVariants}
                  whileHover="hover"
                  onClick={logout}
                  className="flex items-center space-x-1 py-2 px-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Logout</span>
                </motion.button>
              </>
            ) : (
              <>
                <motion.div
                  variants={navItemVariants}
                  whileHover="hover"
                >
                  <Link to="/login" className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Login
                  </Link>
                </motion.div>

                <motion.div
                  variants={navItemVariants}
                  whileHover="hover"
                >
                  <Link to="/signup" className="py-2 px-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
