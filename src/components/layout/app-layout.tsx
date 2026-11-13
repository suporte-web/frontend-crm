"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageTopProvider } from "./page-top";
import { Header } from "./header";
import { ProtectedRoute } from "./protected-route";
import { AppSidebar } from "./sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <TooltipProvider delayDuration={0}>
        <PageTopProvider>
        <SidebarProvider defaultOpen className="flex-col">
          <Header />

          <div className="flex w-full min-w-0 flex-1">
            <AppSidebar />

            <SidebarInset style={{ minWidth: 0, flex: "1 1 0%", width: 0 }} className="relative min-w-0 w-0 flex-1 min-h-[calc(100svh-84px)] bg-[#f6f7f9]">
              <main className="relative flex-1 overflow-x-hidden overflow-y-auto">
                <div className="crm-app-surface mx-auto w-full max-w-395 px-4 py-5 md:px-6 md:py-6 xl:px-7">
                  {children}
                </div>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
        </PageTopProvider>
      </TooltipProvider>
    </ProtectedRoute>
  );
}
