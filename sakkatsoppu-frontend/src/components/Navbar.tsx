import { motion } from 'framer-motion';
import { useState } from 'react';
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
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export function Navbar() {
  const { isAuthenticated, user, logout, avatarUrl } = useAuth();
  const { uniqueItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Resolve logo file path via Vite's asset handling
  const legacyLogoUrl = new URL('../../logo.jpeg', import.meta.url).href;
  const logoFinalUrl = new URL('../../logo_final.jpg', import.meta.url).href;

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
        <div className="flex justify-between items-center h-16 gap-2">
          <Link to="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="w-12 h-12 rounded-full overflow-hidden bg-white shadow"
            >
              <img
                src={logoFinalUrl}
                alt="Sakkat Soppu logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = legacyLogoUrl;
                }}
              />
            </motion.div>
            <motion.span 
              className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              Sakkat Soppu
            </motion.span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-3 sm:space-x-4 md:space-x-6">
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

            {/** Farmers link hidden for now **/}
            {/**
            <motion.div
              variants={navItemVariants}
              whileHover="hover"
              className="relative group"
            >
              <Link to="/farmers" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                <UserGroupIcon className="h-5 w-5 text-green-600" />
                <span>Farmers</span>
              </Link>
            </motion.div>
            {/**/}

            {/* Cart - visible for all users */}
            <motion.div
              variants={navItemVariants}
              whileHover="hover"
              className="relative group"
            >
        <Link to="/cart" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                <div className="relative">
                  <ShoppingCartIcon className="h-5 w-5 text-green-600" />
          {uniqueItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center"
                    >
            {uniqueItems}
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

            {/* Support removed from navbar per requirement */}

            {isAuthenticated ? (
              <>
                <motion.div
                  variants={navItemVariants}
                  whileHover="hover"
                  className="relative group"
                >
                  <Link to="/profile" className="flex items-center space-x-2 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user?.name || 'Profile'} className="h-6 w-6 rounded-full object-cover border border-green-200" />
                    ) : (
                      <UserCircleIcon className="h-5 w-5 text-green-600" />
                    )}
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

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg hover:bg-green-50"
            >
              {mobileOpen ? (
                <XMarkIcon className="h-6 w-6 text-green-700" />
              ) : (
                <Bars3Icon className="h-6 w-6 text-green-700" />
              )}
            </button>
          </div>
        </div>
        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="md:hidden pb-3">
            <div className="pt-2 space-y-1">
              <Link onClick={() => setMobileOpen(false)} to="/" className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-50">
                <HomeIcon className="h-5 w-5 text-green-600" />
                <span>Home</span>
              </Link>
              <Link onClick={() => setMobileOpen(false)} to="/products" className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-50">
                <ShoppingBagIcon className="h-5 w-5 text-green-600" />
                <span>Products</span>
              </Link>
              <Link onClick={() => setMobileOpen(false)} to="/orders" className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-50">
                <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
                <span>Orders</span>
              </Link>
              {/** Farmers link hidden for now (mobile) **/}
              {/**
              <Link onClick={() => setMobileOpen(false)} to="/farmers" className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-50">
                <UserGroupIcon className="h-5 w-5 text-green-600" />
                <span>Farmers</span>
              </Link>
              **/}
              {/* Support removed from mobile menu per requirement */}
              <Link onClick={() => setMobileOpen(false)} to="/cart" className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-50">
                <div className="relative">
                  <ShoppingCartIcon className="h-5 w-5 text-green-600" />
                  {uniqueItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{uniqueItems}</span>
                  )}
                </div>
                <span>Cart</span>
              </Link>
              {isAuthenticated ? (
                <div className="pt-2 border-t">
                  <Link onClick={() => setMobileOpen(false)} to="/profile" className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-50">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user?.name || 'Profile'} className="h-6 w-6 rounded-full object-cover border border-green-200" />
                    ) : (
                      <UserCircleIcon className="h-5 w-5 text-green-600" />
                    )}
                    <span>{user?.name}</span>
                  </Link>
                  <button onClick={() => { setMobileOpen(false); logout(); }} className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-red-600 hover:bg-red-50">
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t grid grid-cols-2 gap-2">
                  <Link onClick={() => setMobileOpen(false)} to="/login" className="py-2 px-3 bg-green-600 text-white rounded-lg text-center">Login</Link>
                  <Link onClick={() => setMobileOpen(false)} to="/signup" className="py-2 px-3 border-2 border-green-600 text-green-600 rounded-lg text-center">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
