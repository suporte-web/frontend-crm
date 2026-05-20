'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Filter,
  LineChart,
  RefreshCcw,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import { getCrmDashboardSummary } from '@/services/crm.service';
import { getLeads } from '@/services/leads.service';
import { getAllQuotes } from '@/services/quotes.service';
import { getAllTickets } from '@/services/tickets.service';
import type { CrmDashboardSummary, OpportunityStage } from '@/types/crm';
import type { Lead } from '@/types/leads';
import type { Quote } from '@/types/quotes';
import type { Ticket } from '@/types/tickets';

const stageLabels: Record<OpportunityStage, string> = {
  NOVO: 'Novo',
  QUALIFICADO: 'Qualificado',
  PROPOSTA: 'Proposta',
  NEGOCIACAO: 'Negociação',
  GANHO: 'Ganho',
  PERDIDO: 'Perdido',
};

const stageOrder: OpportunityStage[] = [
  'NOVO',
  'QUALIFICADO',
  'PROPOSTA',
  'NEGOCIACAO',
  'GANHO',
  'PERDIDO',
];

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatNumber(value: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR').format(toNumber(value));
}

function formatPercent(value: number | string | null | undefined) {
  return `${toNumber(value).toFixed(1).replace('.', ',')}%`;
}

function countBy<T>(items: T[], getKey: (item: T) => string | null | undefined) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item)?.trim() || 'Sem classificacao';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function topEntries(map: Record<string, number>, limit = 5) {
  return Object.entries(map)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit);
}

function isTicketOpen(ticket: Ticket) {
  return !['FECHADO', 'CANCELADO', 'FINALIZADO', 'PERDIDO'].includes(ticket.status);
}

function isTicketBlocked(ticket: Ticket) {
  return ['AGUARDANDO_CLIENTE', 'AGUARDANDO_GESTAO', 'AJUSTE_SOLICITADO'].includes(ticket.status);
}

