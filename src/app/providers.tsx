import { GlobalFeedback } from '@/components/ui/global-feedback';
import { AuthProvider } from '@/context/auth-context';
import { UserProvider } from '@/UserContext';
import { ThemeProvider } from '@/context/theme-context';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          {children}
          <GlobalFeedback />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
