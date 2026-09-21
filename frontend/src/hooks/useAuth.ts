import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { login as apiLogin, register as apiRegister } from '@/api/bookingApi';
import type { User } from '@/types/index';

const TOKEN_KEY = 'rb_token';
const USER_KEY = 'rb_user';

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): { token: string | null; user: User | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    return { token, user: raw ? (JSON.parse(raw) as User) : null };
  } catch {
    return { token: null, user: null };
  }
}

function persist(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState(readStoredAuth);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiLogin(email.trim(), password);
      persist(data.token, data.user);
      setAuth({ token: data.token, user: data.user });
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    try {
      await apiRegister({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
      });
      // Backend register returns no token, so log in right away.
      const session = await apiLogin(data.email.trim(), data.password);
      persist(session.token, session.user);
      setAuth({ token: session.token, user: session.user });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ token: null, user: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth.user,
      token: auth.token,
      loading,
      isAuthenticated: auth.token !== null && auth.user !== null,
      login,
      register,
      logout,
    }),
    [auth, loading, login, register, logout],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
