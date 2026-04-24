'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileText,
  Flame,
  Layers3,
  Megaphone,
  MonitorPlay,
  ShieldCheck,
  Ticket,
  UserRound,
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

const internalMetrics = [
  {
    title: 'Clientes ativos',
    value: '128',
    detail: 'Base comercial acompanhada',
    icon: Building2,
    accent: 'from-sky-500 to-blue-600',
  },
  {
    title: 'Cotacoes abertas',
    value: '42',
    detail: '14 aguardando retorno',
    icon: FileText,
    accent: 'from-violet-500 to-indigo-600',
  },
  {
    title: 'Tickets em andamento',
    value: '19',
    detail: '3 com prioridade alta',
    icon: Ticket,
    accent: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Usuarios com acesso',
    value: '36',
    detail: 'Sem falhas recentes',
    icon: ShieldCheck,
    accent: 'from-emerald-500 to-teal-600',
  },
];

const internalShortcuts = [
  { label: 'Clientes', href: '/clients', helper: 'Relacao comercial e base ativa' },
  { label: 'Cotacoes', href: '/quotes', helper: 'Pipeline e resposta comercial' },
  { label: 'Rastreamento', href: '/trackings', helper: 'Consulta operacional' },
  { label: 'Tickets', href: '/tickets', helper: 'Suporte e atendimento' },
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
      <section className="rounded-[34px] border border-white/80 bg-white/90 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap justify-end gap-3">
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
      </section>

      {loading ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Carregando conteudos publicados...
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
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#ef4444_100%)] text-white">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Destaques
                  </p>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Stories e campanhas em evidenca
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {grouped.highlights.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50 shadow-sm"
                  >
                    <div className="relative h-52 overflow-hidden">
                      {item.coverImageUrl ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                        />
                      ) : (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getClientFeedAccent(
                            item.type,
                          )}`}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
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
                className="overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${getClientFeedAccent(
                        item.type,
                      )} text-sm font-bold text-white`}
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
                  <div className="flex flex-wrap items-center gap-2">
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
                    className="h-72 w-full bg-cover bg-center"
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
}: {
  userName: string;
  userRole: string;
}) {
  const [crmSummary, setCrmSummary] = useState<CrmDashboardSummary | null>(null);

  useEffect(() => {
    async function loadCrmSummary() {
      const data = await getCrmDashboardSummary();
      setCrmSummary(data);
    }

    loadCrmSummary();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <article className="relative overflow-hidden rounded-[34px] border border-slate-900/10 bg-[linear-gradient(135deg,#0f172a_0%,#162449_52%,#2563eb_100%)] p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.2)] lg:p-8">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-16 h-40 w-40 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
              <Layers3 className="h-3.5 w-3.5" />
              CRM Workspace
            </span>

            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Operacao, leads e clientes em uma visao clara de CRM.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
              Painel desenhado para leitura rapida de performance, pipeline e
              atividades do time, sem parecer uma landing page interna.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/80">
                  Fluxo comercial
                </p>
                <p className="mt-2 text-xl font-bold text-white">Leads + clientes</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/80">
                  Atendimento
                </p>
                <p className="mt-2 text-xl font-bold text-white">Tickets e rastreio</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-100/80">
                  Conteudo
                </p>
                <p className="mt-2 text-xl font-bold text-white">Portal e marketing</p>
              </div>
            </div>
          </div>
        </article>

        <article className="crm-shell-card p-6 xl:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)]">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sessao atual</p>
              <h2 className="text-2xl font-bold text-slate-950">{userName}</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Perfil
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{userRole}</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Estado do portal
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-lg font-semibold text-slate-950">Online</p>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Estavel
                </span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {internalMetrics.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="crm-kpi-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.title}</p>
                  <h3 className="mt-3 text-4xl font-bold text-slate-950">
                    {item.value}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
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

      {crmSummary ? (
        <section className="crm-shell-card p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="crm-eyebrow">
                CRM comercial
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Resumo de pipeline e conversao
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Leitura compacta para acompanhar volume, estagio e valor em aberto.
              </p>
            </div>

            <Link
              href="/clients/1"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Abrir detalhe comercial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <article className="crm-soft-panel p-4">
              <p className="text-sm text-slate-500">Total de leads</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {crmSummary.totalLeads}
              </p>
            </article>

            <article className="crm-soft-panel p-4">
              <p className="text-sm text-slate-500">Oportunidades abertas</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {crmSummary.openOpportunities}
              </p>
            </article>

            <article className="crm-soft-panel p-4">
              <p className="text-sm text-slate-500">Oportunidades ganhas</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {crmSummary.wonOpportunities}
              </p>
            </article>

            <article className="crm-soft-panel p-4">
              <p className="text-sm text-slate-500">Taxa de conversao</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {crmSummary.conversionRate}%
              </p>
            </article>

            <article className="crm-soft-panel p-4">
              <p className="text-sm text-slate-500">Valor em aberto</p>
              <p className="mt-2 text-3xl font-bold text-violet-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(crmSummary.openValue)}
              </p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className="crm-soft-panel p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <BriefcaseBusiness className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-950">
                    Oportunidades por etapa
                  </p>
                  <p className="text-sm text-slate-500">
                    Visao simples para comecar sem grafico adicional.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {crmSummary.opportunitiesByStage.map((item) => (
                  <div
                    key={item.stage}
                    className="flex items-center justify-between rounded-2xl border border-white bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatOpportunityStage(item.stage)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.count} oportunidade(s)
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="crm-soft-panel p-4">
              <p className="text-base font-semibold text-slate-950">
                Leitura operacional
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
                <div className="rounded-2xl border border-white bg-white px-4 py-3">
                  Leads entram pela nova area dedicada sem misturar com clientes do portal.
                </div>
                <div className="rounded-2xl border border-white bg-white px-4 py-3">
                  Cotacoes, rastreamento e tickets seguem no mesmo fluxo visual.
                </div>
                <div className="rounded-2xl border border-white bg-white px-4 py-3">
                  Timeline, oportunidades e marketing continuam integrados ao shell atual.
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="crm-shell-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="crm-eyebrow">
              Navegacao rapida
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Modulos principais do CRM
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {internalShortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:border-blue-200 hover:bg-blue-50/70"
            >
              <div>
                <p className="text-base font-semibold text-slate-950">{item.label}</p>
                <p className="text-sm text-slate-500">{item.helper}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      {user?.role === 'CLIENTE' ? (
        <ClientDashboard userName={user.name} />
      ) : (
        <InternalDashboard
          userName={user?.name ?? 'Usuario do portal'}
          userRole={user?.role ?? '-'}
        />
      )}
    </AppLayout>
  );
}
