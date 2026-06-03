"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FloatingHelpAssistant } from "@/components/help-center/floating-help-assistant";
import { Header } from "./header";
import { ProtectedRoute } from "./protected-route";
import { AppSidebar } from "./sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider defaultOpen className="flex-col">
          <Header />

          <div className="flex w-full flex-1">
            <AppSidebar />

            <SidebarInset className="relative min-h-[calc(100svh-72px)] bg-transparent">
              <main className="relative flex-1 overflow-x-hidden overflow-y-auto">
                <div className="crm-app-surface mx-auto w-full max-w-[1580px] px-4 py-5 md:px-6 md:py-6 xl:px-7">
                  {children}
                </div>
                <FloatingHelpAssistant />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </ProtectedRoute>
  );
}
