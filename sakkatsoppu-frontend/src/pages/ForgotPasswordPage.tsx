import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { forgotPassword } = useAuth();
  // resetPassword retained in context for future dedicated reset page

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await forgotPassword(email);
      setMessage('If this email exists, a reset link has been sent. Check your inbox.');
    } catch (err) {
      setMessage('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-md w-full bg-white p-8 rounded-2xl shadow">
        <div className="flex flex-col items-center mb-4">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white overflow-hidden shadow mb-2">
            <img src={new URL('../../logo_final.jpg', import.meta.url).href} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
          <p className="text-sm text-gray-600">Enter your account email to receive a password reset link.</p>
        </div>

        {message && <div className="bg-green-50 text-green-700 p-3 rounded mb-4">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Account Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Enter your email to receive a password reset link.</p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-gray-600">Remembered your password? <Link to="/login" className="text-green-600">Sign in</Link></p>
      </motion.div>
    </div>
  );
}
