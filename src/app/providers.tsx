'use client';

import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-context';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
