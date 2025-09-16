/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { User } from '../types';
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  getProfile,
  googleAuth,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
} from '../services/api';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  initializing: boolean;
  avatarUrl: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; phone?: string; address?: string; latitude?: number; longitude?: number; }) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<{ needsProfileCompletion?: boolean } | undefined>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (payload: { token: string; newPassword: string; email?: string }) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeGooglePicture(idToken: string): string | null {
  try {
    const parts = idToken.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const pic = payload?.picture as string | undefined;
    return pic || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const isAuthenticated = !!user && !!localStorage.getItem('token');

  const resolveApiBase = () => {
    // Mirror api.ts API_URL logic for assets
    const env: Record<string, unknown> = (import.meta as unknown as { env?: Record<string, unknown> }).env || {};
    const isDev = Boolean(env.DEV);
    const viteApi = typeof env.VITE_API_URL === 'string' ? (env.VITE_API_URL as string) : undefined;
    const base = isDev ? '/api' : (viteApi || '/api');
    return String(base || '/api');
  };

  const normalizeAvatarUrl = useCallback((raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const url = String(raw).trim();
    if (!url) return null;
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url; // absolute or data URI
    const apiBase = resolveApiBase().replace(/\/$/, '');
    if (url.startsWith('/')) return `${apiBase}${url}`;
    // handle bare paths like 'uploads/avatars/x.jpg'
    return `${apiBase}/${url}`;
  }, []);

  const setAndPersistAvatar = useCallback((url: string | null) => {
    const normalized = normalizeAvatarUrl(url);
    setAvatarUrl(normalized);
    if (normalized) localStorage.setItem('avatarUrl', normalized);
    else localStorage.removeItem('avatarUrl');
  }, [normalizeAvatarUrl]);

  const getAvatarFromUser = useCallback((u: Partial<User> | null | undefined): string | null => {
    if (!u) return null;
    // Prefer 'picture' over 'avatarUrl' as requested
    const pic = (u as unknown as { picture?: string })?.picture || (u as unknown as { avatarUrl?: string })?.avatarUrl || null;
    return pic || null;
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
  const storedAvatar = localStorage.getItem('avatarUrl');
  if (storedAvatar) setAvatarUrl(storedAvatar);
    if (!token) {
      setInitializing(false);
      return;
    }
    (async () => {
      try {
        const res = await getProfile();
  const u = (res.data as User) || null;
  setUser(u);
  const pic = getAvatarFromUser(u);
  if (pic) setAndPersistAvatar(pic);
  } catch (err) {
        // Token invalid: clear it
        localStorage.removeItem('token');
        setUser(null);
        setAndPersistAvatar(null);
      } finally {
        setInitializing(false);
      }
    })();
  }, [setAndPersistAvatar, getAvatarFromUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const data = res.data as { token?: string; user?: User };
    if (data?.token) localStorage.setItem('token', data.token);
    if (data?.user) setUser(data.user);
    const pic = getAvatarFromUser(data?.user);
    if (pic) setAndPersistAvatar(pic);
    // Fetch fresh profile to ensure avatar and details are up-to-date
    try {
      const prof = await getProfile();
      const u = (prof.data as User) || null;
      if (u) setUser(u);
      const p2 = getAvatarFromUser(u);
      if (p2) setAndPersistAvatar(p2);
    } catch {
      // ignore, user already set from login response
    }
  }, [setAndPersistAvatar, getAvatarFromUser]);

  const signup = useCallback(async (payload: { name: string; email: string; password: string; phone?: string; address?: string; latitude?: number; longitude?: number; }) => {
    const res = await apiSignup(payload);
    const data = res.data as { token?: string; user?: User };
    if (data?.token) localStorage.setItem('token', data.token);
    if (data?.user) setUser(data.user);
    const pic = getAvatarFromUser(data?.user);
    if (pic) setAndPersistAvatar(pic);
    // Fetch fresh profile after signup to hydrate all fields
    try {
      const prof = await getProfile();
      const u = (prof.data as User) || null;
      if (u) setUser(u);
      const p2 = getAvatarFromUser(u);
      if (p2) setAndPersistAvatar(p2);
    } catch {
      // ignore
    }
  }, [setAndPersistAvatar, getAvatarFromUser]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    setUser(null);
    setAndPersistAvatar(null);
  }, [setAndPersistAvatar]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    // Set avatar early if picture claim present
    const claimed = decodeGooglePicture(idToken);
    if (claimed) setAndPersistAvatar(claimed);
    const res = await googleAuth(idToken);
    const data = res.data as { token?: string; user?: User; needsProfileCompletion?: boolean };
    if (data?.token) localStorage.setItem('token', data.token);
    if (data?.user) setUser(data.user);
    const pic = getAvatarFromUser(data?.user) || claimed || null;
    if (pic) setAndPersistAvatar(pic);
    // Fetch fresh profile after Google login as well
    try {
      const prof = await getProfile();
      const u = (prof.data as User) || null;
      if (u) setUser(u);
      const p2 = getAvatarFromUser(u);
      if (p2) setAndPersistAvatar(p2);
    } catch {
      // ignore
    }
    return { needsProfileCompletion: !!data?.needsProfileCompletion };
  }, [setAndPersistAvatar, getAvatarFromUser]);

  const forgotPassword = useCallback(async (email: string) => {
    await apiForgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (payload: { token: string; newPassword: string; email?: string }) => {
    await apiResetPassword(payload);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await getProfile();
      const u = (res.data as User) || null;
      setUser(u);
      const pic = getAvatarFromUser(u);
      if (pic) setAndPersistAvatar(pic);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        setUser(null);
        setAndPersistAvatar(null);
      }
    }
  }, [setAndPersistAvatar, getAvatarFromUser]);

  const value: AuthContextType = useMemo(() => ({
    user,
    isAuthenticated,
    initializing,
    avatarUrl,
    login,
    signup,
    logout,
    loginWithGoogle,
    forgotPassword,
    resetPassword,
    refreshProfile,
  }), [user, isAuthenticated, initializing, avatarUrl, login, signup, logout, loginWithGoogle, forgotPassword, resetPassword, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

