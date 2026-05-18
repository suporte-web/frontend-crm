'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications.service';
import type { CrmNotification } from '@/types/notifications';

function getPageTitle(pathname: string, role?: string) {
  if (pathname.startsWith('/dashboard')) {
    return role === 'CLIENTE' ? 'Canal do Cliente' : 'Dashboard';
  }

  if (pathname.startsWith('/trackings')) return 'Rastreamento';
  if (pathname.startsWith('/quotes')) return 'Cotações';
  if (pathname.startsWith('/clients')) return 'Clientes';
  if (pathname.startsWith('/leads')) return 'Leads';
  if (pathname.startsWith('/tickets')) return 'Tickets';
  if (pathname.startsWith('/users')) return 'Usuários';
  if (pathname.startsWith('/marketing')) return 'Marketing';

  return 'Painel interno';
}

function getPageDescription(pathname: string, role?: string) {
  if (pathname.startsWith('/dashboard')) {
    if (role === 'CLIENTE') {
      return 'Notícias, conteúdos e atalhos de relacionamento.';
    }

    return 'Visão consolidada da operação, comercial e clientes.';
  }

  if (pathname.startsWith('/trackings')) {
    return 'Acompanhamento de cargas, entregas e movimentações.';
  }

  if (pathname.startsWith('/quotes')) {
    return 'Pedidos de cotação, resposta comercial e contratos em andamento.';
  }

  if (pathname.startsWith('/clients')) {
    return 'Contas, relacionamento e visão comercial por cliente.';
  }

  if (pathname.startsWith('/leads')) {
    return 'Captação, qualificação e origem dos novos contatos.';
  }

  if (pathname.startsWith('/tickets')) {
    return 'Atendimento, SLA e acompanhamento de solicitações.';
  }

  if (pathname.startsWith('/users')) {
    return 'Perfis, acessos e administração do portal.';
  }

  if (pathname.startsWith('/marketing')) {
    return 'Conteúdos, campanhas e publicações do portal.';
  }

  return 'Acompanhe as informações do portal.';
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
  const { theme, setTheme } = useTheme();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

    router.push(
      targetLink ||
        (notification.ticketId ? `/tickets?ticket=${notification.ticketId}` : '/tickets'),
    );
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
    <header className="sticky top-0 z-30 px-4 pt-3 md:px-6 md:pt-4">
      <div className="flex min-h-[58px] items-center justify-between gap-4 rounded-[24px] border border-white/80 bg-white/88 px-3 py-2 shadow-[0_14px_36px_rgba(52,52,52,0.07)] backdrop-blur-xl md:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="h-10 w-10 rounded-2xl border border-slate-200 bg-white text-[#343434] shadow-[0_8px_18px_rgba(52,52,52,0.05)] hover:bg-[#fab519]/10" />

          <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ec3139_0%,#fab519_100%)] text-white shadow-[0_12px_24px_rgba(236,49,57,0.20)] sm:flex">
            <LayoutDashboard className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#ec3139]">
                CRM Portal
              </p>

              <span className="hidden items-center gap-1 rounded-full border border-[#fab519]/50 bg-[#fab519]/15 px-2 py-0.5 text-[11px] font-bold text-[#343434] lg:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#fab519]" />
                Online
              </span>
            </div>

            <p className="hidden truncate text-xs font-medium text-slate-500 md:block">
              Ambiente integrado de operação e relacionamento
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">

          <div className="hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_8px_18px_rgba(52,52,52,0.04)] sm:inline-flex">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition ${
                theme === 'light'
                  ? 'bg-[#343434] text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Sun className="h-4 w-4" />
              Claro
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition ${
                theme === 'dark'
                  ? 'bg-[#343434] text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Moon className="h-4 w-4" />
              Escuro
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                loadNotifications().catch(() => undefined);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-[0_8px_18px_rgba(52,52,52,0.04)] transition hover:bg-[#fab519]/10 hover:text-[#343434]"
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" />

              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-14 z-50 w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:w-[380px]">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Notificações
                    </p>

                    <p className="text-xs text-slate-500">
                      {unreadCount} não lida(s)
                    </p>
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
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            notification.readAt ? 'bg-slate-300' : 'bg-[#ec3139]'
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
                      Nenhuma notificação.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 rounded-[22px] border border-slate-200 bg-white p-1.5 pr-2 shadow-[0_8px_18px_rgba(52,52,52,0.04)] xl:flex">
            <div className="relative">
              <div className="absolute inset-0 rounded-[18px] bg-[#fab519]/30 blur-md" />

              <div className="relative flex h-10 w-10 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#ec3139_0%,#fab519_100%)] text-sm font-bold text-white shadow-[0_12px_24px_rgba(236,49,57,0.22)]">
                {userInitials}
              </div>

              <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#fab519]" />
            </div>

            <div className="min-w-0 px-2">
              <p className="max-w-[140px] truncate text-sm font-semibold text-slate-950">
                {user?.name ?? 'Usuário'}
              </p>

              <p className="max-w-[140px] truncate text-xs text-slate-500">
                {getRoleLabel(user?.role)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-[#fab519]/10 hover:text-[#343434]"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-[0_8px_18px_rgba(52,52,52,0.04)] transition hover:bg-[#fab519]/10 xl:hidden"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
