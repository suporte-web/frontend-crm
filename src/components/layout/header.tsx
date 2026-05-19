'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Grid3X3,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { appScreens, isScreenEnabledForRole } from '@/config/screens';
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

  if (pathname.startsWith('/bi')) return 'BI Comercial';
  if (pathname.startsWith('/trackings')) return 'Rastreamento';
  if (pathname.startsWith('/quotes')) return 'Cotações';
  if (pathname.startsWith('/clients')) return 'Clientes';
  if (pathname.startsWith('/leads')) return 'Leads';
  if (pathname.startsWith('/tickets')) return 'Tickets';
  if (pathname.startsWith('/users')) return 'Usuários';
  if (pathname.startsWith('/marketing')) return 'Marketing';
  if (pathname.startsWith('/entregas')) return 'Entregas';
  if (pathname.startsWith('/entradas')) return 'Entradas';
  if (pathname.startsWith('/suppliers')) return 'Fornecedores';
  if (pathname.startsWith('/chat')) return 'Chat';
  if (pathname.startsWith('/logs')) return 'Logs';

  return 'CRM';
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

function getNotificationToneClass(notification: CrmNotification) {
  const type = String(notification.metadata?.type ?? '').toUpperCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();

  if (type === 'CHAT_MESSAGE' || text.includes('chat') || text.includes('mensagem')) {
    return notification.readAt
      ? 'border-blue-100 bg-white hover:bg-blue-50'
      : 'border-blue-100 bg-blue-50 hover:bg-blue-100';
  }

  if (text.includes('aprov')) {
    return notification.readAt
      ? 'border-emerald-100 bg-white hover:bg-emerald-50'
      : 'border-emerald-100 bg-emerald-50 hover:bg-emerald-100';
  }

  if (text.includes('ajuste') || text.includes('aguardando')) {
    return notification.readAt
      ? 'border-amber-100 bg-white hover:bg-amber-50'
      : 'border-amber-100 bg-amber-50 hover:bg-amber-100';
  }

  return notification.readAt
    ? 'border-slate-100 bg-white hover:bg-slate-50'
    : 'border-rose-100 bg-rose-50 hover:bg-rose-100';
}

function getNotificationDotClass(notification: CrmNotification) {
  const type = String(notification.metadata?.type ?? '').toUpperCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();

  if (notification.readAt) return 'bg-slate-300';
  if (type === 'CHAT_MESSAGE' || text.includes('chat') || text.includes('mensagem')) return 'bg-blue-600';
  if (text.includes('aprov')) return 'bg-emerald-600';
  if (text.includes('ajuste') || text.includes('aguardando')) return 'bg-amber-500';
  return 'bg-[#ec3139]';
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [appsOpen, setAppsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userFirstName = user?.name?.split(' ').filter(Boolean)[0] ?? 'Usuário';
  const pageTitle = getPageTitle(pathname, user?.role);
  const availableScreens = appScreens.filter((item) =>
    isScreenEnabledForRole(item, user?.role, user?.screenPermissions),
  );

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

  useEffect(() => {
    if (!token) return;

    const interval = window.setInterval(() => {
      loadNotifications().catch(() => undefined);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [token]);

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
    <header className="sticky top-0 z-40 w-full">
      <div className="flex h-[52px] items-center justify-between bg-[#343434] px-3 text-white shadow-[0_1px_0_rgba(255,255,255,0.08)] md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="h-9 w-9 rounded-md text-white hover:bg-white/10 md:hidden" />

          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#ec3139] text-sm font-black leading-none text-white shadow-[0_0_0_2px_rgba(250,181,25,0.22)]">
              P
            </span>
            <span className="text-lg font-black leading-none tracking-normal text-white">
              CRM
            </span>
          </div>

          <span className="hidden h-5 w-px bg-white/30 sm:block" />

          <span className="hidden max-w-[280px] truncate text-xs font-semibold uppercase tracking-normal text-white sm:block">
            {user?.name ?? 'Pizzattolog'} {user?.role ? `(${getRoleLabel(user.role)})` : ''}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="grid h-9 w-9 place-items-center rounded-md text-white/88 transition hover:bg-white/10 hover:text-white"
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => {
                setAppsOpen((current) => !current);
                setNotificationsOpen(false);
              }}
              className="grid h-9 w-9 place-items-center rounded-md text-white/88 transition hover:bg-white/10 hover:text-white"
              aria-label="Aplicativos"
              title="Aplicativos"
            >
              <Grid3X3 className="h-4.5 w-4.5" />
            </button>

            {appsOpen ? (
              <div className="absolute right-0 top-12 z-50 grid w-[260px] grid-cols-2 gap-1 rounded-md border border-slate-200 bg-white p-2 text-[#343434] shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                {availableScreens.slice(0, 10).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAppsOpen(false)}
                    className="rounded-md px-3 py-2 text-xs font-semibold transition hover:bg-[#fff7df] hover:text-[#ec3139]"
                  >
                    {item.href === '/dashboard' && user?.role === 'CLIENTE'
                      ? 'Canal do Cliente'
                      : item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => router.push('/change-password')}
            className="hidden h-9 w-9 place-items-center rounded-md text-white/88 transition hover:bg-white/10 hover:text-white md:grid"
            aria-label="Configurações da conta"
            title="Configurações da conta"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                setAppsOpen(false);
                loadNotifications().catch(() => undefined);
              }}
              className="relative grid h-9 w-9 place-items-center rounded-md text-white/88 transition hover:bg-white/10 hover:text-white"
              aria-label="Notificações"
              title="Notificações"
            >
              <Bell className="h-4.5 w-4.5" />

              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ec3139] px-1 text-[10px] font-black text-white ring-1 ring-[#fab519]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-12 z-50 w-[330px] overflow-hidden rounded-md border border-slate-200 bg-white text-[#343434] shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:w-[380px]">
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
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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
                      className={`block w-full border-b px-4 py-3 text-left transition ${getNotificationToneClass(notification)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            getNotificationDotClass(notification)
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

          <span className="ml-1 hidden max-w-[120px] truncate text-xs font-semibold text-white sm:inline">
            {userFirstName}
          </span>

          <UserCircle className="hidden h-7 w-7 text-white/90 sm:block" />

          <button
            type="button"
            onClick={handleSignOut}
            className="grid h-9 w-9 place-items-center rounded-md text-white/88 transition hover:bg-white/10 hover:text-white"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div className="flex h-[42px] items-end border-b border-[#ec3139]/45 bg-white pl-3 shadow-[0_1px_0_rgba(52,52,52,0.05)] md:pl-[72px]">
        <div className="flex h-full items-end">
          <div className="flex h-[38px] min-w-[112px] items-center justify-between gap-3 rounded-t-md bg-[#ec3139] px-4 text-sm font-bold text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.16)]">
            <span className="truncate">{pageTitle}</span>
            <X className="h-3.5 w-3.5 opacity-80" />
          </div>
        </div>
      </div>
    </header>
  );
}
