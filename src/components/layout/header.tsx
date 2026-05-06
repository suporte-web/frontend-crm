'use client';

import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Command, LogOut, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications.service';
import type { CrmNotification } from '@/types/notifications';

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/trackings')) return 'Rastreamento';
  if (pathname.startsWith('/quotes')) return 'Cotacoes';
  if (pathname.startsWith('/clients')) return 'Clientes';
  if (pathname.startsWith('/leads')) return 'Leads';
  if (pathname.startsWith('/tickets')) return 'Tickets';
  if (pathname.startsWith('/users')) return 'Usuarios';
  if (pathname.startsWith('/marketing')) return 'Marketing';

  return 'Painel interno';
}

function getPageDescription(pathname: string) {
  if (pathname.startsWith('/dashboard')) {
    return 'Visao consolidada da operacao, comercial e clientes.';
  }

  if (pathname.startsWith('/trackings')) {
    return 'Consultas e entregas em um fluxo operacional claro.';
  }

  if (pathname.startsWith('/quotes')) {
    return 'Pedidos de cotacao, resposta comercial e contratos em andamento.';
  }

  if (pathname.startsWith('/clients')) {
    return 'Contas, relacionamento e visao comercial por cliente.';
  }

  if (pathname.startsWith('/leads')) {
    return 'Captacao, qualificacao e origem dos novos contatos.';
  }

  if (pathname.startsWith('/tickets')) {
    return 'Atendimento, SLA e acompanhamento de solicitacoes.';
  }

  if (pathname.startsWith('/users')) {
    return 'Perfis, acessos e administracao do portal.';
  }

  if (pathname.startsWith('/marketing')) {
    return 'Conteudos, campanhas e publicacoes do portal.';
  }

  return 'Acompanhe as informacoes do portal.';
}


  function getRoleLabel(role?: string) {
  if (!role) return 'Perfil';

  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    GESTAO: 'Gestão',
    COMERCIAL: 'Comercial',
    MARKETING: 'Marketing',
    CLIENTE: 'Cliente',
  };

  return labels[role] ?? role;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, signOut } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  async function loadNotifications() {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const [items, unread] = await Promise.all([
      getNotifications(token),
      getUnreadNotificationCount(token),
    ]);

    setNotifications(items);
    setUnreadCount(unread.count);
  }

  useEffect(() => {
    loadNotifications().catch(() => undefined);
  }, [token, pathname]);

  async function handleNotificationClick(notification: CrmNotification) {
    if (!token) {
      return;
    }

    if (!notification.readAt) {
      await markNotificationRead(notification.id, token).catch(() => undefined);
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    setNotificationsOpen(false);
    const targetLink = notification.link?.startsWith('/tickets/')
      ? `/tickets?ticket=${notification.link.split('/').pop()}`
      : notification.link;

    router.push(targetLink || (notification.ticketId ? `/tickets?ticket=${notification.ticketId}` : '/tickets'));
  }

  async function handleMarkAllRead() {
    if (!token) {
      return;
    }

    await markAllNotificationsRead(token).catch(() => undefined);
    setUnreadCount(0);
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
  }

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 md:px-6 md:pt-5">
      <div className="flex min-h-[78px] items-center justify-between gap-4 rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(248,250,252,0.92)_100%)] px-4 py-3 shadow-[0_18px_46px_rgba(15,23,42,0.06)] backdrop-blur-xl md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:bg-slate-50" />

          <div className="min-w-0">
            <p className="crm-eyebrow mb-1 hidden md:block">Workspace CRM</p>
            <h1 className="truncate text-lg font-semibold text-slate-950 md:text-[1.35rem]">
              {pageTitle}
            </h1>
            <p className="truncate text-sm text-slate-500">{pageDescription}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex min-w-[360px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            <Search className="h-4 w-4" />
            Buscar cliente, ticket ou cotacao
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
              <Command className="mr-1 inline h-3 w-3" />
              K
            </span>
          </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                loadNotifications().catch(() => undefined);
              }}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
              aria-label="Notificacoes"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-14 z-50 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Notificacoes</p>
                    <p className="text-xs text-slate-500">{unreadCount} nao lida(s)</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar lidas
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? 'bg-slate-300' : 'bg-blue-600'
                            }`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {notification.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Nenhuma notificacao.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 rounded-[24px] border border-slate-200 bg-white p-1.5 pr-2 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
            <div className="relative">
              <div className="absolute inset-0 rounded-[18px] bg-blue-400/30 blur-md" />

              <div className="relative flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#2563eb_0%,#38bdf8_100%)] text-sm font-bold text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)]">
                {userInitials}
              </div>

              <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            <div className="min-w-0 px-2">
              <p className="max-w-[140px] truncate text-sm font-semibold text-slate-950">
                {user?.name ?? 'Usuario'}
              </p>

              <p className="max-w-[140px] truncate text-xs text-slate-500">
                {getRoleLabel(user?.role)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 lg:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
    </header>
  );
}
