'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { podeAcessarRota } from '@/config/screens';
import { getRotaInicial } from '@/lib/rota-inicial';
import type { RoleScreenPermission, UserRole } from '@/types/auth';


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/entrar');
      return;
    }

    if (
      !loading &&
      token &&
      user?.mustChangePassword &&
      pathname !== '/alterar-senha'
    ) {
      router.replace('/alterar-senha');
      return;
    }

    if (
      !loading &&
      token &&
      !podeAcessarRota(pathname, user?.roles?.length ? user.roles : user?.role, user?.screenPermissions)
    ) {
      router.replace(getRotaInicial(user));
    }
  }, [
    loading,
    pathname,
    token,
    user?.mustChangePassword,
    user?.role,
    user?.roles,
    user?.screenPermissions,
    router,
  ]);

  if (loading) {
    return <p style={{ padding: 24 }}>Carregando...</p>;
  }

  if (!token) {
    return null;
  }

  if (user?.mustChangePassword && pathname !== '/alterar-senha') {
    return null;
  }

  if (!podeAcessarRota(pathname, user?.roles?.length ? user.roles : user?.role, user?.screenPermissions)) {
    return null;
  }

  return <>{children}</>;
}
