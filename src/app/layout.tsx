import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'CRM',
  description: 'Sistema comercial',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}