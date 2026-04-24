'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock3,
  History,
  Layers3,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import { getAllQuotes } from '@/services/quotes.service';
import { getUsers } from '@/services/users.service';
import type { Quote, QuoteHistoryEntry, QuoteStatus } from '@/types/quotes';
import type { User } from '@/types/user';

type TimelineEvent = {
  id: string;
  category: 'QUOTE' | 'USER' | 'ACCESS';
  title: string;
  description: string;
  timestamp: string;
  badge: string;
  badgeClassName: string;
};

const INTERNAL_ROLES = new Set(['ADMIN', 'GESTAO']);

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getQuoteStatusLabel(status: QuoteStatus) {
  const labels: Record<QuoteStatus, string> = {
    RECEIVED: 'Recebida',
    IN_ANALYSIS: 'Em analise',
    ANSWERED: 'Respondida',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
  };

  return labels[status];
}

function getQuoteBadgeClass(status: QuoteStatus) {
  const classes: Record<QuoteStatus, string> = {
    RECEIVED: 'bg-sky-100 text-sky-700',
    IN_ANALYSIS: 'bg-amber-100 text-amber-700',
    ANSWERED: 'bg-violet-100 text-violet-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-rose-100 text-rose-700',
  };

  return classes[status];
}

function getQuoteLabel(quote: Quote) {
  return (
    quote.client?.companyName ||
    quote.client?.user?.name ||
    `Cotacao ${quote.id.slice(0, 8)}`
  );
}

function buildQuoteEvents(quotes: Quote[]) {
  return quotes.flatMap((quote) =>
    (quote.history ?? []).map((entry: QuoteHistoryEntry) => ({
      id: `quote-${quote.id}-${entry.id}`,
      category: 'QUOTE' as const,
      title: `Cotacao ${getQuoteStatusLabel(entry.status)}`,
      description:
        entry.notes?.trim() ||
        `Atualizacao da cotacao de ${getQuoteLabel(quote)}.`,
      timestamp: entry.createdAt,
      badge: getQuoteStatusLabel(entry.status),
      badgeClassName: getQuoteBadgeClass(entry.status),
    })),
  );
}

function buildUserEvents(users: User[]) {
  return users.map((user) => ({
    id: `user-created-${user.id}`,
    category: 'USER' as const,
    title: 'Usuario cadastrado',
    description: `${user.name} (${user.email}) entrou na base com perfil ${user.role}.`,
    timestamp: user.createdAt,
    badge: user.isActive ? 'Ativo' : 'Inativo',
    badgeClassName: user.isActive
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-zinc-200 text-zinc-700',
  }));
}

