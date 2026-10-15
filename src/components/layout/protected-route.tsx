'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { appScreens, isScreenEnabledForRole, podeAcessarRota } from '@/config/screens';
import type { RoleScreenPermission, UserRole } from '@/types/auth';


function getDefaultRoute(
  role?: UserRole | UserRole[],
  permissions?: RoleScreenPermission[],
) {
  return (
    appScreens.find((screen) =>
      isScreenEnabledForRole(screen, role, permissions),
    )?.href ?? '/alterar-senha'
  );
}

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
      router.replace(getDefaultRoute(user?.roles?.length ? user.roles : user?.role, user?.screenPermissions));
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
