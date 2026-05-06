'use client';


import Avatar from '@mui/material/Avatar';
import { deepPurple } from '@mui/material/colors';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileText,
  Flame,
  Layers3,
  Megaphone,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import {
  formatOpportunityStage,
  getCrmDashboardSummary,
} from '@/services/crm.service';
import { getPublishedPortalContents } from '@/services/portal-content.service';
import type { CrmDashboardSummary } from '@/types/crm';
import type { ContentType, PortalContent } from '@/types/portal-content';

const internalShortcuts: Array<{
  label: string;
  href: string;
  helper: string;
  icon: LucideIcon;
  accent: string;
}> = [
    {
      label: 'Clientes',
      href: '/clients',
      helper: 'Relacao comercial e base ativa',
      icon: Building2,
      accent: 'from-sky-500 to-blue-600',
    },
    {
      label: 'Cotações',
      href: '/quotes',
      helper: 'Pipeline e resposta comercial',
      icon: FileText,
      accent: 'from-violet-500 to-indigo-600',
    },
    {
      label: 'Rastreamento',
      href: '/trackings',
      helper: 'Consulta operacional e andamento',
      icon: Activity,
      accent: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Tickets',
      href: '/tickets',
      helper: 'Suporte e atendimento',
      icon: Ticket,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Portal',
      href: '/portal-content',
      helper: 'Comunicacao, campanhas e publicações',
      icon: Megaphone,
      accent: 'from-pink-500 to-rose-600',
    },
  ];

