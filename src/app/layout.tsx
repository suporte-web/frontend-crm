import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CRM - Pizzattolog',
  description: 'Portal de relacionamento e gestão Pizzattolog.',
  icons: {
    icon: { url: '/favicon.png', type: 'image/png' },
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body><Providers>{children}</Providers></body></html>;
}