export default function BusinessIntelligencePage() {
  const { token, user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<CrmDashboardSummary | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const canViewPage =
    user?.role && ['ADMIN', 'GESTAO', 'COMERCIAL'].includes(user.role);

  useEffect(() => {
    if (authLoading || !token || !canViewPage) {
      setLoading(false);
      return;
    }

    let active = true;
    const authToken = token;

    async function loadData() {
      setLoading(true);
      setErrorMessage('');

      try {
        const [summaryData, leadData, quoteData, ticketData] = await Promise.all([
          getCrmDashboardSummary(authToken),
          getLeads(authToken),
          getAllQuotes(authToken),
          getAllTickets(authToken),
        ]);

        if (!active) return;

        setSummary(summaryData);
        setLeads(leadData);
        setQuotes(quoteData);
        setTickets(ticketData);
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error ? error.message : 'Erro ao carregar BI comercial.',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [authLoading, canViewPage, refreshKey, token]);

  const metrics = useMemo(() => {
    const openTickets = tickets.filter(isTicketOpen);
    const blockedTickets = tickets.filter(isTicketBlocked);
    const answeredQuotes = quotes.filter((quote) => quote.status === 'ANSWERED');
    const approvedQuotes = quotes.filter((quote) => quote.status === 'APPROVED');
    const openQuotes = quotes.filter((quote) =>
      ['RECEIVED', 'IN_ANALYSIS'].includes(quote.status),
    );
    const proposalsValue = quotes.reduce(
      (total, quote) =>
        total +
        Math.max(
          toNumber(quote.price),
          ...((quote.propostas ?? []).map((proposta) => toNumber(proposta.valor))),
        ),
      0,
    );
    const conversionRate =
      leads.length > 0
        ? (leads.filter((lead) => lead.status === 'converted').length / leads.length) * 100
        : summary?.conversionRate ?? 0;

    return {
      openTickets: openTickets.length,
      blockedTickets: blockedTickets.length,
      answeredQuotes: answeredQuotes.length,
      approvedQuotes: approvedQuotes.length,
      openQuotes: openQuotes.length,
      proposalsValue,
      conversionRate,
    };
  }, [leads, quotes, summary?.conversionRate, tickets]);

  const funnel = useMemo(() => {
    const byStage = new Map(
      (summary?.opportunitiesByStage ?? []).map((item) => [item.stage, item]),
    );
    const maxCount = Math.max(
      1,
      ...stageOrder.map((stage) => byStage.get(stage)?.count ?? 0),
    );

    return stageOrder.map((stage) => {
      const item = byStage.get(stage);
      const count = item?.count ?? 0;
      return {
        stage,
        label: stageLabels[stage],
        count,
        value: item?.value ?? 0,
        width: `${Math.max(8, (count / maxCount) * 100)}%`,
      };
    });
  }, [summary]);

  const sourceRanking = useMemo(
    () => topEntries(countBy(leads, (lead) => String(lead.source ?? 'Manual')), 4),
    [leads],
  );

  const serviceRanking = useMemo(
    () => topEntries(countBy(quotes, (quote) => quote.serviceType), 5),
    [quotes],
  );

  const statusRanking = useMemo(
    () => topEntries(countBy(tickets, (ticket) => ticket.status), 5),
    [tickets],
  );

  const strategicSignals = useMemo(() => {
    const signals = [];

    if (metrics.blockedTickets > 0) {
      signals.push({
        title: 'Gargalo de decisao',
        text: `${metrics.blockedTickets} ticket(s) aguardam cliente, gestao ou ajuste.`,
        tone: 'amber',
      });
    }

    if (metrics.openQuotes > metrics.answeredQuotes) {
      signals.push({
        title: 'Cotações a responder',
        text: `${metrics.openQuotes} cotação(ões) ainda estão em recebimento ou análise.`,
        tone: 'red',
      });
    }

    if (metrics.conversionRate >= 50) {
      signals.push({
        title: 'Conversao saudavel',
        text: `Taxa atual de ${formatPercent(metrics.conversionRate)} no funil comercial.`,
        tone: 'green',
      });
    }

    if (signals.length === 0) {
      signals.push({
        title: 'Sem alerta critico',
        text: 'Pipeline sem gargalos relevantes nos dados disponiveis.',
        tone: 'green',
      });
    }

    return signals;
  }, [metrics]);

  if (!authLoading && !canViewPage) {
    return (
      <AppLayout>
        <section className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-sm font-semibold text-red-700">
          Voce nao tem permissao para acessar o BI comercial.
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="grid gap-6 border-b border-slate-200 bg-[linear-gradient(135deg,#343434_0%,#3f3434_58%,#ec3139_100%)] px-6 py-6 text-white lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="inline-flex rounded-full border border-[#fab519]/50 bg-[#fab519]/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#fab519]">
                Analise comercial
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-normal">
                BI estratégico do funil de vendas
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/78">
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={() => setRefreshKey((current) => current + 1)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-[#343434] transition hover:bg-[#fff7df]"
              >
                <RefreshCcw className="h-4 w-4" />
                Atualizar dados
              </button>
              <div className="rounded-md border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  Fonte
                </p>
                <p className="mt-1 text-sm font-bold text-white">
                  CRM, leads, cotações e tickets
                </p>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Valor em aberto',
                value: formatCurrency(summary?.openValue ?? 0),
                icon: CircleDollarSign,
                tone: 'bg-[#fff7df] text-[#8a6100] border-[#f5d26e]',
              },
              {
                label: 'Valor em propostas',
                value: formatCurrency(metrics.proposalsValue),
                icon: TrendingUp,
                tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              },
              {
                label: 'Taxa de conversão',
                value: formatPercent(metrics.conversionRate),
                icon: Target,
                tone: 'bg-blue-50 text-blue-700 border-blue-200',
              },
              {
                label: 'Tickets bloqueados',
                value: formatNumber(metrics.blockedTickets),
                icon: AlertTriangle,
                tone: 'bg-red-50 text-red-700 border-red-200',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className="rounded-[18px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </p>
                    <span className={`grid h-10 w-10 place-items-center rounded-md border ${item.tone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-black text-slate-950">
                    {loading ? '...' : item.value}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ec3139]">
                  Funil
                </p>
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  Pipeline por etapa
                </h2>
              </div>
              <LineChart className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-6 space-y-4">
              {funnel.map((stage) => (
                <div key={stage.stage}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-slate-800">{stage.label}</span>
                    <span className="text-slate-500">
                      {stage.count} negocio(s) | {formatCurrency(stage.value)}
                    </span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-md bg-slate-100">
                    <div
                      className="flex h-full items-center rounded-md bg-[linear-gradient(90deg,#ec3139,#fab519)] px-3 text-xs font-black text-white transition-all"
                      style={{ width: stage.width }}
                    >
                      {formatNumber(stage.count)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ec3139]">
                  Alertas
                </p>
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  Sinais estratégicos
                </h2>
              </div>
              <Filter className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-5 space-y-3">
              {strategicSignals.map((signal) => (
                <article
                  key={signal.title}
                  className={`rounded-[16px] border p-4 ${
                    signal.tone === 'green'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : signal.tone === 'amber'
                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                        : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  <p className="text-sm font-black">{signal.title}</p>
                  <p className="mt-1 text-sm leading-5 opacity-80">{signal.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <RankingPanel
            title="Origem dos leads"
            icon={Users}
            items={sourceRanking}
            total={leads.length}
          />
          <RankingPanel
            title="Serviços mais cotados"
            icon={FileText}
            items={serviceRanking}
            total={quotes.length}
          />
          <RankingPanel
            title="Status dos tickets"
            icon={BarChart3}
            items={statusRanking}
            total={tickets.length}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric label="Leads totais" value={summary?.totalLeads ?? leads.length} />
          <MiniMetric label="Oportunidades abertas" value={summary?.openOpportunities ?? 0} />
          <MiniMetric label="Cotações abertas" value={metrics.openQuotes} />
          <MiniMetric label="Cotações aprovadas" value={metrics.approvedQuotes} />
        </section>

        {loading ? (
          <section className="rounded-[20px] border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Carregando indicadores...
          </section>
        ) : null}
      </div>
    </AppLayout>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number | string | null | undefined;
}) {
  return (
    <article className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      </div>
      <p className="mt-3 text-2xl font-black text-slate-950">
        {formatNumber(value)}
      </p>
    </article>
  );
}

function RankingPanel({
  title,
  icon: Icon,
  items,
  total,
}: {
  title: string;
  icon: typeof Users;
  items: Array<[string, number]>;
  total: number;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        <Icon className="h-5 w-5 text-[#ec3139]" />
      </div>

      <div className="mt-5 space-y-4">
        {items.length > 0 ? (
          items.map(([label, count]) => {
            const width = `${Math.max(8, total > 0 ? (count / total) * 100 : 0)}%`;
            return (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-bold text-slate-800">{label}</span>
                  <span className="text-slate-500">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#ec3139]" style={{ width }} />
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">
            Sem dados suficientes.
          </p>
        )}
      </div>
    </div>
  );
}
