'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { ProtectedRoute } from './protected-route';

export function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-100 text-slate-900">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 md:py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}