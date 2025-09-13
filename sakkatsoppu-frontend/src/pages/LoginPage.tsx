import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation as useGeoLocation } from '../hooks/useLocation';
import { isWithinMysore } from '../utils/geo';
// Resolve logo via bundler so it’s included in the build
const authLogo = new URL('../../logo_final.jpg', import.meta.url).href;
import {
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

type RouteState = { from?: { pathname?: string } } | null;

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
  const { getLocation } = useGeoLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      // Attempt geolocation; if available and outside service area, block
      try {
        const coords = await getLocation();
        if (coords && !isWithinMysore(coords.latitude, coords.longitude)) {
          setError("Sorry, the service isn't available in your city right now.");
          return;
        }
      } catch {
        // If user denies or unavailable, proceed without blocking
      }
      await login(email, password);
      // Navigate to the page the user was trying to access, or home
  const state = (location.state as RouteState) || null;
  const from = state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
    }
  };

  // Google Identity Services
  useEffect(() => {
  const clientId = googleClientId;
  if (!clientId) return;
    // Load GIS script
    const id = 'google-identity';
    if (!document.getElementById(id)) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.id = id;
      document.body.appendChild(s);
      s.onload = initGoogle;
    } else {
      initGoogle();
    }

    function initGoogle() {
      // @ts-expect-error GIS global
      if (!window.google || !google.accounts || !google.accounts.id) return;
      // @ts-expect-error GIS global
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          const idToken = response.credential;
          if (!idToken) return;
          try {
            setError('');
            // Attempt geolocation; block if outside service area
            try {
              const coords = await getLocation();
              if (coords && !isWithinMysore(coords.latitude, coords.longitude)) {
                setError("Sorry, the service isn't available in your city right now.");
                return;
              }
            } catch {
              // Continue if not available
            }
            const result = await loginWithGoogle(idToken);
            const needs = result && 'needsProfileCompletion' in result ? result.needsProfileCompletion : false;
            if (needs) {
              navigate('/profile', { replace: true, state: { promptComplete: true } });
            } else {
              const state = (location.state as RouteState) || null;
              const from = state?.from?.pathname || '/';
              navigate(from, { replace: true });
            }
          } catch (err) {
            setError('Google sign-in failed. Please try again.');
          }
        },
        ux_mode: 'popup',
      });
      if (googleBtnRef.current) {
        // @ts-expect-error GIS global
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          width: 320,
          text: 'continue_with',
        });
      }
      // One Tap prompt (non-blocking)
      try {
        // @ts-expect-error GIS global
        google.accounts.id.prompt();
      } catch {
        // ignore
      }
    }
  }, [loginWithGoogle, navigate, location.state, googleClientId, getLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl"
      >
        <div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white overflow-hidden shadow"
          >
            <img src={authLogo} alt="Logo" className="w-full h-full object-contain" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-center text-3xl font-extrabold text-gray-900"
          >
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-center text-sm text-gray-600"
          >
            Sign in to access fresh produce from local farmers
          </motion.p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center space-x-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-green-500 group-hover:text-green-400" />
              </span>
              Sign in
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="text-sm">
              <Link
                to="/signup"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Create an account
              </Link>
            </div>
          </motion.div>
        </motion.form>

        {/* Google Button */}
        <div className="relative">
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-3 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>
          {googleClientId ? (
            <div ref={googleBtnRef} className="flex justify-center" style={{ minHeight: 44 }} />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled
                className="w-full max-w-xs flex items-center justify-center gap-2 rounded-full bg-blue-600 text-white px-4 py-3 opacity-70 cursor-not-allowed"
                title="Google sign-in unavailable"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 31.7 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.6 5.1 29.6 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21 21-9.3 21-21c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.2 16.5 18.7 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C34.6 5.1 29.6 3 24 3 16 3 9 7.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.3l-6.3-5.3C29.1 35.5 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C8.7 40.6 15.8 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.1 5.2-5.7 6.8l.1.1 6.3 5.3c-.4.3 7 5 7 5 4.1-3.8 6.5-9.4 6.5-15.9 0-1.2-.1-2.3-.4-3.5z"/></svg>
                Continue with Google
              </button>
              <p className="text-xs text-gray-500">Set VITE_GOOGLE_CLIENT_ID to enable</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
