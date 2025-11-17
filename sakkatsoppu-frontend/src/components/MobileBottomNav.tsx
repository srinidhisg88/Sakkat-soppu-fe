import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, Squares2X2Icon, ShoppingCartIcon, UserIcon, ClipboardDocumentListIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, Squares2X2Icon as Squares2X2IconSolid, ShoppingCartIcon as ShoppingCartIconSolid, UserIcon as UserIconSolid, ClipboardDocumentListIcon as ClipboardDocumentListIconSolid, ArrowRightOnRectangleIcon as ArrowRightOnRectangleIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export function MobileBottomNav() {
  const location = useLocation();
  const { uniqueItems } = useCart();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = isAuthenticated ? [
    {
      path: '/',
      label: 'Home',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      path: '/categories/all',
      label: 'Categories',
      icon: Squares2X2Icon,
      activeIcon: Squares2X2IconSolid,
    },
    {
      path: '/cart',
      label: 'Cart',
      icon: ShoppingCartIcon,
      activeIcon: ShoppingCartIconSolid,
      badge: uniqueItems > 0 ? uniqueItems : undefined,
    },
    {
      path: '/orders',
      label: 'Orders',
      icon: ClipboardDocumentListIcon,
      activeIcon: ClipboardDocumentListIconSolid,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: UserIcon,
      activeIcon: UserIconSolid,
    },
  ] : [
    {
      path: '/',
      label: 'Home',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      path: '/categories/all',
      label: 'Categories',
      icon: Squares2X2Icon,
      activeIcon: Squares2X2IconSolid,
    },
    {
      path: '/cart',
      label: 'Cart',
      icon: ShoppingCartIcon,
      activeIcon: ShoppingCartIconSolid,
      badge: uniqueItems > 0 ? uniqueItems : undefined,
    },
    {
      path: '/orders',
      label: 'Orders',
      icon: ClipboardDocumentListIcon,
      activeIcon: ClipboardDocumentListIconSolid,
    },
    {
      path: '/login',
      label: 'Login',
      icon: ArrowRightOnRectangleIcon,
      activeIcon: ArrowRightOnRectangleIconSolid,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors relative ${
                active ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-green-600' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
