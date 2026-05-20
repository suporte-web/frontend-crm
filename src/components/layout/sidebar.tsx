'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ChartSpline,
  CircleHelp,
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
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  appScreens,
  isScreenEnabledForRole,
  type ScreenKey,
} from '@/config/screens';
import { getNotifications } from '@/services/notifications.service';
import type { CrmNotification } from '@/types/notifications';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const screenIcons: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  bi: ChartSpline,
  entregas: Truck,
  trackings: PackageSearch,
  quotes: FileText,
  clients: Building2,
  leads: UserPlus,
  entradas: Inbox,
  tickets: Ticket,
  helpCenter: CircleHelp,
  chat: MessageCircle,
  suppliers: Handshake,
  users: Users,
  marketing: Megaphone,
  logs: History,
};

function isUnreadChatNotification(notification: CrmNotification) {
  if (notification.readAt) return false;

  const type = String(notification.metadata?.type ?? '').toUpperCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();

  return type === 'CHAT_MESSAGE' || text.includes('chat') || text.includes('mensagem');
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, token } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const filteredMenu = appScreens.filter((item) =>
    isScreenEnabledForRole(item, user?.role, user?.screenPermissions),
  );
  const chatBadgeLabel = useMemo(
    () => (unreadChatCount > 9 ? '9+' : String(unreadChatCount)),
    [unreadChatCount],
  );

  useEffect(() => {
    if (!token) {
      setUnreadChatCount(0);
      return;
    }

    let active = true;
    const authToken = token;

    async function loadChatNotifications() {
      const notifications = await getNotifications(authToken);
      if (!active) return;
      setUnreadChatCount(notifications.filter(isUnreadChatNotification).length);
    }

    loadChatNotifications().catch(() => undefined);

    const interval = window.setInterval(() => {
      loadChatNotifications().catch(() => undefined);
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [token, pathname]);

  return (
    <Sidebar
      collapsible="icon"
      className="!top-[94px] !h-[calc(100svh-94px)] border-r border-black/20 bg-[linear-gradient(180deg,#343434_0%,#2d2d2d_48%,#242424_100%)] text-slate-100"
    >
      <SidebarHeader className="border-b border-white/8 bg-transparent px-2 py-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <SidebarTrigger className="h-12 w-14 rounded-md bg-[#ec3139] text-white shadow-[0_10px_22px_rgba(236,49,57,0.22)] transition hover:bg-[#d82931] group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-14" />

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fab519]">
              CRM Portal
            </p>

            <h2 className="truncate text-base font-bold leading-tight text-white">
              Pizzattolog
            </h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-2 py-3">
        <SidebarMenu className="space-y-2">
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
                  className="group/menu-button relative h-11 overflow-visible rounded-md px-2 text-sm font-medium text-white/78 transition-all duration-200 hover:bg-white/[0.08] hover:text-white data-[active=true]:bg-white data-[active=true]:text-[#343434] data-[active=true]:shadow-[0_12px_22px_rgba(0,0,0,0.18)] group-data-[collapsible=icon]:h-11! group-data-[collapsible=icon]:w-14! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0!"
                >
                  <Link href={item.href}>
                    {active ? (
                      <span className="absolute -right-2 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-l-full bg-[#fab519] group-data-[collapsible=icon]:block" />
                    ) : null}

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-transparent text-white/82 transition group-hover/menu-button:text-white group-data-[active=true]/menu-button:text-[#ec3139]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>

                    {item.key === 'chat' && unreadChatCount > 0 ? (
                      <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ec3139] px-1 text-[10px] font-black leading-none text-white ring-2 ring-[#fab519] group-data-[collapsible=icon]:right-1 group-data-[collapsible=icon]:top-0">
                        {chatBadgeLabel}
                      </span>
                    ) : null}

                    <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
                      {label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
