import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import type { AuthUser } from '@/types/auth';
import type { Dispatch, SetStateAction } from 'react';

interface UserContextProps {
  user: AuthUser | null;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  token: string | null;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

// Compartilha a sessão do login e do Api; não mantém um segundo token.
export function UserProvider({ children }: { children: ReactNode }) {
  const { user, setUser, token, loading, signOut, refreshUser } = useAuth();
  const logout = useCallback(() => {
    signOut();
    window.location.replace('/');
  }, [signOut]);
  const value = useMemo(() => ({
    user, setUser, token, isLoading: loading, logout, refreshUser,
  }), [user, setUser, token, loading, logout, refreshUser]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextProps {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser deve ser usado dentro de um UserProvider');
  return context;
}
