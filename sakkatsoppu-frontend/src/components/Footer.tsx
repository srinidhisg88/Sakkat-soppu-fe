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
                <a
                  href="https://wa.me/919980761856?text=Hi!%20I%20would%20like%20to%20order%20from%20Sakkat%20Soppu."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="select-text">Call or WhatsApp: +91 99807 61856</span>
                </a>
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
