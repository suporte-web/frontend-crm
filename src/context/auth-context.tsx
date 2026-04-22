'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type UserRole =
  | 'ADMIN'
  | 'GESTAO'
  | 'COMERCIAL'
  | 'MARKETING'
  | 'CLIENTE';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clientProfile?: unknown | null;
};

type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_user';
const API_BASE_URL = 'http://localhost:3001/api';

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser));

    setLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as LoginResponse | { message?: string };

    if (!response.ok) {
      throw new Error((data as { message?: string }).message || 'Erro ao fazer login');
    }

    const loginData = data as LoginResponse;

    setToken(loginData.access_token);
    setUser(loginData.user);

    localStorage.setItem(TOKEN_KEY, loginData.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(loginData.user));
  }

  function signOut() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signIn,
      signOut,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}