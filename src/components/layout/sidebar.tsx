'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  FileText,
  Handshake,
  History,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  PackageSearch,
  Ticket,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  appScreens,
  isScreenEnabledForRole,
  type ScreenKey,
} from '@/config/screens';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const screenIcons: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  entregas: Truck,
  trackings: PackageSearch,
  quotes: FileText,
  clients: Building2,
  leads: UserPlus,
  entradas: Inbox,
  tickets: Ticket,
  chat: MessageCircle,
  suppliers: Handshake,
  users: Users,
  marketing: Megaphone,
  logs: History,
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredMenu = appScreens.filter((item) =>
    isScreenEnabledForRole(item, user?.role, user?.screenPermissions),
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-950/10 bg-[linear-gradient(180deg,#343434_0%,#2b2b2b_46%,#1f1f1f_100%)] text-slate-100"
    >
      <SidebarHeader className="relative overflow-hidden border-b border-white/8 bg-transparent px-3 py-4">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#ec3139]/25 blur-3xl" />

        <div className="relative flex items-center gap-3 rounded-[22px] px-1 py-1 group-data-[collapsible=icon]:justify-center">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ec3139_0%,#fab519_100%)] text-sm font-black text-white shadow-[0_16px_30px_rgba(236,49,57,0.26)]">
            <span className="absolute inset-0 rounded-2xl bg-white/10" />
            <span className="relative">P</span>
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#fab519]">
              CRM Portal
            </p>

            <h2 className="truncate text-lg font-bold leading-tight text-white">
              Pizzattolog
            </h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-2.5 py-4">
        <div className="px-2 pb-3 group-data-[collapsible=icon]:hidden">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Navegacao
          </p>
        </div>

        <SidebarMenu className="space-y-1">
          {filteredMenu.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = screenIcons[item.key];
            const label =
              item.href === '/dashboard' && user?.role === 'CLIENTE'
                ? 'Canal do Cliente'
                : item.label;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={label}
                  className="group/menu-button relative h-[50px] overflow-hidden rounded-[18px] px-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.06] hover:text-white data-[active=true]:bg-white data-[active=true]:text-slate-950 data-[active=true]:shadow-[0_16px_34px_rgba(15,23,42,0.28)] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                >
                  <Link href={item.href}>
                    {active ? (
                      <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#ec3139] group-data-[collapsible=icon]:hidden" />
                    ) : null}

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/[0.07] text-slate-300 ring-1 ring-white/[0.04] transition group-hover/menu-button:bg-white/[0.10] group-hover/menu-button:text-white group-data-[active=true]/menu-button:bg-[#fff7df] group-data-[active=true]/menu-button:text-[#ec3139] group-data-[active=true]/menu-button:ring-[#fab519]/40">
                      <Icon className="h-4.5 w-4.5" />
                    </span>

                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      {label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/8 bg-transparent px-3 py-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="rounded-[20px] bg-white/[0.035] px-3.5 py-3 ring-1 ring-white/8">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Ambiente
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-slate-200">
                  CRM Workspace
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/15">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.75)]" />
                Online
              </span>
            </div>
          </div>
        </div>

        <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/15">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.85)]" />
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
