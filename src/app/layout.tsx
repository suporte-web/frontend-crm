import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'CRM Portal',
  description: 'Portal comercial multi-cliente',
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
