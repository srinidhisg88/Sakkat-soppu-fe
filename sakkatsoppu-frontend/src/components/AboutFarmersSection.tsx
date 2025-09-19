import { Link } from 'react-router-dom';
import { UserGroupIcon, HandThumbUpIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function AboutFarmersSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-white border border-green-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-800 border border-green-200 text-sm font-medium">
              <UserGroupIcon className="h-4 w-4" />
              About our farmers
            </div>
            <h2 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">
              Grown with care, delivered with trust
            </h2>
            <p className="mt-2 text-gray-600">
              We’re a community of passionate farmers who believe in honest, sustainable farming.
              Every harvest is handled with care so you get the freshest produce every week.
            </p>

            <ul className="mt-6 space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <span>Transparent sourcing directly from local farms</span>
              </li>
              <li className="flex items-start gap-3">
                <HandThumbUpIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <span>Quality-first practices, minimal handling</span>
              </li>
              <li className="flex items-start gap-3">
                <SparklesIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <span>Fresh picks on a reliable weekly schedule</span>
              </li>
            </ul>

            <div className="mt-8">
              <Link
                to="/farmers"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 shadow"
              >
                Meet our farmers
              </Link>
            </div>
          </div>

          <div className="block bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            <div className="h-full w-full p-4 md:p-6 flex items-center justify-center">
              {/* Organic product design (no external image) */}
              <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden">
                {/* soft gradient and glow accents */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100" />
                <div className="absolute -top-10 -left-10 w-56 h-56 bg-green-300/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-amber-300/20 rounded-full blur-2xl" />

                {/* dotted grid overlay */}
                <div className="absolute inset-0 [background-image:radial-gradient(theme(colors.green.200)_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

                {/* content: organic chips/badges */}
                <div className="relative z-10 h-full w-full p-3 md:p-4 grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-3 place-items-center">
                  <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-green-100 shadow-sm text-sm text-green-900 flex items-center gap-2 will-change-transform animate-float-fade" style={{ animationDelay: '0ms' }}>
                    🥬 <span>Leafy Greens</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-green-100 shadow-sm text-sm text-green-900 flex items-center gap-2 will-change-transform animate-float-fade" style={{ animationDelay: '100ms' }}>
                    🥕 <span>Root Veggies</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-green-100 shadow-sm text-sm text-green-900 flex items-center gap-2 will-change-transform animate-float-fade" style={{ animationDelay: '200ms' }}>
                    🥭 <span>Seasonal Fruits</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-green-100 shadow-sm text-sm text-green-900 flex items-center gap-2 will-change-transform animate-float-fade" style={{ animationDelay: '300ms' }}>
                    🌾 <span>Millets & Grains</span>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-green-600 text-white shadow-md text-sm font-semibold will-change-transform animate-float-fade" style={{ animationDelay: '400ms' }}>
                    100% Organic
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-green-100 shadow-sm text-sm text-green-900 flex items-center gap-2 will-change-transform animate-float-fade" style={{ animationDelay: '500ms' }}>
                    🥛 <span>A2 Dairy</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-green-100 shadow-sm text-sm text-green-900 flex items-center gap-2 will-change-transform animate-float-fade" style={{ animationDelay: '600ms' }}>
                    🫒 <span>Cold-pressed Oils</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-green-100 shadow-sm text-sm text-green-900 flex items-center gap-2 will-change-transform animate-float-fade" style={{ animationDelay: '700ms' }}>
                    🌿 <span>Herbs & Spices</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur border border-green-100 shadow-sm text-sm text-green-900 flex items-center gap-2 will-change-transform animate-float-fade" style={{ animationDelay: '800ms' }}>
                    🍯 <span>Honey & Jaggery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
