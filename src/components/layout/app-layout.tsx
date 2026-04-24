'use client';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from './header';
import { ProtectedRoute } from './protected-route';
import { AppSidebar } from './sidebar';

export function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider defaultOpen>
          <AppSidebar />

          <SidebarInset className="relative min-h-screen bg-transparent">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-48 bg-[linear-gradient(180deg,rgba(15,23,42,0.03)_0%,transparent_100%)]" />
            <Header />

            <main className="relative flex-1 overflow-x-hidden overflow-y-auto">
              <div className="mx-auto w-full max-w-[1580px] px-4 py-5 md:px-6 md:py-6 xl:px-7">
                {children}
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </ProtectedRoute>
  );
}
