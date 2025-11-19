import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import SplashScreen from './components/SplashScreen';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';

// Lazy load all pages for better performance
const HomePage = lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(module => ({ default: module.ProductsPage })));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage').then(module => ({ default: module.ProductDetailsPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(module => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(module => ({ default: module.OrdersPage })));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(module => ({ default: module.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then(module => ({ default: module.CategoryPage })));

import { ToastProvider } from './components/ToastProvider';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { AddToCartBarProvider } from './components/AddToCartBarProvider';
import { StockProvider } from './context/StockContext';
import LiveCartReconciler from './components/LiveCartReconciler';
import { PoliciesModalProvider } from './components/PoliciesModalProvider';
import { MobileBottomNav } from './components/MobileBottomNav';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
            <Router>
            <AddToCartBarProvider>
            <StockProvider>
            <PoliciesModalProvider whatsappNumber={'+91 9980761856'}>
            <div className="min-h-screen relative">
              {/* Always render app; splash overlays with a circular reveal */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <ScrollToTop />
                {/* Global stock subscription + cart reconcile, active on all pages */}
                <LiveCartReconciler />
                <Navbar />
                <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
                  <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                  }>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<HomePage startAnimations={splashDone} />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/categories/:categoryId" element={<CategoryPage />} />
                      <Route path="/about" element={<AboutUsPage />} />
                      {/** Farmers routes disabled for now **/}
                      {/** <Route path="/farmers" element={<FarmersPage />} /> **/}
                      {/** <Route path="/farmers/:id" element={<FarmerProfilePage />} /> **/}
                      <Route path="/products/:id" element={<ProductDetailsPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />

                      {/* Protected routes */}
                      <Route
                        path="/cart"
                        element={
                          <RequireAuth>
                            <CartPage />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="/checkout"
                        element={
                          <RequireAuth>
                            <CheckoutPage />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <RequireAuth>
                            <OrdersPage />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="/orders/:id"
                        element={
                          <RequireAuth>
                            <OrderDetailsPage />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <RequireAuth>
                            <ProfilePage />
                          </RequireAuth>
                        }
                      />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <MobileBottomNav />
              </motion.div>

              {!splashDone && (
                <SplashScreen duration={1200} onFinish={() => setSplashDone(true)} />
              )}
            </div>
            </PoliciesModalProvider>
            </StockProvider>
            </AddToCartBarProvider>
          </Router>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
