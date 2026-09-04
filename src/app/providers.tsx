'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
