import { ApiError } from '@/utils/Api';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { requestCurrentUser, requestLogin, requestChangePassword } from '@/stores/login/service';
import { AUTH_SESSION_EXPIRED_EVENT, TOKEN_KEY, USER_KEY } from '@/utils/constants';
import type { AuthUser, LoginResponse } from '@/types/auth';

type AuthContextType = {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
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

class AuthSessionExpiredError extends Error {}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    const storedUser = sessionStorage.getItem(USER_KEY);

    // Limpa dados persistentes da autenticação antiga
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      }
    }

    setLoading(false);
  }, []);



  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    async function syncStoredUser() {
      try {
        const updatedUser = await refreshUser();

        if (!active || !updatedUser) {
          return;
        }
      } catch (error) {
        if (active && error instanceof AuthSessionExpiredError) {
          signOut();
        }
      }
    }

    syncStoredUser();

    return () => {
      active = false;
    };
  }, [token]);

  const refreshUser = useCallback(async () => {
    const activeToken = token || sessionStorage.getItem(TOKEN_KEY);
    if (!activeToken) return null;
    try {
      const updatedUser = await requestCurrentUser(activeToken);
      if (sessionStorage.getItem(TOKEN_KEY) !== activeToken) return null;
      setUser(updatedUser);
      sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new AuthSessionExpiredError('Sessao expirada. Faca login novamente.');
      }
      throw error;
    }
  }, [token]);

  async function signIn(email: string, password: string) {
    const loginData = await requestLogin(email, password);
    setToken(loginData.access_token);
    setUser(loginData.user);
    sessionStorage.setItem(TOKEN_KEY, loginData.access_token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(loginData.user));
    return loginData;
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!token) throw new Error('Sessao expirada. Faca login novamente.');
    const { user: updatedUser } = await requestChangePassword(currentPassword, newPassword, token);
    setUser(updatedUser);
    sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

  }, []);
  

useEffect(() => {
  if (!token) return;

  const TEMPO_INATIVIDADE = 15 * 60 * 1000;

  let timeout: ReturnType<typeof setTimeout>;

  const encerrarSessao = () => {
    signOut();
    window.location.replace('/entrar');
  };

  const reiniciarContador = () => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      encerrarSessao();
    }, TEMPO_INATIVIDADE);
  };

  const eventos = [
    'mousedown',
    'pointermove',
    'keydown',
    'touchstart',
    'scroll',
  ];

  eventos.forEach((evento) => {
    window.addEventListener(evento, reiniciarContador, true);
  });

  reiniciarContador();

  return () => {
    clearTimeout(timeout);

    eventos.forEach((evento) => {
      window.removeEventListener(evento, reiniciarContador, true);
    });
  };
}, [token]);

  

  useEffect(() => {
    const onExpired = () => signOut();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
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
