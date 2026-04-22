'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

function getPageTitle(pathname: string) {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/trackings': 'Rastreamento',
    '/quotes': 'Cotações',
    '/clients': 'Clientes',
    '/tickets': 'Tickets',
    '/users': 'Usuários',
  };

  return titles[pathname] ?? 'Portal CRM';
}

function getPageDescription(pathname: string) {
  const descriptions: Record<string, string> = {
    '/dashboard': 'Visão geral do sistema e módulos principais.',
    '/trackings': 'Acompanhe consultas e andamento do rastreamento.',
    '/quotes': 'Gerencie solicitações e respostas comerciais.',
    '/clients': 'Organize sua base de clientes e empresas.',
    '/tickets': 'Acompanhe chamados e histórico de atendimento.',
    '/users': 'Controle acessos, perfis e permissões do sistema.',
  };

  return descriptions[pathname] ?? 'Acompanhe o CRM de forma centralizada.';
}

function getRoleBadge(role?: string) {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    GESTAO: 'Gestão',
    COMERCIAL: 'Comercial',
    MARKETING: 'Marketing',
    CLIENTE: 'Cliente',
  };

  return labels[role ?? ''] ?? role ?? '-';
}

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const title = getPageTitle(pathname);
  const description = getPageDescription(pathname);

  function handleSignOut() {
    signOut();
    router.replace('/login');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-[88px] items-center justify-between gap-4 px-5 md:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Portal CRM
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:block">
            <p className="text-sm font-semibold text-slate-800">
              {user?.name ?? '-'}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              {getRoleBadge(user?.role)}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}