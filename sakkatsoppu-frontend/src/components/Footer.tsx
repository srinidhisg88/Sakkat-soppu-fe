import { Link } from 'react-router-dom';
import { usePoliciesModal } from './PoliciesModalContext';

export default function Footer() {
  const policies = usePoliciesModal();
  const legacyLogoUrl = new URL('../../logo.jpeg', import.meta.url).href;
  const logoFinalUrl = new URL('../../logo_final.jpg', import.meta.url).href;
  return (
    <footer className="bg-white border-t mt-2 sm:mt-4">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-white shadow">
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
              </div>
              <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                Sakkat Soppu
              </span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">
              Fresh, local produce delivered in Mysore.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-1 sm:mb-2">Quick Links</h4>
            <nav className="grid gap-1 text-sm">
              <Link to="/">Home</Link>
              <Link to="/products">Products</Link>
              <Link to="/orders">Orders</Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-1 sm:mb-2">Support</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <span className="inline-flex items-center gap-2 text-gray-700 select-text">
                  Email: sakkatsoppu@gmail.com
                </span>
              </li>
              <li>
                <span className="inline-flex items-center gap-2 text-gray-700 select-text">
                  Phone: +91 99807 61856
                </span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => policies.open()}
                  className="inline-flex items-center gap-2 text-gray-700 select-text hover:text-green-700 focus:outline-none"
                  style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                >
                  Policies
                </button>
              </li>
            </ul>
          </div>
        </div>

  <div className="border-t mt-3 sm:mt-4 pt-2 sm:pt-3 text-[10px] sm:text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <p>© {new Date().getFullYear()} Sakkat Soppu. All rights reserved.</p>
          <p>
            Built with ❤️ for Mysore | <a className="hover:text-green-700" href="/">Home</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
