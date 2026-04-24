'use client';

import { useEffect, useState } from 'react';
import { BadgeDollarSign, CalendarDays, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatOpportunityStage,
  getOpportunityStatusFromStage,
} from '@/services/crm.service';
import type { Opportunity, OpportunityStage } from '@/types/crm';
import { PipelineStageBadge } from './pipeline-stage-badge';

const pipelineStages: OpportunityStage[] = [
  'NOVO',
  'QUALIFICADO',
  'PROPOSTA',
  'NEGOCIACAO',
  'GANHO',
  'PERDIDO',
];

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value ?? 0);
}

function formatDate(date?: string | null) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(date));
}

export function OpportunityList({
  opportunities,
  onStageChange,
  onMarkLost,
}: {
  opportunities: Opportunity[];
  onStageChange: (opportunityId: string, stage: OpportunityStage) => void;
  onMarkLost: (opportunityId: string, reason: string) => void;
}) {
  const [pendingStage, setPendingStage] = useState<Record<string, OpportunityStage>>(
    {},
  );
  const [lostReasons, setLostReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    setPendingStage({});
  }, [opportunities]);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          Pipeline
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Oportunidades comerciais
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Controle simples de etapa e status, sem alterar o fluxo principal do
          portal.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {opportunities.map((opportunity) => {
          const selectedStage = pendingStage[opportunity.id] ?? opportunity.stage;
          const isLostDraft = selectedStage === 'PERDIDO';

          return (
            <article
              key={opportunity.id}
              className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {opportunity.title}
                    </h3>
                    <PipelineStageBadge stage={opportunity.stage} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-slate-400" />
                      {formatCurrency(opportunity.value)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      Fechamento previsto: {formatDate(opportunity.expectedCloseDate)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <BadgeDollarSign className="h-4 w-4 text-slate-400" />
                      Status: {getOpportunityStatusFromStage(opportunity.stage)}
                    </span>
                  </div>

                  {opportunity.lostReason ? (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Motivo da perda: {opportunity.lostReason}
                    </div>
                  ) : null}
                </div>

                <div className="w-full max-w-sm rounded-[22px] border border-slate-200 bg-white p-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Etapa da oportunidade
                  </label>
                  <select
                    value={selectedStage}
                    onChange={(event) => {
                      const nextStage = event.target.value as OpportunityStage;
                      setPendingStage((current) => ({
                        ...current,
                        [opportunity.id]: nextStage,
                      }));

                      if (nextStage !== 'PERDIDO') {
                        onStageChange(opportunity.id, nextStage);
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                  >
                    {pipelineStages.map((stage) => (
                      <option key={stage} value={stage}>
                        {formatOpportunityStage(stage)}
                      </option>
                    ))}
                  </select>

                  {isLostDraft ? (
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-semibold text-slate-700">
                        Motivo da perda
                      </label>
                      <textarea
                        value={lostReasons[opportunity.id] ?? opportunity.lostReason ?? ''}
                        onChange={(event) =>
                          setLostReasons((current) => ({
                            ...current,
                            [opportunity.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                        placeholder="Informe o motivo principal da perda"
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          className="rounded-2xl px-4 py-2 text-sm"
                          onClick={() =>
                            onMarkLost(
                              opportunity.id,
                              lostReasons[opportunity.id] ??
                                opportunity.lostReason ??
                                'Motivo nao informado.',
                            )
                          }
                        >
                          Confirmar perda
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl px-4 py-2 text-sm"
                          onClick={() =>
                            setPendingStage((current) => ({
                              ...current,
                              [opportunity.id]: opportunity.stage,
                            }))
                          }
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
