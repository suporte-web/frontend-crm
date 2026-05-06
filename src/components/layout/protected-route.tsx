'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

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
    }
  }, [loading, pathname, token, user?.mustChangePassword, router]);

  if (loading) {
    return <p style={{ padding: 24 }}>Carregando...</p>;
  }

  if (!token) {
    return null;
  }

  if (user?.mustChangePassword && pathname !== '/change-password') {
    return null;
  }

  return <>{children}</>;
}
