'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, Mail, Phone, UserRound } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { OpportunityList } from '@/components/crm/opportunity-list';
import { TimelineSection } from '@/components/crm/timeline-section';
import { Button } from '@/components/ui/button';
import {
  formatLeadStatus,
  formatOpportunityStage,
  getCrmLeadById,
  getOpportunityStatusFromStage,
} from '@/services/crm.service';
import type {
  LeadDetail,
  OpportunityStage,
  TimelineEvent,
} from '@/types/crm';

const statusClasses = {
  ATIVO: 'bg-emerald-100 text-emerald-700',
  PENDENTE: 'bg-amber-100 text-amber-700',
  INATIVO: 'bg-rose-100 text-rose-700',
} as const;

function formatDate(date?: string | null) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value ?? 0);
}

export default function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadLead() {
      try {
        setLoading(true);
        setError('');
        const { id } = await params;
        const nextLead = await getCrmLeadById(id);

        if (!active) {
          return;
        }

        if (!nextLead) {
          setError('Cliente nao encontrado.');
          setLead(null);
          return;
        }

        setLead(nextLead);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Erro ao carregar o detalhe do cliente.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLead();

    return () => {
      active = false;
    };
  }, [params]);

  const openValue = useMemo(
    () =>
      (lead?.opportunities ?? [])
        .filter((opportunity) => opportunity.status === 'OPEN')
        .reduce((total, opportunity) => total + (opportunity.value ?? 0), 0),
    [lead],
  );

  function handleStageChange(opportunityId: string, stage: OpportunityStage) {
    setLead((current) => {
      if (!current) {
        return current;
      }

      const opportunity = current.opportunities.find((item) => item.id === opportunityId);

      if (!opportunity || opportunity.stage === stage) {
        return current;
      }

      const updatedAt = new Date().toISOString();
      const nextEvent: TimelineEvent = {
        id: `evt-${opportunityId}-${updatedAt}`,
        leadId: current.id,
        type: stage === 'GANHO' ? 'OPPORTUNITY_WON' : 'STAGE_CHANGED',
        title: stage === 'GANHO' ? 'Oportunidade ganha' : 'Mudanca de etapa',
        description:
          stage === 'GANHO'
            ? `${opportunity.title} foi marcada como ganha.`
            : `${opportunity.title} avancou para ${formatOpportunityStage(stage)}.`,
        createdAt: updatedAt,
        createdBy: 'Portal CRM',
        metadata: {
          from: opportunity.stage,
          to: stage,
        },
      };

      return {
        ...current,
        timeline: [nextEvent, ...current.timeline],
        opportunities: current.opportunities.map((item) =>
          item.id === opportunityId
            ? {
                ...item,
                stage,
                status: getOpportunityStatusFromStage(stage),
                updatedAt,
                lostReason: stage === 'PERDIDO' ? item.lostReason : null,
              }
            : item,
        ),
      };
    });
  }

  function handleMarkLost(opportunityId: string, reason: string) {
    const trimmedReason = reason.trim() || 'Motivo nao informado.';

    setLead((current) => {
      if (!current) {
        return current;
      }

      const opportunity = current.opportunities.find((item) => item.id === opportunityId);

      if (!opportunity) {
        return current;
      }

      const updatedAt = new Date().toISOString();
      const nextEvent: TimelineEvent = {
        id: `evt-lost-${opportunityId}-${updatedAt}`,
        leadId: current.id,
        type: 'OPPORTUNITY_LOST',
        title: 'Oportunidade perdida',
        description: `${opportunity.title} foi encerrada como perdida.`,
        createdAt: updatedAt,
        createdBy: 'Portal CRM',
        metadata: {
          reason: trimmedReason,
        },
      };

      return {
        ...current,
        timeline: [nextEvent, ...current.timeline],
        opportunities: current.opportunities.map((item) =>
          item.id === opportunityId
            ? {
                ...item,
                stage: 'PERDIDO',
                status: 'LOST',
                lostReason: trimmedReason,
                updatedAt,
              }
            : item,
        ),
      };
    });
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_.8fr] lg:p-8">
            <div>
              <Link
                href="/clients"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar para clientes
              </Link>

              {loading ? (
                <div className="mt-6 text-sm text-slate-500">Carregando cliente...</div>
              ) : error ? (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : lead ? (
                <>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      CRM
                    </span>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusClasses[lead.status]
                      }`}
                    >
                      {formatLeadStatus(lead.status)}
                    </span>
                  </div>

                  <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                    {lead.company}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
                    {lead.notes ??
                      'Conta comercial com historico de atividades e oportunidades em andamento.'}
                  </p>

                  <div className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Responsavel
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">{lead.owner}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Ultimo contato
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {formatDate(lead.lastContactAt)}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {lead ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Visao da conta</p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Segmento
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {lead.segment}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Contato
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {lead.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Telefone
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {lead.phone ?? '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Valor em aberto
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatCurrency(openValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {lead ? (
          <>
            <OpportunityList
              opportunities={lead.opportunities}
              onStageChange={handleStageChange}
              onMarkLost={handleMarkLost}
            />
            <TimelineSection events={lead.timeline} />
          </>
        ) : loading ? null : (
          <section className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Nao foi possivel carregar os dados deste cliente.
            </p>
            <Button asChild className="mt-4 rounded-2xl px-4 py-2 text-sm">
              <Link href="/clients">Voltar para a lista</Link>
            </Button>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