function formatDate(date?: string | null) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getUserInitials(name: string) {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getTypeLabel(type: ContentType) {
  const labels: Record<ContentType, string> = {
    NOTICIA: 'Noticia',
    INFORMACAO: 'Campanha',
    VLOG: 'Video',
  };

  return labels[type];
}

function getTypeBadgeClass(type: ContentType) {
  const classes: Record<ContentType, string> = {
    NOTICIA: 'bg-sky-100 text-sky-700',
    INFORMACAO: 'bg-amber-100 text-amber-700',
    VLOG: 'bg-violet-100 text-violet-700',
  };

  return classes[type];
}

function getClientFeedAccent(type: ContentType) {
  const classes: Record<ContentType, string> = {
    NOTICIA: 'from-sky-500 to-blue-600',
    INFORMACAO: 'from-amber-500 to-orange-500',
    VLOG: 'from-violet-500 to-fuchsia-600',
  };

  return classes[type];
}

function ClientDashboard({
  userName,
}: {
  userName: string;
}) {
  const [contents, setContents] = useState<PortalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadContents() {
      try {
        setLoading(true);
        setError('');
        const data = await getPublishedPortalContents();
        setContents(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Erro ao carregar o conteudo do portal.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadContents();
  }, []);

  const grouped = useMemo(() => {
    return {
      noticias: contents.filter((item) => item.type === 'NOTICIA'),
      informacoes: contents.filter((item) => item.type === 'INFORMACAO'),
      vlogs: contents.filter((item) => item.type === 'VLOG'),
      highlights: contents.filter((item) => item.highlight),
    };
  }, [contents]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[34px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.06)] backdrop-blur">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-violet-100 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              Canal do Cliente
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Canal do Cliente
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Ola, {userName}. Veja novidades, campanhas, videos e acessos rapidos
              para rastreamento, suporte e relacionamento.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/trackings"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Consultar rastreamento
            </Link>

            <Link
              href="/tickets"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Abrir atendimento
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-44 rounded bg-slate-200" />
            <div className="h-8 w-72 rounded bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-72 rounded-[28px] bg-slate-100" />
              ))}
            </div>
          </div>
        </section>
      ) : error ? (
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700 shadow-sm">
          {error}
        </section>
      ) : contents.length === 0 ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Ainda nao ha conteudos publicados para clientes.
        </section>
      ) : (
        <div className="space-y-6">
          {grouped.highlights.length > 0 ? (
            <section className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#ef4444_100%)] text-white shadow-[0_12px_28px_rgba(239,68,68,0.20)]">
                  <Flame className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Destaques
                  </p>

                  <h2 className="text-2xl font-bold text-slate-950">
                    Stories e campanhas em evidencia
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {grouped.highlights.map((item) => (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.10)]"
                  >
                    <div className="relative h-52 overflow-hidden">
                      {item.coverImageUrl ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                          style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getClientFeedAccent(
                            item.type,
                          )}`}
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />

                      <div className="absolute left-4 top-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadgeClass(
                            item.type,
                          )}`}
                        >
                          {getTypeLabel(item.type)}
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/75">
                          {item.campaignName || 'Portal do cliente'}
                        </p>

                        <h3 className="mt-2 text-xl font-bold leading-tight">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {contents.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]"
              >
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${getClientFeedAccent(
                        item.type,
                      )} text-sm font-bold text-white shadow-lg`}
                    >
                      {item.author.name.slice(0, 1).toUpperCase()}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        CRM Portal
                      </p>

                      <p className="text-xs text-slate-400">
                        {formatDate(item.publishedAt ?? item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadgeClass(
                        item.type,
                      )}`}
                    >
                      {getTypeLabel(item.type)}
                    </span>

                    {item.highlight ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Destaque
                      </span>
                    ) : null}
                  </div>
                </div>

                {item.coverImageUrl ? (
                  <div
                    className="h-72 w-full bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                  />
                ) : (
                  <div
                    className={`h-72 w-full bg-gradient-to-br ${getClientFeedAccent(
                      item.type,
                    )}`}
                  />
                )}

                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {item.campaignName || 'Portal do cliente'}
                  </p>

                  <h3 className="mt-3 text-2xl font-bold leading-tight text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {item.summary}
                  </p>

                  <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-700">
                    {item.body}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {item.videoUrl ? (
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                      >
                        <MonitorPlay className="h-4 w-4" />
                        Assistir video
                      </a>
                    ) : null}

                    {item.ctaUrl && item.ctaLabel ? (
                      <a
                        href={item.ctaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <ArrowRight className="h-4 w-4" />
                        {item.ctaLabel}
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

function InternalDashboard({
  userName,
  userRole,
  token,
}: {
  userName: string;
  userRole: string;
  token: string | null;
}) {
  const [crmSummary, setCrmSummary] = useState<CrmDashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  useEffect(() => {
    async function loadCrmSummary() {
      if (!token) {
        setIsLoadingSummary(false);
        return;
      }

      try {
        setIsLoadingSummary(true);
        const data = await getCrmDashboardSummary(token);
        setCrmSummary(data);
        setSummaryError('');
      } catch (error) {
        setSummaryError(
          error instanceof Error ? error.message : 'Erro ao carregar dashboard.',
        );
      } finally {
        setIsLoadingSummary(false);
      }
    }

    loadCrmSummary();
  }, [token]);

  const firstName = userName?.trim()?.split(' ')[0] || 'Usuario';

  const internalMetrics = useMemo(
    () => [
      {
        title: 'Clientes ativos',
        value: String(crmSummary?.activeClients ?? 0),
        detail: `${crmSummary?.totalClients ?? 0} cliente(s) na base`,
        icon: Building2,
        accent: 'from-sky-500 to-blue-600',
      },
      {
        title: 'Cotacoes abertas',
        value: String(crmSummary?.openQuotes ?? 0),
        detail: `${crmSummary?.totalQuotes ?? 0} cotacao(oes) no total`,
        icon: FileText,
        accent: 'from-violet-500 to-indigo-600',
      },
      {
        title: 'Tickets em aberto',
        value: String(crmSummary?.openTickets ?? 0),
        detail: `${crmSummary?.closedTickets ?? 0} fechado(s)`,
        icon: Ticket,
        accent: 'from-amber-500 to-orange-500',
      },
      {
        title: 'Usuarios com acesso',
        value: String(crmSummary?.usersWithAccess ?? 0),
        detail: 'Usuarios ativos na plataforma',
        icon: ShieldCheck,
        accent: 'from-emerald-500 to-teal-600',
      },
    ],
    [crmSummary],
  );

  const pipelineTotal =
    crmSummary?.opportunitiesByStage.reduce((acc, item) => acc + item.count, 0) ?? 0;

  const maxStageCount = Math.max(
    ...(crmSummary?.opportunitiesByStage.map((item) => item.count) ?? [1]),
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[36px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_38%,#1d4ed8_100%)] p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] lg:p-8">
        <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-20" />

        <div className="relative grid gap-6 xl:grid-cols-[1.5fr_.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100 backdrop-blur">
                <Layers3 className="h-3.5 w-3.5" />
                CRM Workspace
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Ambiente online
              </span>
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
              Olá, {firstName}.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
              Acompanhe clientes, atendimentos, cotações e oportunidades em um único lugar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/clients"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Abrir CRM comercial
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tickets"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                Ver atendimento
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/75">
                  Fluxo comercial
                </p>

                <p className="mt-2 text-lg font-bold text-white">
                  Leads + clientes
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  Pipeline organizado e acompanhamento continuo.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/75">
                  Operacao
                </p>

                <p className="mt-2 text-lg font-bold text-white">
                  Tickets + rastreio
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  Suporte e consulta em um unico ecossistema.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/75">
                  Comunicacao
                </p>

                <p className="mt-2 text-lg font-bold text-white">
                  Portal + marketing
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  Conteudo publicado com leitura mais clara.
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[30px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-violet-400/40 blur-md" />

                <Avatar
                  variant="rounded"
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: deepPurple[500],
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 18,
                    borderRadius: '18px',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.28)',
                    position: 'relative',
                  }}
                >
                  {getUserInitials(userName)}
                </Avatar>

                <span className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-slate-900 bg-emerald-400" />
              </div>

              <div>
                <p className="text-sm text-slate-200">Sessao atual</p>

                <h2 className="text-2xl font-bold text-white">
                  {userName}
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[22px] border border-white/10 bg-slate-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Perfil
                </p>

                <p className="mt-2 text-lg font-semibold text-white">
                  {userRole}
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-slate-950/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                      Estado do portal
                    </p>

                    <p className="mt-2 text-lg font-semibold text-white">
                      Online
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Estavel
                  </span>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-slate-950/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Visao do dia
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-300" />

                  <p className="text-sm text-slate-100">
                    Painel pronto para acompanhar performance e atendimento.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {internalMetrics.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)]"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`}
              />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>

                  <h3 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
                    {item.value}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.detail}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {isLoadingSummary ? (
        <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="h-8 w-72 rounded bg-slate-200" />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-28 rounded-3xl bg-slate-100" />
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
              <div className="h-72 rounded-3xl bg-slate-100" />
              <div className="h-72 rounded-3xl bg-slate-100" />
            </div>
          </div>
        </section>
      ) : crmSummary ? (
        <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.20em] text-blue-600">
                CRM comercial
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Resumo de pipeline e conversão
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Acompanhar volume, performance e valor
                comercial em aberto.
              </p>
            </div>

            <Link
              href="/clients"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Abrir detalhe comercial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <article className="rounded-[26px] border border-slate-200/70 bg-slate-50/80 p-4">
              <p className="text-sm text-slate-500">Total de leads</p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {crmSummary.totalLeads}
              </p>
            </article>

            <article className="rounded-[26px] border border-slate-200/70 bg-slate-50/80 p-4">
              <p className="text-sm text-slate-500">Oportunidades abertas</p>

              <p className="mt-2 text-3xl font-bold text-slate-950">
                {crmSummary.openOpportunities}
              </p>
            </article>

            <article className="rounded-[26px] border border-emerald-200/70 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Oportunidades ganhas</p>

              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {crmSummary.wonOpportunities}
              </p>
            </article>

            <article className="rounded-[26px] border border-blue-200/70 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">Taxa de conversao</p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {crmSummary.conversionRate}%
              </p>
            </article>

            <article className="rounded-[26px] border border-violet-200/70 bg-violet-50 p-4">
              <p className="text-sm text-violet-700">Valor em aberto</p>

              <p className="mt-2 text-3xl font-bold text-violet-600">
                {formatCurrency(crmSummary.openValue)}
              </p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/70 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-base font-semibold text-slate-950">
                    Oportunidades por etapa
                  </p>

                  <p className="text-sm text-slate-500">

                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {crmSummary.opportunitiesByStage.map((item) => {
                  const percentage =
                    maxStageCount > 0 ? (item.count / maxStageCount) * 100 : 0;

                  return (
                    <div
                      key={item.stage}
                      className="rounded-[22px] border border-white bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatOpportunityStage(item.stage)}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {item.count} oportunidade(s)
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-slate-700">
                          {formatCurrency(item.value)}
                        </p>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/70 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Activity className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-base font-semibold text-slate-950">
                    Leitura operacional
                  </p>

                  <p className="text-sm text-slate-500">
                    Indicadores rapidos.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-[22px] border border-white bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Volume do pipeline
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-950">
                    {pipelineTotal}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Soma total das oportunidades distribuidas nas etapas.
                  </p>
                </div>

                <div className="rounded-[22px] border border-white bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Conversao atual
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-600">
                    {crmSummary.conversionRate}%
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Relacao entre oportunidades ganhas e oportunidades trabalhadas.
                  </p>
                </div>

                <div className="rounded-[22px] border border-white bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Receita em aberto
                  </p>

                  <p className="mt-2 text-2xl font-bold text-violet-600">
                    {formatCurrency(crmSummary.openValue)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Valor potencial ainda em negociacao dentro do funil.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : summaryError ? (
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {summaryError}
        </section>
      ) : null}

      <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.20em] text-blue-600">
              Navegacao rapida
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Modulos principais do CRM
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Acesso rapido aos fluxos mais importantes da operacao.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {internalShortcuts.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[26px] border border-slate-200/80 bg-slate-50/70 p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>

                <div className="mt-5">
                  <p className="text-lg font-semibold text-slate-950">
                    {item.label}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.helper}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { user, token } = useAuth();

  return (
    <AppLayout>
      {user?.role === 'CLIENTE' ? (
        <ClientDashboard userName={user.name} />
      ) : (
        <InternalDashboard
          userName={user?.name ?? 'Usuario do portal'}
          userRole={user?.role ?? '-'}
          token={token}
        />
      )}
    </AppLayout>
  );
}
