'use client';


import Avatar from '@mui/material/Avatar';

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
import {
  getPortalContents,
  getPublishedPortalContents,
} from '@/services/portal-content.service';
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
      helper: 'Relação comercial e base ativa',
      icon: Building2,
      accent: 'from-[#ec3139] to-[#eb2c38]',
    },
    {
      label: 'Cotações',
      href: '/quotes',
      helper: 'Pipeline e resposta comercial',
      icon: FileText,
      accent: 'from-[#fab519] to-[#ec3139]',
    },
    {
      label: 'Rastreamento',
      href: '/trackings',
      helper: 'Consulta operacional e andamento',
      icon: Activity,
      accent: 'from-[#343434] to-[#ec3139]',
    },
    {
      label: 'Tickets',
      href: '/tickets',
      helper: 'Suporte e atendimento',
      icon: Ticket,
      accent: 'from-[#fab519] to-[#eb2c38]',
    },
    {
      label: 'Portal',
      href: '/portal-content',
      helper: 'Comunicação, campanhas e publicações',
      icon: Megaphone,
      accent: 'from-[#ec3139] to-[#fab519]',
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
    VLOG: 'Vídeo',
  };

  return labels[type];
}

function getTypeBadgeClass(type: ContentType) {
  const classes: Record<ContentType, string> = {
    NOTICIA: 'bg-[#fab519] text-[#343434]',
    INFORMACAO: 'bg-[#fab519] text-[#343434]',
    VLOG: 'bg-[#fab519] text-[#343434]',
  };

  return classes[type];
}

function getClientFeedAccent(type: ContentType) {
  const classes: Record<ContentType, string> = {
    NOTICIA: 'from-[#343434] via-[#ec3139] to-[#eb2c38]',
    INFORMACAO: 'from-[#343434] via-[#fab519] to-[#ec3139]',
    VLOG: 'from-[#343434] via-[#eb2c38] to-[#fab519]',
  };

  return classes[type];
}

function getPublishedActionUrl(item: PortalContent) {
  return item.ctaUrl || item.videoUrl || null;
}

