'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { appScreens, isScreenEnabledForRole } from '@/config/screens';
import type { RoleScreenPermission, UserRole } from '@/types/auth';

function canAccessRoute(
  pathname: string,
  role?: UserRole,
  permissions?: RoleScreenPermission[],
) {
  if (!role || pathname === '/change-password') {
    return true;
  }

  const route = appScreens.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return route ? isScreenEnabledForRole(route, role, permissions) : true;
}

function getDefaultRoute(
  role?: UserRole,
  permissions?: RoleScreenPermission[],
) {
  return (
    appScreens.find((screen) =>
      isScreenEnabledForRole(screen, role, permissions),
    )?.href ?? '/change-password'
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/login');
      return;
    }

    if (
      !loading &&
      token &&
      user?.mustChangePassword &&
      pathname !== '/change-password'
    ) {
      router.replace('/change-password');
      return;
    }

    if (
      !loading &&
      token &&
      !canAccessRoute(pathname, user?.role, user?.screenPermissions)
    ) {
      router.replace(getDefaultRoute(user?.role, user?.screenPermissions));
    }
  }, [
    loading,
    pathname,
    token,
    user?.mustChangePassword,
    user?.role,
    user?.screenPermissions,
    router,
  ]);

  if (loading) {
    return <p style={{ padding: 24 }}>Carregando...</p>;
  }

  if (!token) {
    return null;
  }

  if (user?.mustChangePassword && pathname !== '/change-password') {
    return null;
  }

  if (!canAccessRoute(pathname, user?.role, user?.screenPermissions)) {
    return null;
  }

  return <>{children}</>;
}
