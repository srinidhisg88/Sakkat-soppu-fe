import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => Promise<void>;
  resetPassword?: (email: string, newPassword: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user profile
      api.getProfile()
        .then(response => setUser(response.data))
        .catch(() => {
          // If token is invalid, clear everything
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    const response = await api.signup(userData);
    const { token: newToken, user: newUser } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const resetPassword = async (email: string, newPassword: string) => {
    if (typeof api.resetPassword === 'function') {
      await api.resetPassword(email, newPassword);
    } else {
      // dev fallback: pretend it worked
      console.log('resetPassword called (dev)', { email, newPassword });
      return Promise.resolve();
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        signup, 
        resetPassword,
        logout, 
        isAuthenticated: !!token 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