function MarketingDashboard({
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
        const data = await getPortalContents();
        setContents(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Erro ao carregar publicações.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadContents();
  }, []);

  const summary = useMemo(() => {
    return {
      total: contents.length,
      published: contents.filter((item) => item.isPublished).length,
      drafts: contents.filter((item) => !item.isPublished).length,
      highlights: contents.filter((item) => item.highlight).length,
      videos: contents.filter((item) => item.type === 'VLOG').length,
    };
  }, [contents]);

  const firstName = userName?.trim()?.split(' ')[0] || 'Marketing';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[34px] bg-[#343434] p-6 text-white shadow-[0_28px_80px_rgba(52,52,52,0.22)] lg:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#ec3139]/35 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-44 w-44 rounded-full bg-[#fab519]/25 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.20em] text-[#fab519]">
              <Megaphone className="h-3.5 w-3.5" />
              Dashboard Marketing
            </span>

            <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
              Ola, {firstName}. Suas publicações em primeiro plano.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
              Acompanhe conteúdos publicados, rascunhos, destaques e vídeos do
              canal do cliente sem misturar indicadores comerciais.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/marketing"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#fab519] px-5 py-3 text-sm font-extrabold text-[#343434] transition hover:scale-[1.02]"
              >
                Gerenciar publicações
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Ver canal do cliente
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Publicados', summary.published],
              ['Rascunhos', summary.drafts],
              ['Destaques', summary.highlights],
              ['Vídeos', summary.videos],
            ].map(([label, value]) => (
              <article
                key={label}
                className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                  {label}
                </p>
                <p className="mt-3 text-4xl font-black text-white">{value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_18px_50px_rgba(52,52,52,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.20em] text-[#ec3139]">
              Publicações
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#343434]">
              Conteúdos do canal do cliente
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#343434]/70">
              {summary.total} conteúdo(s) cadastrados no portal.
            </p>
          </div>

          <Link
            href="/marketing"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ec3139] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#eb2c38]"
          >
            Nova publicação
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[360px] animate-pulse rounded-[24px] bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        ) : contents.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
            Nenhuma publicação cadastrada ainda.
          </div>
        ) : (
          <div className="mt-6 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {contents.map((item) => (
              <article
                key={item.id}
                className="group relative min-h-[380px] overflow-hidden rounded-[22px] bg-[#343434] shadow-[0_20px_45px_rgba(52,52,52,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(52,52,52,0.24)]"
              >
                {item.coverImageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${getClientFeedAccent(
                      item.type,
                    )}`}
                  />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(52,52,52,0.20)_0%,rgba(52,52,52,0.50)_45%,rgba(0,0,0,0.78)_100%)]" />

                <div className="relative flex min-h-[380px] flex-col justify-end p-6 text-white">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-extrabold shadow-[0_10px_24px_rgba(0,0,0,0.18)] ${getTypeBadgeClass(
                        item.type,
                      )}`}
                    >
                      {getTypeLabel(item.type)}
                    </span>

                    <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {item.isPublished ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>

                  <h3 className="max-w-[18rem] text-2xl font-black leading-tight drop-shadow md:text-[1.65rem]">
                    {item.title}
                  </h3>

                  <p className="mt-3 line-clamp-2 max-w-[18rem] text-sm font-semibold leading-6 text-white/90">
                    {item.summary}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    {getPublishedActionUrl(item) ? (
                      <a
                        href={getPublishedActionUrl(item) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-base font-extrabold text-white transition hover:text-[#fab519]"
                      >
                        Saiba mais
                        <ArrowRight className="h-5 w-5 -rotate-45" />
                      </a>
                    ) : (
                      <Link
                        href="/marketing"
                        className="inline-flex items-center gap-2 text-base font-extrabold text-white transition hover:text-[#fab519]"
                      >
                        Editar
                        <ArrowRight className="h-5 w-5 -rotate-45" />
                      </Link>
                    )}

                    {item.highlight ? (
                      <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        Destaque
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
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
            : 'Erro ao carregar o conteúdo do portal.',
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
      <section className="relative overflow-hidden rounded-[34px] border border-[#fab519]/20 bg-white/90 p-6 shadow-[0_22px_60px_rgba(52,52,52,0.06)] backdrop-blur">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ec3139]/10 blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#fab519]/18 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fab519]/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#ec3139]">
              <Sparkles className="h-3.5 w-3.5" />
              Canal do Cliente
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#343434] md:text-4xl">
              Canal do Cliente
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Ola, {userName}. Veja novidades, campanhas, vídeos e acessos rapidos
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
                className="inline-flex items-center justify-center rounded-2xl bg-[#343434] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#eb2c38]"
            >
              Abrir atendimento
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(52,52,52,0.06)]">
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
          Ainda não ha conteúdos publicados para clientes.
        </section>
      ) : (
        <div className="space-y-8">
          {grouped.highlights.length > 0 ? (
            <section className="rounded-[30px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(52,52,52,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fab519_0%,#ec3139_100%)] text-white shadow-[0_12px_28px_rgba(236,49,57,0.20)]">
                  <Flame className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#ec3139]">
                    Destaques
                  </p>

                  <h2 className="text-2xl font-bold text-[#343434]">
                    Stories e campanhas em evidência
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {grouped.highlights.map((item) => (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(52,52,52,0.10)]"
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

          <section className="space-y-8 rounded-[28px] bg-white px-4 py-8 shadow-[0_18px_50px_rgba(52,52,52,0.06)] sm:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="inline bg-[linear-gradient(180deg,transparent_58%,#fab519_58%)] px-2 text-3xl font-black tracking-tight text-[#343434] md:text-4xl">
                Novidades do Portal
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#343434]/80">
                Conheça as últimas tendências em logística, transformação digital e
                gestão estratégica que impulsionam o sucesso dos nossos clientes.
              </p>
            </div>

            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {contents.map((item) => (
              <article
                key={item.id}
                className="group relative min-h-[380px] overflow-hidden rounded-[22px] bg-[#343434] shadow-[0_20px_45px_rgba(52,52,52,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(52,52,52,0.24)]"
              >
                {item.coverImageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.coverImageUrl})` }}
                  />
                ) : (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${getClientFeedAccent(
                      item.type,
                    )}`}
                  />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(52,52,52,0.20)_0%,rgba(52,52,52,0.50)_45%,rgba(0,0,0,0.78)_100%)]" />

                <div className="relative flex min-h-[380px] flex-col justify-end p-6 text-white">
                  <div className="mb-5">
                    <span
                      className={`inline-flex rounded-full px-4 py-2 text-sm font-extrabold shadow-[0_10px_24px_rgba(0,0,0,0.18)] ${getTypeBadgeClass(
                        item.type,
                      )}`}
                    >
                      {getTypeLabel(item.type)}
                    </span>
                  </div>

                  <h3 className="max-w-[18rem] text-2xl font-black leading-tight drop-shadow md:text-[1.65rem]">
                    {item.title}
                  </h3>

                  <p className="mt-3 line-clamp-2 max-w-[18rem] text-sm font-semibold leading-6 text-white/90">
                    {item.summary}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    {getPublishedActionUrl(item) ? (
                      <a
                        href={getPublishedActionUrl(item) ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-base font-extrabold text-white transition hover:text-[#fab519]"
                      >
                        Saiba mais
                        <ArrowRight className="h-5 w-5 -rotate-45" />
                      </a>
                    ) : null}

                    {item.highlight ? (
                      <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        Destaque
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
            </div>
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

  const firstName = userName?.trim()?.split(' ')[0] || 'Usuário';

  const internalMetrics = useMemo(
    () => [
      {
        title: 'Clientes ativos',
        value: String(crmSummary?.activeClients ?? 0),
        detail: `${crmSummary?.totalClients ?? 0} cliente(s) na base`,
        icon: Building2,
        accent: 'from-[#ec3139] to-[#eb2c38]',
      },
      {
        title: 'Cotações abertas',
        value: String(crmSummary?.openQuotes ?? 0),
        detail: `${crmSummary?.totalQuotes ?? 0} cotação(ões) no total`,
        icon: FileText,
        accent: 'from-[#fab519] to-[#ec3139]',
      },
      {
        title: 'Tickets em aberto',
        value: String(crmSummary?.openTickets ?? 0),
        detail: `${crmSummary?.closedTickets ?? 0} fechado(s)`,
        icon: Ticket,
        accent: 'from-[#fab519] to-[#eb2c38]',
      },
      {
        title: 'Usuários com acesso',
        value: String(crmSummary?.usersWithAccess ?? 0),
        detail: 'Usuários ativos na plataforma',
        icon: ShieldCheck,
        accent: 'from-[#343434] to-[#ec3139]',
      },
    ],
    [crmSummary],
  );

  const pipelineTotal =
    crmSummary?.opportunitiesByStage.reduce((acc, item) => acc + item.count, 0) ?? 0;

  const maxStageCount = Math.max(
    ...(crmSummary?.opportunitiesByStage.map((item) => item.count) ?? [1]),
  );

  const heroQuickStats = [
    {
      label: 'Clientes ativos',
      value: String(crmSummary?.activeClients ?? 0),
      icon: Building2,
    },
    {
      label: 'Cotações abertas',
      value: String(crmSummary?.openQuotes ?? 0),
      icon: FileText,
    },
    {
      label: 'Tickets em aberto',
      value: String(crmSummary?.openTickets ?? 0),
      icon: Ticket,
    },
  ];

  const heroPipeline = crmSummary?.opportunitiesByStage.slice(0, 4) ?? [];

  const maxHeroPipelineCount = Math.max(
    ...(heroPipeline.map((item) => item.count) ?? [1]),
    1,
  );



  const heroHighlights = [
    {
      label: 'Clientes ativos',
      value: String(crmSummary?.activeClients ?? 0),
      icon: Building2,
    },
    {
      label: 'Cotações abertas',
      value: String(crmSummary?.openQuotes ?? 0),
      icon: FileText,
    },
    {
      label: 'Tickets em aberto',
      value: String(crmSummary?.openTickets ?? 0),
      icon: Ticket,
    },
  ];

  const topStages = crmSummary?.opportunitiesByStage.slice(0, 3) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[36px] border border-[#fab519]/25 bg-[radial-gradient(circle_at_top_left,_rgba(236,49,57,0.22),_transparent_36%),linear-gradient(135deg,#343434_0%,#2b2b2b_44%,#eb2c38_100%)] p-5 text-white shadow-[0_30px_90px_rgba(52,52,52,0.28)] lg:p-6">
        <div className="absolute -right-10 top-0 h-48 w-48 rounded-full bg-[#fab519]/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-[#ec3139]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-20" />

        <div className="relative grid gap-6 xl:grid-cols-[1.55fr_.9fr]">
          <div className="flex min-h-full flex-col">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#fab519] backdrop-blur">
                <Layers3 className="h-3.5 w-3.5" />
                CRM Workspace
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-[#fab519]/25 bg-[#fab519]/10 px-3 py-1 text-xs font-semibold text-[#fab519] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Ambiente online
              </span>
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
              Olá, {firstName}.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
              Acompanhe clientes, atendimentos, cotações e oportunidades.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/clients"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#fab519] px-5 py-3 text-sm font-extrabold text-[#343434] transition hover:scale-[1.02]"
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

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_.95fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[#fab519]">
                    <Activity className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fab519]/80">
                      Visão rápida
                    </p>

                    <h3 className="text-lg font-bold text-white">
                      Panorama da operação
                    </h3>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {heroQuickStats.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="rounded-[22px] border border-white/10 bg-[#343434]/30 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                            {item.label}
                          </p>

                          <Icon className="h-4 w-4 text-[#fab519]" />
                        </div>

                        <p className="mt-3 text-3xl font-bold text-white">
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[#fab519]">
                    <TrendingUp className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fab519]/80">
                      Pipeline
                    </p>

                    <h3 className="text-lg font-bold text-white">
                      Oportunidades abertas
                    </h3>
                  </div>
                </div>

                {heroPipeline.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {heroPipeline.map((item) => {
                      const percentage =
                        maxHeroPipelineCount > 0
                          ? (item.count / maxHeroPipelineCount) * 100
                          : 0;

                      return (
                        <div key={item.stage}>
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <p className="truncate text-sm text-slate-200">
                              {formatOpportunityStage(item.stage)}
                            </p>

                            <span className="text-sm font-semibold text-white">
                              {item.count}
                            </span>
                          </div>

                          <div className="h-2 rounded-full bg-white/10">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-[#fab519] to-[#ec3139]"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <p className="pt-1 text-xs font-medium text-slate-300">
                      {pipelineTotal} oportunidade(s) no total
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[22px] border border-white/10 bg-[#343434]/30 p-4 text-sm leading-6 text-slate-300">
                    Nenhuma oportunidade encontrada no resumo atual.
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-[30px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-[#fab519]/35 blur-md" />

                <Avatar
                  variant="rounded"
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: '#ec3139',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 18,
                    borderRadius: '18px',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    boxShadow: '0 14px 30px rgba(52, 52, 52, 0.28)',
                    position: 'relative',
                  }}
                >
                  {getUserInitials(userName)}
                </Avatar>

                <span className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-[#343434] bg-[#fab519]" />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-slate-200">
                  Sessão atual
                </p>

                <h2 className="truncate text-2xl font-bold text-white">
                  {userName}
                </h2>

                <p className="mt-1 text-sm font-semibold text-[#fab519]">
                  {userRole}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[22px] border border-white/10 bg-[#343434]/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                      Estado do portal
                    </p>

                    <p className="mt-2 text-lg font-semibold text-white">
                      Online
                    </p>
                  </div>

                  <span className="rounded-full bg-[#fab519]/15 px-3 py-1 text-xs font-semibold text-[#fab519]">
                    Estável
                  </span>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-[#343434]/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Conversão atual
                </p>

                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-3xl font-bold text-white">
                    {crmSummary?.conversionRate ?? 0}%
                  </p>

                  <TrendingUp className="mb-1 h-5 w-5 text-[#fab519]" />
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Relação entre oportunidades ganhas e oportunidades trabalhadas.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-[#343434]/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                  Valor em aberto
                </p>

                <p className="mt-2 text-2xl font-bold text-[#fab519]">
                  {formatCurrency(crmSummary?.openValue ?? 0)}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Valor potencial ainda em negociação no funil comercial.
                </p>
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
              className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(52,52,52,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(52,52,52,0.10)]"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`}
              />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {item.title}
                  </p>

                  <h3 className="mt-3 text-4xl font-bold tracking-tight text-[#343434]">
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
        <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(52,52,52,0.06)]">
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
        <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(52,52,52,0.06)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.20em] text-[#ec3139]">
                CRM comercial
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#343434]">
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

                <p className="mt-2 text-3xl font-bold text-[#343434]">
                {crmSummary.totalLeads}
              </p>
            </article>

            <article className="rounded-[26px] border border-slate-200/70 bg-slate-50/80 p-4">
              <p className="text-sm text-slate-500">Oportunidades abertas</p>

                <p className="mt-2 text-3xl font-bold text-[#343434]">
                {crmSummary.openOpportunities}
              </p>
            </article>

            <article className="rounded-[26px] border border-[#fab519]/40 bg-[#fab519]/10 p-4">
              <p className="text-sm text-[#343434]/75">Oportunidades ganhas</p>

              <p className="mt-2 text-3xl font-bold text-[#ec3139]">
                {crmSummary.wonOpportunities}
              </p>
            </article>

            <article className="rounded-[26px] border border-[#ec3139]/20 bg-[#ec3139]/10 p-4">
              <p className="text-sm text-[#343434]/75">Taxa de conversao</p>

              <p className="mt-2 text-3xl font-bold text-[#ec3139]">
                {crmSummary.conversionRate}%
              </p>
            </article>

            <article className="rounded-[26px] border border-[#343434]/15 bg-[#343434]/10 p-4">
              <p className="text-sm text-[#343434]/75">Valor em aberto</p>

              <p className="mt-2 text-3xl font-bold text-[#343434]">
                {formatCurrency(crmSummary.openValue)}
              </p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/70 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ec3139]/10 text-[#ec3139]">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-base font-semibold text-[#343434]">
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
                          <p className="font-semibold text-[#343434]">
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
                          className="h-2 rounded-full bg-gradient-to-r from-[#ec3139] to-[#fab519]"
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
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#343434] text-white">
                  <Activity className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-base font-semibold text-[#343434]">
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

                  <p className="mt-2 text-2xl font-bold text-[#343434]">
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

                  <p className="mt-2 text-2xl font-bold text-[#ec3139]">
                    {crmSummary.conversionRate}%
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Relação entre oportunidades ganhas e oportunidades trabalhadas.
                  </p>
                </div>

                <div className="rounded-[22px] border border-white bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Receita em aberto
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#343434]">
                    {formatCurrency(crmSummary.openValue)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Valor potencial ainda em negociação dentro do funil.
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

      <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(52,52,52,0.06)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.20em] text-[#ec3139]">
              Navegação rápida
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#343434]">
              Módulos principais do CRM
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Acesso rápido aos fluxos mais importantes da operação.
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
                className="group rounded-[26px] border border-slate-200/80 bg-slate-50/70 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#fab519]/60 hover:bg-white hover:shadow-[0_20px_45px_rgba(52,52,52,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#ec3139]" />
                </div>

                <div className="mt-5">
                  <p className="text-lg font-semibold text-[#343434]">
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
      ) : user?.role === 'MARKETING' ? (
        <MarketingDashboard userName={user.name} />
      ) : (
        <InternalDashboard
          userName={user?.name ?? 'Usuário do portal'}
          userRole={user?.role ?? '-'}
          token={token}
        />
      )}
    </AppLayout>
  );
}
