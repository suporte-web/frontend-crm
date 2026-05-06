'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

type UserRole = 'ADMIN' | 'GESTAO' | 'COMERCIAL' | 'MARKETING' | 'CLIENTE';

const routeRoles: Array<{ prefix: string; roles: UserRole[] }> = [
  {
    prefix: '/dashboard',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    prefix: '/entregas',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
  },
  {
    prefix: '/trackings',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    prefix: '/quotes',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    prefix: '/clients',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
  },
  {
    prefix: '/leads',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
  },
  {
    prefix: '/entradas',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL'],
  },
  {
    prefix: '/tickets',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    prefix: '/chat',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    prefix: '/suppliers',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL'],
  },
  {
    prefix: '/users',
    roles: ['ADMIN', 'GESTAO'],
  },
  {
    prefix: '/marketing',
    roles: ['ADMIN', 'GESTAO', 'MARKETING'],
  },
  {
    prefix: '/logs',
    roles: ['ADMIN', 'GESTAO'],
  },
];

function canAccessRoute(pathname: string, role?: UserRole) {
  if (!role || pathname === '/change-password') {
    return true;
  }

  const route = routeRoles.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );

  return route ? route.roles.includes(role) : true;
}

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/login');
      return;
    }

    if (!loading && token && user?.mustChangePassword && pathname !== '/change-password') {
      router.replace('/change-password');
      return;
    }

    if (!loading && token && !canAccessRoute(pathname, user?.role)) {
      router.replace('/dashboard');
    }
  }, [loading, pathname, token, user?.mustChangePassword, user?.role, router]);

  if (loading) {
    return <p style={{ padding: 24 }}>Carregando...</p>;
  }

  if (!token) {
    return null;
  }

  if (user?.mustChangePassword && pathname !== '/change-password') {
    return null;
  }

  if (!canAccessRoute(pathname, user?.role)) {
    return null;
  }

  return <>{children}</>;
}
