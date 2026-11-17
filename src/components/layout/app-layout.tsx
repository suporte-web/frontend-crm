import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FloatingHelpAssistant } from "@/components/help-center/floating-help-assistant";
import { Header } from "./header";
import { AppSidebar } from "./sidebar";
import Container from "@mui/material/Container";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen className="flex-col">
        <Header />

        <div className="flex w-full flex-1">
          <AppSidebar />

          <SidebarInset className="relative min-w-0 min-h-[calc(100svh-72px)] bg-[#f6f7f9]">
            <main className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
              <Container
                maxWidth={false}
                disableGutters
                className="crm-app-surface px-4 py-5 md:px-6 md:py-6 xl:px-7"
                sx={{ maxWidth: 1580, minWidth: 0 }}
              >
                {children}
              </Container>
              <FloatingHelpAssistant />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
