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
    label: 'Cotações',
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
    label: 'Usuários',
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
    GESTAO: 'Gestão',
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
    <Sidebar collapsible="icon" className="border-r border-slate-200/80 bg-transparent">
      <SidebarHeader className="border-b border-slate-200/80 bg-white/72 px-3 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-sm font-bold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)]">
            {getInitials(user?.name)}
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600">
              CRM Portal
            </p>
            <h2 className="truncate text-lg font-bold text-slate-950">
              Pizzattolog
            </h2>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/90 p-4 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-semibold text-slate-950">
            {user?.name ?? '-'}
          </p>
          <p className="mt-1 text-sm text-slate-500">{getRoleLabel(user?.role)}</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white/72 px-2 py-4 backdrop-blur-xl">
        <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Navegação
          </p>
        </div>

        <SidebarMenu>
          {filteredMenu.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.label}
                  className="h-[52px] rounded-[20px] text-sm font-medium text-slate-500 transition-all duration-200 data-[active=true]:bg-slate-950 data-[active=true]:text-white data-[active=true]:shadow-[0_16px_30px_rgba(15,23,42,0.16)] hover:bg-slate-100 hover:text-slate-950 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
                >
                  <Link href={item.href}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition group-data-[active=true]/menu-button:bg-white/12 group-data-[active=true]/menu-button:text-white group-hover/menu-button:bg-white group-hover/menu-button:text-slate-950">
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

      <SidebarFooter className="border-t border-slate-200/80 bg-white/72 px-3 py-4 backdrop-blur-xl">
        <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
            Ambiente
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Desenvolvimento</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Online
            </span>
          </div>
        </div>

        <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-sky-700">
            ON
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
