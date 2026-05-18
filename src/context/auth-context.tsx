'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, LoginResponse } from '@/types/auth';

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<LoginResponse>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_user';
const API_BASE_URL = 'http://localhost:3001/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  async function refreshUser() {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);

    if (!activeToken) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`,
      },
    });

    const data = (await response.json()) as AuthUser | { message?: string };

    if (!response.ok) {
      throw new Error(
        (data as { message?: string }).message || 'Erro ao atualizar usuário',
      );
    }

    const updatedUser = data as AuthUser;

    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

    return updatedUser;
  }

  async function signIn(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as
      | LoginResponse
      | { message?: string };

    if (!response.ok) {
      throw new Error(
        (data as { message?: string }).message || 'Erro ao fazer login',
      );
    }

    const loginData = data as LoginResponse;

    setToken(loginData.access_token);
    setUser(loginData.user);

    localStorage.setItem(TOKEN_KEY, loginData.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(loginData.user));

    return loginData;
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!token) {
      throw new Error('Sessao expirada. Faca login novamente.');
    }

    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = (await response.json()) as
      | { user: AuthUser; message?: string }
      | { message?: string };

    if (!response.ok) {
      throw new Error(
        (data as { message?: string }).message || 'Erro ao alterar senha',
      );
    }

    const updatedUser = (data as { user: AuthUser }).user;

    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
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
      changePassword,
      refreshUser,
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
