import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import {
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export function Navbar() {
  const { isAuthenticated, user, logout, avatarUrl } = useAuth();
  const { uniqueItems } = useCart();
  const { t } = useLanguage();

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
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-16 gap-1 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white shadow"
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
                className="text-sm sm:text-base md:text-xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
              >
                Sakkat Soppu Online
              </motion.span>
            </Link>

            {/* WhatsApp Link */}
            <a
              href="https://wa.me/919980761856?text=Hi!%20I%20would%20like%20to%20order%20from%20Sakkat%20Soppu."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-sm border border-green-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span className="whitespace-nowrap">Call or text on WhatsApp</span>
            </a>
          </div>

          {/* Mobile: Show WhatsApp, About Us and Login/Logout */}
          <div className="md:hidden flex items-center gap-1">
            <a
              href="https://wa.me/919980761856?text=Hi!%20I%20would%20like%20to%20order%20from%20Sakkat%20Soppu."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center py-2 px-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
            <Link to="/about" className="flex items-center py-2 px-2 rounded-lg hover:bg-green-50 transition-colors">
              <InformationCircleIcon className="h-5 w-5 text-green-600" />
            </Link>
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="flex items-center py-2 px-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            ) : (
              <Link to="/login" className="py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs">
                {t('nav.login')}
              </Link>
            )}
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-3 sm:space-x-4 md:space-x-6">
            <motion.div
              variants={navItemVariants}
              whileHover="hover"
              className="relative group"
            >
              <Link to="/" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                <HomeIcon className="h-5 w-5 text-green-600" />
                <span>{t('nav.home')}</span>
              </Link>
            </motion.div>

            <motion.div
              variants={navItemVariants}
              whileHover="hover"
              className="relative group"
            >
              <Link to="/categories/all" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                <ShoppingBagIcon className="h-5 w-5 text-green-600" />
                <span>{t('nav.products')}</span>
              </Link>
            </motion.div>

            <motion.div
              variants={navItemVariants}
              whileHover="hover"
              className="relative group"
            >
              <Link to="/about" className="flex items-center space-x-1 py-2 px-3 rounded-lg group-hover:bg-green-50 transition-colors">
                <InformationCircleIcon className="h-5 w-5 text-green-600" />
                <span>{t('nav.aboutUs')}</span>
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
                <span>{t('nav.cart')}</span>
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
                <span>{t('nav.orders')}</span>
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
                  <span>{t('nav.logout')}</span>
                </motion.button>
              </>
            ) : (
              <>
                <motion.div
                  variants={navItemVariants}
                  whileHover="hover"
                >
                  <Link to="/login" className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    {t('nav.login')}
                  </Link>
                </motion.div>

                <motion.div
                  variants={navItemVariants}
                  whileHover="hover"
                >
                  <Link to="/signup" className="py-2 px-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
                    {t('nav.signup')}
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
