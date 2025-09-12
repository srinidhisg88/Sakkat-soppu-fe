/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/api';
import { User, AuthResponse } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (payload: { token: string; newPassword: string; email?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user profile
      api.getProfile()
        .then(response => setUser(response.data))
        .catch((err) => {
          // If token invalid (401/403), clear. Otherwise keep token and remain logged in.
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => setInitializing(false));
    } else {
      // Try cookie-based session fetch
      api.getProfile()
        .then(response => setUser(response.data))
        .catch(() => {
          setUser(null);
        })
        .finally(() => setInitializing(false));
    }
  }, []);

  // Install a response interceptor to auto-logout on 401/403
  useEffect(() => {
    const id = apiClient.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error?.response?.status;
        const reqUrl: string = error?.config?.url || '';
        const protectedPrefixes = ['/users', '/cart', '/orders', '/auth'];
        const isProtected = protectedPrefixes.some((p) => reqUrl.startsWith(p));
        if (isProtected && (status === 401 || status === 403)) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => {
      apiClient.interceptors.response.eject(id);
    };
  }, []);

  const refreshProfile = async () => {
    const res = await api.getProfile();
    setUser(res.data);
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Immediately fetch full profile to ensure address/phone are populated
    try {
      const prof = await api.getProfile();
      setUser(prof.data);
    } catch {
      // Fallback to user from login response if profile fetch fails
      setUser(userData);
    }
  };

  const signup = async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => {
  const response = await api.signup(userData);
  const { token: newToken, user: newUser } = response.data as Partial<AuthResponse>;
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }
    // Fetch profile after signup if token present; else fallback to returned user
    if (newToken) {
      try {
        const prof = await api.getProfile();
        setUser(prof.data);
        return;
      } catch {
        // ignore, fallback below
      }
    }
    if (newUser) setUser(newUser);
  };

  const logout = () => {
    // Attempt backend logout to clear cookie
    api.logout().catch(() => {});
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    await api.forgotPassword(email);
  };

  const resetPassword = async (payload: { token: string; newPassword: string; email?: string }) => {
    await api.resetPassword(payload);
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        token,
  initializing,
        login,
        signup,
        forgotPassword,
        resetPassword,
        logout,
  refreshProfile,
        isAuthenticated: !!token || !!user,
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
