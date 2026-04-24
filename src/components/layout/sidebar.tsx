'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  FileText,
  History,
  LayoutDashboard,
  Megaphone,
  PackageSearch,
  Ticket,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
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

type UserRole = 'ADMIN' | 'GESTAO' | 'COMERCIAL' | 'MARKETING' | 'CLIENTE';

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
};

const menuItems: MenuItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    href: '/trackings',
    label: 'Rastreamento',
    icon: PackageSearch,
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    href: '/quotes',
    label: 'Cotacoes',
    icon: FileText,
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: Building2,
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: UserPlus,
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
  },
  {
    href: '/tickets',
    label: 'Tickets',
    icon: Ticket,
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    href: '/users',
    label: 'Usuarios',
    icon: Users,
    roles: ['ADMIN', 'GESTAO'],
  },
  {
    href: '/marketing',
    label: 'Marketing',
    icon: Megaphone,
    roles: ['ADMIN', 'GESTAO', 'MARKETING'],
  },
  {
    href: '/logs',
    label: 'Logs',
    icon: History,
    roles: ['ADMIN', 'GESTAO'],
  },
];

function getRoleLabel(role?: string) {
  if (!role) return '-';

  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    GESTAO: 'Gestao',
    COMERCIAL: 'Comercial',
    MARKETING: 'Marketing',
    CLIENTE: 'Cliente',
  };

  return labels[role] ?? role;
}

function getInitials(name?: string) {
  if (!name) return 'CP';

  const parts = name.trim().split(' ').filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredMenu = menuItems.filter((item) =>
    user?.role ? item.roles.includes(user.role as UserRole) : false,
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-900/5 bg-[linear-gradient(180deg,#0f172a_0%,#111c33_42%,#16213a_100%)] text-slate-100"
    >
      <SidebarHeader className="border-b border-white/8 bg-transparent px-3 py-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#38bdf8_100%)] text-sm font-bold text-white shadow-[0_16px_30px_rgba(37,99,235,0.28)]">
            {getInitials(user?.name)}
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/90">
              CRM Portal
            </p>
            <h2 className="truncate text-lg font-bold text-white">Pizzattolog</h2>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-white/10 bg-white/6 p-4 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-semibold text-white">{user?.name ?? '-'}</p>
          <p className="mt-1 text-sm text-slate-300">{getRoleLabel(user?.role)}</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-2 py-4">
        <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Navegacao
          </p>
        </div>

        <SidebarMenu>
          {filteredMenu.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                  className="h-[54px] rounded-[20px] text-sm font-medium text-slate-300 transition-all duration-200 data-[active=true]:bg-white data-[active=true]:text-slate-950 data-[active=true]:shadow-[0_14px_28px_rgba(15,23,42,0.22)] hover:bg-white/8 hover:text-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                >
                  <Link href={item.href}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-slate-300 transition group-data-[active=true]/menu-button:bg-slate-100 group-data-[active=true]/menu-button:text-slate-950 group-hover/menu-button:bg-white/14 group-hover/menu-button:text-white">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/8 bg-transparent px-3 py-4">
        <div className="rounded-[24px] border border-white/10 bg-white/6 p-4 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Ambiente</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-200">CRM Workspace</span>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              Online
            </span>
          </div>
        </div>

        <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-xs font-semibold text-sky-200">
            ON
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
