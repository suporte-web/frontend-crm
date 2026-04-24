'use client';

import { Bell, Command, LogOut, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SidebarTrigger } from '@/components/ui/sidebar';

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/trackings')) return 'Rastreamento';
  if (pathname.startsWith('/quotes')) return 'Cotações';
  if (pathname.startsWith('/clients')) return 'Clientes';
  if (pathname.startsWith('/tickets')) return 'Tickets';
  if (pathname.startsWith('/users')) return 'Usuários';

  return 'Painel interno';
}

function getPageDescription(pathname: string) {
  if (pathname.startsWith('/dashboard')) {
    return 'Visão rápida da operação e dos clientes.';
  }

  if (pathname.startsWith('/trackings')) {
    return 'Consultas e entregas em um só fluxo.';
  }

  if (pathname.startsWith('/quotes')) {
    return 'Propostas comerciais com status claro.';
  }

  if (pathname.startsWith('/clients')) {
    return 'Base de clientes organizada por contexto.';
  }

  if (pathname.startsWith('/tickets')) {
    return 'Atendimento e SLA com leitura direta.';
  }

  if (pathname.startsWith('/users')) {
    return 'Perfis e permissões do portal.';
  }

  return 'Acompanhe as informações do portal.';
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const pageTitle = getPageTitle(pathname);
  const pageDescription = getPageDescription(pathname);
  const userInitials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'US';

  function handleSignOut() {
    signOut();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 md:px-6 md:pt-5">
      <div className="flex min-h-[76px] items-center justify-between gap-4 rounded-[26px] border border-white/70 bg-white/78 px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50" />

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-950 md:text-xl">
              {pageTitle}
            </h1>
            <p className="truncate text-sm text-slate-500">{pageDescription}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            Buscar cliente, ticket ou cotação
            <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-400">
              <Command className="mr-1 inline h-3 w-3" />
              K
            </span>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="text-right">
            <p className="text-sm font-semibold text-slate-950">
              {user?.name ?? 'Usuário'}
            </p>
            <p className="text-xs text-slate-500">{user?.email ?? 'Sem e-mail'}</p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(37,99,235,0.24)]">
            {userInitials}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
