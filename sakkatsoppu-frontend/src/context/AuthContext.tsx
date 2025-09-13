/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/api';
import { User, AuthResponse } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  initializing: boolean;
  avatarUrl: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<{ needsProfileCompletion: boolean } | void>;
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Helper to keep avatar persisted across refreshes
  const setAndPersistAvatar = (url: string | null) => {
    setAvatarUrl(url);
    if (url) {
      try { localStorage.setItem('avatarUrl', url); } catch { /* ignore */ }
    } else {
      try { localStorage.removeItem('avatarUrl'); } catch { /* ignore */ }
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    // Hydrate avatar from localStorage early to avoid flicker on reload
    const storedAvatar = localStorage.getItem('avatarUrl');
    if (storedAvatar) setAvatarUrl(storedAvatar);
    if (storedToken) {
      setToken(storedToken);
      api.getProfile()
        .then(response => {
          setUser(response.data);
          const anyData = response.data as unknown as Record<string, unknown>;
          const pic = (anyData?.avatarUrl as string) || (anyData?.picture as string) || null;
          if (pic) setAndPersistAvatar(pic);
        })
        .catch((err) => {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            setAndPersistAvatar(null);
          }
        })
        .finally(() => setInitializing(false));
    } else {
      api.getProfile()
        .then(response => {
          setUser(response.data);
          const anyData = response.data as unknown as Record<string, unknown>;
          const pic = (anyData?.avatarUrl as string) || (anyData?.picture as string) || null;
          if (pic) setAndPersistAvatar(pic);
        })
        .catch(() => {
          setUser(null);
          setAndPersistAvatar(null);
        })
        .finally(() => setInitializing(false));
    }
  }, []);

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
          setAndPersistAvatar(null);
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
    const anyData = res.data as unknown as Record<string, unknown>;
    const pic = (anyData?.avatarUrl as string) || (anyData?.picture as string) || avatarUrl || null;
  if (pic) setAndPersistAvatar(pic);
  };

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    const { token: newToken, user: userData } = response.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    try {
      const prof = await api.getProfile();
      setUser(prof.data);
      const anyData = prof.data as unknown as Record<string, unknown>;
      const pic = (anyData?.avatarUrl as string) || (anyData?.picture as string) || null;
  if (pic) setAndPersistAvatar(pic);
    } catch {
      setUser(userData);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await api.googleAuth(idToken);
    const { token: newToken, user: userData, needsProfileCompletion } = res.data as Partial<AuthResponse> & { needsProfileCompletion?: boolean };
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      const pic: string | undefined = payload?.picture;
  if (pic) setAndPersistAvatar(pic);
    } catch {
      // ignore decode errors
    }
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }
    try {
      const prof = await api.getProfile();
      setUser(prof.data);
      const anyData = prof.data as unknown as Record<string, unknown>;
      const pic = (anyData?.avatarUrl as string) || (anyData?.picture as string) || avatarUrl || null;
  if (pic) setAndPersistAvatar(pic);
    } catch {
      if (userData) setUser(userData);
    }
    return { needsProfileCompletion: !!needsProfileCompletion };
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
    if (newToken) {
      try {
        const prof = await api.getProfile();
        setUser(prof.data);
        const anyData = prof.data as unknown as Record<string, unknown>;
        const pic = (anyData?.avatarUrl as string) || (anyData?.picture as string) || null;
  setAndPersistAvatar(pic || null);
        return;
      } catch {
        // ignore profile fetch errors; fallback user state will be used
      }
    }
    if (newUser) setUser(newUser);
  };

  const logout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  setAndPersistAvatar(null);
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
        avatarUrl,
        login,
        loginWithGoogle,
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
