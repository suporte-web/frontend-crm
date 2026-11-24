import { GlobalFeedback } from '@/components/ui/global-feedback';
import { AuthProvider } from '@/context/auth-context';
import { UserProvider } from '@/UserContext';
import { ThemeProvider } from '@/context/theme-context';
import { AppVersionProvider } from '@/context/app-version-context';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <AppVersionProvider>
            {children}
            <GlobalFeedback />
          </AppVersionProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