export default function LogsPage() {
  const { user, token, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!token || !user || !INTERNAL_ROLES.has(user.role)) {
      setPageLoading(false);
      return;
    }

    const authToken = token;

    async function loadData() {
      try {
        setPageLoading(true);
        setPageError('');

        const [usersData, quotesData] = await Promise.all([
          getUsers(),
          getAllQuotes(authToken),
        ]);

        setUsers(usersData);
        setQuotes(quotesData);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar os logs disponiveis.',
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadData();
  }, [loading, token, user]);

  const quoteEvents = useMemo(() => buildQuoteEvents(quotes), [quotes]);
  const userEvents = useMemo(() => buildUserEvents(users), [users]);

  const accessEvents = useMemo<TimelineEvent[]>(
    () =>
      user
        ? [
            {
              id: `access-session-${user.id}`,
              category: 'ACCESS',
              title: 'Sessao atual reconhecida',
              description: `${user.name} esta autenticado no frontend. A API atual nao persiste historico de logins para auditoria global.`,
              timestamp: new Date().toISOString(),
              badge: 'Sessao atual',
              badgeClassName: 'bg-slate-200 text-slate-800',
            },
          ]
        : [],
    [user],
  );

  const timeline = useMemo(
    () =>
      [...accessEvents, ...quoteEvents, ...userEvents]
        .sort(
          (left, right) =>
            new Date(right.timestamp).getTime() -
            new Date(left.timestamp).getTime(),
        )
        .slice(0, 40),
    [accessEvents, quoteEvents, userEvents],
  );

  const summary = useMemo(() => {
    const activeUsers = users.filter((entry) => entry.isActive).length;
    const adminUsers = users.filter((entry) => entry.role === 'ADMIN').length;

    return {
      totalUsers: users.length,
      activeUsers,
      adminUsers,
      quoteEvents: quoteEvents.length,
    };
  }, [quoteEvents.length, users]);

  const isAllowed = user ? INTERNAL_ROLES.has(user.role) : false;

  if (!loading && !isAllowed) {
    return (
      <AppLayout>
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5" />
            <div>
              <h1 className="text-xl font-semibold">Acesso restrito</h1>
              <p className="mt-2 text-sm leading-6">
                Esta tela de logs esta disponivel apenas para perfis `ADMIN` e
                `GESTAO`.
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_.8fr] lg:p-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                <History className="h-3.5 w-3.5" />
                Admin
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Logs e historico operacional
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
                Esta tela consolida os historicos que a API ja entrega hoje:
                cadastro de usuarios e alteracoes de status em cotacoes. A
                auditoria de acessos foi deixada preparada no front, mas o
                backend ainda nao grava login, IP ou sessao.
              </p>
            </div>

            <div className="rounded-[28px] border border-amber-200 bg-[linear-gradient(180deg,#fffdf5_0%,#fef3c7_100%)] p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Auditoria de acesso incompleta
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Sem mudar a API, nao existe como listar com confiabilidade
                    quem entrou, quando entrou e de qual origem. Hoje o frontend
                    mostra apenas a sessao atual e os eventos operacionais ja
                    persistidos no sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Usuarios cadastrados</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {summary.totalUsers}
                </h2>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                <UserRound className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Usuarios ativos</p>
                <h2 className="mt-2 text-3xl font-bold text-emerald-600">
                  {summary.activeUsers}
                </h2>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Admins</p>
                <h2 className="mt-2 text-3xl font-bold text-violet-600">
                  {summary.adminUsers}
                </h2>
              </div>
              <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Eventos de cotacao</p>
                <h2 className="mt-2 text-3xl font-bold text-amber-600">
                  {summary.quoteEvents}
                </h2>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Status da auditoria
            </h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Acesso
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  Sessao atual visivel no frontend
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Usuario atual: {user?.name ?? '-'} ({user?.email ?? '-'})
                </p>
              </div>

              <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Limitacao atual
                </p>
                <p className="mt-2 text-base font-semibold text-amber-950">
                  Nao ha log persistido de login
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  O backend atual autentica e retorna token, mas nao salva data
                  do acesso, IP, navegador, logout ou tentativa falha.
                </p>
              </div>

              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Ja disponivel
                </p>
                <p className="mt-2 text-base font-semibold text-emerald-950">
                  Historico operacional consolidado
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  A tela usa os historicos de cotacoes que a API ja devolve e
                  os cadastros de usuario para formar uma linha do tempo util.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-950">
                Linha do tempo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Eventos mais recentes retornados pelo sistema.
              </p>
            </div>

            {pageLoading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Carregando logs disponiveis...
              </div>
            ) : pageError ? (
              <div className="p-10 text-center text-sm text-rose-600">
                {pageError}
              </div>
            ) : timeline.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Nenhum evento encontrado.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {timeline.map((event) => (
                  <div
                    key={event.id}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[auto_1fr_auto]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      {event.category === 'QUOTE' ? (
                        <Layers3 className="h-5 w-5" />
                      ) : event.category === 'USER' ? (
                        <UserRound className="h-5 w-5" />
                      ) : (
                        <ShieldAlert className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-950">
                          {event.title}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${event.badgeClassName}`}
                        >
                          {event.badge}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {event.description}
                      </p>
                    </div>

                    <div className="text-sm font-medium text-slate-500">
                      {formatDateTime(event.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </AppLayout>
  );
}
