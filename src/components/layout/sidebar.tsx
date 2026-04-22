'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

type MenuItem = {
  href: string;
  label: string;
  icon: string;
  roles: Array<'ADMIN' | 'GESTAO' | 'COMERCIAL' | 'MARKETING' | 'CLIENTE'>;
};

const menuItems: MenuItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: '▦',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
  },
  {
    href: '/trackings',
    label: 'Rastreamento',
    icon: '◌',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CLIENTE'],
  },
  {
    href: '/quotes',
    label: 'Cotações',
    icon: '◫',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: '◎',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'],
  },
  {
    href: '/tickets',
    label: 'Tickets',
    icon: '◈',
    roles: ['ADMIN', 'GESTAO', 'COMERCIAL', 'CLIENTE'],
  },
  {
    href: '/users',
    label: 'Usuários',
    icon: '◍',
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

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredMenu = menuItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false,
  );

  return (
    <aside className="flex min-h-screen w-[280px] flex-col border-r border-slate-800 bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-950/30">
            {getInitials(user?.name)}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              CRM Portal
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">
              Painel interno
            </h2>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <p className="text-sm font-semibold text-white">{user?.name ?? '-'}</p>
          <p className="mt-1 text-sm text-slate-400">
            {getRoleLabel(user?.role)}
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Navegação
        </p>

        <nav className="mt-4 grid gap-2">
          {filteredMenu.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm transition ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 px-6 py-5">
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Ambiente
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              Desenvolvimento
            </span>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              Online
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}