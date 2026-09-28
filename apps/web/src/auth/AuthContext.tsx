import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { apiFetch, clearSession, getStoredUser, getToken, setSession } from '../api/client';

export type Role = 'REQUESTER' | 'MANAGER' | 'FINANCE' | 'ADMIN';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  initials: string;
  department: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>());
  const [token, setToken] = useState<string | null>(() => getToken());

  const login = async (email: string, password: string) => {
    const result = await apiFetch<{ accessToken: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setSession(result.accessToken, result.user);
    setToken(result.accessToken);
    setUser(result.user);
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
