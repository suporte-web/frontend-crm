'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeDollarSign,
  CalendarDays,
  Check,
  CircleDollarSign,
  Edit3,
  X,
} from 'lucide-react';
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

type OpportunityEditPayload = {
  title?: string;
  value?: number | null;
  expectedCloseDate?: string | null;
  preContract?: boolean;
  preContractNotes?: string | null;
};

type OpportunityEditForm = {
  title: string;
  value: string;
  expectedCloseDate: string;
  preContract: boolean;
  preContractNotes: string;
};

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

function formatDateInput(date?: string | null) {
  if (!date) {
    return '';
  }

  return new Date(date).toISOString().slice(0, 10);
}

function opportunityToEditForm(opportunity: Opportunity): OpportunityEditForm {
  return {
    title: opportunity.title,
    value:
      opportunity.value !== null && opportunity.value !== undefined
        ? String(opportunity.value)
        : '',
    expectedCloseDate: formatDateInput(opportunity.expectedCloseDate),
    preContract: opportunity.preContract ?? false,
    preContractNotes: opportunity.preContractNotes ?? '',
  };
}

export function OpportunityList({
  opportunities,
  onStageChange,
  onMarkLost,
  canEdit = false,
  onEdit,
}: {
  opportunities: Opportunity[];
  onStageChange: (opportunityId: string, stage: OpportunityStage) => void | Promise<void>;
  onMarkLost: (opportunityId: string, reason: string) => void | Promise<void>;
  canEdit?: boolean;
  onEdit?: (opportunityId: string, payload: OpportunityEditPayload) => void | Promise<void>;
}) {
  const [pendingStage, setPendingStage] = useState<Record<string, OpportunityStage>>(
    {},
  );
  const [lostReasons, setLostReasons] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OpportunityEditForm | null>(null);

  useEffect(() => {
    setPendingStage({});
    setEditingId(null);
    setEditForm(null);
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

      <div className="mt-5 grid gap-2 md:grid-cols-6">
        {pipelineStages.map((stage, index) => (
          <div
            key={stage}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {formatOpportunityStage(stage)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4">
        {opportunities.map((opportunity) => {
          const selectedStage = pendingStage[opportunity.id] ?? opportunity.stage;
          const isLostDraft = selectedStage === 'PERDIDO';
          const isEditing = editingId === opportunity.id && editForm;

          return (
            <article
              key={opportunity.id}
              className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isEditing ? (
                      <input
                        value={editForm.title}
                        onChange={(event) =>
                          setEditForm((current) =>
                            current
                              ? { ...current, title: event.target.value }
                              : current,
                          )
                        }
                        className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-400"
                        placeholder="Titulo da oportunidade"
                      />
                    ) : (
                      <h3 className="text-lg font-semibold text-slate-950">
                        {opportunity.title}
                      </h3>
                    )}
                    <PipelineStageBadge stage={opportunity.stage} />
                  </div>

                  {isEditing ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Valor
                        <input
                          value={editForm.value}
                          onChange={(event) =>
                            setEditForm((current) =>
                              current
                                ? { ...current, value: event.target.value }
                                : current,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-400"
                          placeholder="0,00"
                        />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Fechamento previsto
                        <input
                          type="date"
                          value={editForm.expectedCloseDate}
                          onChange={(event) =>
                            setEditForm((current) =>
                              current
                                ? {
                                    ...current,
                                    expectedCloseDate: event.target.value,
                                  }
                                : current,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-400"
                        />
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={editForm.preContract}
                          onChange={(event) =>
                            setEditForm((current) =>
                              current
                                ? {
                                    ...current,
                                    preContract: event.target.checked,
                                  }
                                : current,
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Pre-contrato registrado
                      </label>
                      <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                        Observacoes do pre-contrato
                        <textarea
                          value={editForm.preContractNotes}
                          onChange={(event) =>
                            setEditForm((current) =>
                              current
                                ? {
                                    ...current,
                                    preContractNotes: event.target.value,
                                  }
                                : current,
                            )
                          }
                          rows={3}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-400"
                        />
                      </label>
                    </div>
                  ) : (
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
                  )}

                  {opportunity.lostReason ? (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Motivo da perda: {opportunity.lostReason}
                    </div>
                  ) : null}

                  {opportunity.preContract ? (
                    <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                      Pre-contrato registrado
                      {opportunity.preContractNotes ? `: ${opportunity.preContractNotes}` : '.'}
                    </div>
                  ) : null}

                  {opportunity.quoteId ? (
                    <Link
                      href={`/quotes/${opportunity.quoteId}`}
                      className="mt-3 inline-flex rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Abrir cotacao vinculada
                    </Link>
                  ) : null}
                </div>

                <div className="w-full max-w-sm rounded-[22px] border border-slate-200 bg-white p-4">
                  {canEdit && onEdit ? (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            className="rounded-2xl px-4 py-2 text-sm"
                            onClick={async () => {
                              if (!editForm) return;
                              const value = editForm.value
                                ? Number(editForm.value.replace(',', '.'))
                                : null;

                              await onEdit(opportunity.id, {
                                title: editForm.title.trim(),
                                value: Number.isFinite(value) ? value : null,
                                expectedCloseDate:
                                  editForm.expectedCloseDate || null,
                                preContract: editForm.preContract,
                                preContractNotes:
                                  editForm.preContractNotes.trim() || null,
                              });
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Salvar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl px-4 py-2 text-sm"
                            onClick={() => {
                              setEditingId(null);
                              setEditForm(null);
                            }}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl px-4 py-2 text-sm"
                          onClick={() => {
                            setEditingId(opportunity.id);
                            setEditForm(opportunityToEditForm(opportunity));
                          }}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      )}
                    </div>
                  ) : null}

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
