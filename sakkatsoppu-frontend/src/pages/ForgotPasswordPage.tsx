import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (typeof resetPassword === 'function') {
        await resetPassword(email, password);
        setMessage('Password updated. You can now log in with your new password.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        // Fallback: no reset function implemented in AuthContext during dev
        console.log('Reset password', { email, password });
        setMessage('Password updated (dev-mode).');
        setTimeout(() => navigate('/login'), 1200);
      }
    } catch (err) {
      setMessage('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-md w-full bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
        <p className="text-sm text-gray-600 mb-6">Enter your account email and a new password.</p>

        {message && <div className="bg-green-50 text-green-700 p-3 rounded mb-4">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">New password</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div>
            <button type="submit" disabled={loading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-gray-600">Remembered your password? <Link to="/login" className="text-green-600">Sign in</Link></p>
      </motion.div>
    </div>
  );
}
