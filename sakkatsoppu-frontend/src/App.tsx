import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import SplashScreen from './components/SplashScreen';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { FarmerProfilePage } from './pages/FarmerProfilePage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { ToastProvider } from './components/ToastProvider';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

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
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
          <Router>
            <div className="min-h-screen bg-cream-100 relative">
              {/* Always render app; splash overlays with a circular reveal */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <ScrollToTop />
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<HomePage startAnimations={splashDone} />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Protected routes */}
                    <Route
                      path="/farmers/:id"
                      element={
                        <RequireAuth>
                          <FarmerProfilePage />
                        </RequireAuth>
                      }
                    />
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
                </main>
                <Footer />
              </motion.div>

              {!splashDone && (
                <SplashScreen duration={1200} onFinish={() => setSplashDone(true)} />
              )}
            </div>
          </Router>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
