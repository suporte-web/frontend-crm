'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Edit3,
  Mail,
  Phone,
  PhoneCall,
  Save,
  UserRound,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { OpportunityList } from '@/components/crm/opportunity-list';
import { TimelineSection } from '@/components/crm/timeline-section';
import { Button } from '@/components/ui/button';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { useAuth } from '@/context/auth-context';
import {
  createTimelineContact,
  createOpportunity,
  formatLeadStatus,
  formatOpportunityStage,
  getCrmLeadById,
  getOpportunityStatusFromStage,
  updateClient,
  updateOpportunity,
  updateOpportunityStage,
} from '@/services/crm.service';
import type {
  LeadDetail,
  LeadStatus,
  Opportunity,
  OpportunityStage,
  TimelineEvent,
} from '@/types/crm';

const contactChannels = [
  'Ligacao',
  'WhatsApp',
  'E-mail',
  'Reuniao',
  'Visita',
  'Videochamada',
  'Outro',
] as const;

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

function toDateTimeLocalValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function clientToFormState(lead: LeadDetail) {
  return {
    name: lead.name ?? '',
    email: lead.email ?? '',
    companyName: lead.company ?? '',
    phone: lead.phone ?? '',
    document: lead.document ?? '',
    segment: lead.segment === '-' ? '' : lead.segment,
    status: lead.status,
    notes: lead.notes ?? '',
  };
}

export default function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token, user } = useAuth();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientId, setClientId] = useState('');
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [clientFormError, setClientFormError] = useState('');
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    companyName: '',
    phone: '',
    document: '',
    segment: '',
    status: 'PENDENTE' as LeadStatus,
    notes: '',
  });
  const [preContractForm, setPreContractForm] = useState({
    title: '',
    value: '',
    expectedCloseDate: '',
    notes: '',
  });
  const [contactForm, setContactForm] = useState({
    contactChannel: 'Ligacao',
    customContactChannel: '',
    contactPerson: '',
    contactedAt: toDateTimeLocalValue(),
    description: '',
  });
  const [savingPreContract, setSavingPreContract] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const canEditOpportunities = user?.role
    ? ['ADMIN', 'GESTAO', 'COMERCIAL'].includes(user.role)
    : false;
  const canEditClient = canEditOpportunities;
  const isDarkScreen = false;

  useEffect(() => {
    let active = true;

    async function loadLead() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const { id } = await params;
        setClientId(id);
        const nextLead = await getCrmLeadById(id, token);

        if (!active) {
          return;
        }

        if (!nextLead) {
          setError('Cliente não encontrado.');
          setLead(null);
          return;
        }

        setLead(nextLead);
        setClientForm(clientToFormState(nextLead));
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
  }, [params, token]);

  async function reloadClient() {
    if (!token || !clientId) {
      return;
    }

    const nextLead = await getCrmLeadById(clientId, token);
    setLead(nextLead);
    if (nextLead) {
      setClientForm(clientToFormState(nextLead));
    }
  }

  const openValue = useMemo(
    () =>
      (lead?.opportunities ?? [])
        .filter((opportunity) => opportunity.status === 'OPEN')
        .reduce((total, opportunity) => total + (opportunity.value ?? 0), 0),
    [lead],
  );

  async function handleUpdateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      setClientFormError('Informe nome e e-mail do cliente.');
      setToast({
        title: 'Campos obrigatórios',
        message: 'Informe nome e e-mail do cliente.',
        variant: 'error',
      });
      return;
    }

    try {
      setSavingClient(true);
      setClientFormError('');
      await updateClient(
        lead.id,
        {
          name: clientForm.name.trim(),
          email: clientForm.email.trim(),
          companyName: clientForm.companyName.trim() || clientForm.name.trim(),
          phone: clientForm.phone.trim() || undefined,
          document: clientForm.document.trim() || undefined,
          segment: clientForm.segment.trim() || undefined,
          status: clientForm.status,
          notes: clientForm.notes.trim() || undefined,
        },
        token,
      );
      await reloadClient();
      setIsEditingClient(false);
      setToast({
        title: 'Cliente atualizado',
        message: 'Cadastro salvo com sucesso.',
        variant: 'success',
      });
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Erro ao atualizar cliente.';
      setClientFormError(message);
      setToast({
        title: 'Falha ao atualizar cliente',
        message,
        variant: 'error',
      });
    } finally {
      setSavingClient(false);
    }
  }

  async function handleStageChange(opportunityId: string, stage: OpportunityStage) {
    if (!token) {
      return;
    }

    try {
      await updateOpportunityStage(opportunityId, stage, token);
      setToast({
        title: 'Oportunidade atualizada',
        message: `Etapa alterada para ${formatOpportunityStage(stage)}.`,
        variant: 'success',
      });
    } catch (stageError) {
      setToast({
        title: 'Falha ao atualizar oportunidade',
        message:
          stageError instanceof Error
            ? stageError.message
            : 'Erro ao alterar etapa.',
        variant: 'error',
      });
      return;
    }

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

  async function handleMarkLost(opportunityId: string, reason: string) {
    if (!token) {
      return;
    }

    const trimmedReason = reason.trim() || 'Motivo não informado.';

    try {
      await updateOpportunityStage(opportunityId, 'PERDIDO', token, trimmedReason);
      setToast({
        title: 'Oportunidade atualizada',
        message: 'Perda registrada com sucesso.',
        variant: 'success',
      });
    } catch (lostError) {
      setToast({
        title: 'Falha ao registrar perda',
        message:
          lostError instanceof Error
            ? lostError.message
            : 'Erro ao marcar oportunidade como perdida.',
        variant: 'error',
      });
      return;
    }

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

  async function handleEditOpportunity(
    opportunityId: string,
    payload: Partial<
      Pick<
        Opportunity,
        | 'title'
        | 'value'
        | 'expectedCloseDate'
        | 'preContract'
        | 'preContractNotes'
      >
    >,
  ) {
    if (!token) {
      return;
    }

    if (payload.title !== undefined && !payload.title.trim()) {
      setToast({
        title: 'Título obrigatório',
        message: 'Informe o título da oportunidade.',
        variant: 'error',
      });
      return;
    }

    try {
      await updateOpportunity(opportunityId, payload, token);
      await reloadClient();
      setToast({
        title: 'Oportunidade atualizada',
        message: 'Dados comerciais salvos com sucesso.',
        variant: 'success',
      });
    } catch (editError) {
      setToast({
        title: 'Falha ao editar oportunidade',
        message:
          editError instanceof Error
            ? editError.message
            : 'Erro ao editar oportunidade.',
        variant: 'error',
      });
    }
  }

  async function handleCreateContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    const description = contactForm.description.trim();
    const contactChannel =
      contactForm.contactChannel === 'Outro'
        ? contactForm.customContactChannel.trim()
        : contactForm.contactChannel;

    if (!description) {
      setToast({
        title: 'Resumo obrigatório',
        message: 'Descreva o que foi tratado no contato.',
        variant: 'error',
      });
      return;
    }

    if (!contactChannel) {
      setToast({
        title: 'Canal obrigatório',
        message: 'Informe como o cliente foi contatado.',
        variant: 'error',
      });
      return;
    }

    try {
      setSavingContact(true);
      const nextEvent = await createTimelineContact(
        lead.id,
        {
          title: 'Contato com cliente',
          description,
          contactChannel,
          contactPerson: contactForm.contactPerson.trim() || undefined,
          contactedAt: contactForm.contactedAt || undefined,
        },
        token,
      );

      setLead((current) =>
        current
          ? {
              ...current,
              lastContactAt: nextEvent.createdAt,
              timeline: [nextEvent, ...current.timeline],
            }
          : current,
      );
      setContactForm({
        contactChannel: contactForm.contactChannel,
        customContactChannel:
          contactForm.contactChannel === 'Outro' ? contactForm.customContactChannel : '',
        contactPerson: '',
        contactedAt: toDateTimeLocalValue(),
        description: '',
      });
      setToast({
        title: 'Contato registrado',
        message: 'Histórico do cliente atualizado com sucesso.',
        variant: 'success',
      });
    } catch (contactError) {
      setToast({
        title: 'Falha ao registrar contato',
        message:
          contactError instanceof Error
            ? contactError.message
            : 'Erro ao registrar contato.',
        variant: 'error',
      });
    } finally {
      setSavingContact(false);
    }
  }

  async function handleCreatePreContract(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    try {
      setSavingPreContract(true);
      await createOpportunity(
        {
          clientId: lead.id,
          title: preContractForm.title.trim() || 'Pré-contrato comercial',
          value: preContractForm.value
            ? Number(preContractForm.value.replace(',', '.'))
            : undefined,
          expectedCloseDate: preContractForm.expectedCloseDate || undefined,
          preContract: true,
          preContractNotes: preContractForm.notes.trim() || undefined,
          stage: 'PROPOSTA',
        },
        token,
      );
      setPreContractForm({
        title: '',
        value: '',
        expectedCloseDate: '',
        notes: '',
      });
      await reloadClient();
      setToast({
        title: 'Pré-contrato incluido',
        message: 'Oportunidade comercial registrada com sucesso.',
        variant: 'success',
      });
    } catch (preContractError) {
      setToast({
        title: 'Falha ao incluir pré-contrato',
        message:
          preContractError instanceof Error
            ? preContractError.message
            : 'Erro ao incluir pré-contrato.',
        variant: 'error',
      });
    } finally {
      setSavingPreContract(false);
    }
  }

  return (
    <AppLayout>
      <div
        className={`mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[32px] p-3 transition-colors md:p-4 ${
          isDarkScreen
            ? 'bg-slate-950 text-white [&_.crm-input]:border-slate-700 [&_.crm-input]:bg-slate-950 [&_.crm-input]:text-white [&_.crm-textarea]:border-slate-700 [&_.crm-textarea]:bg-slate-950 [&_.crm-textarea]:text-white [&_section]:border-slate-700'
            : 'bg-transparent text-slate-950'
        }`}
      >
        <section
          className={`overflow-hidden rounded-[28px] border shadow-sm ${
            isDarkScreen ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_.8fr] lg:p-8">
            <div>
              <Link
                href="/clients"
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                  isDarkScreen
                    ? 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar para clientes
              </Link>

              {loading ? (
                <div className={`mt-6 text-sm ${isDarkScreen ? 'text-slate-400' : 'text-slate-500'}`}>
                  Carregando cliente...
                </div>
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

                  <h1
                    className={`mt-4 text-3xl font-bold tracking-tight md:text-4xl ${
                      isDarkScreen ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {lead.company}
                  </h1>

                  <p
                    className={`mt-3 max-w-3xl text-sm leading-6 md:text-base ${
                      isDarkScreen ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {lead.notes ??
                      'Conta comercial com histórico de atividades e oportunidades em andamento.'}
                  </p>

                  <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                    <div
                      className={`rounded-2xl border p-4 ${
                        isDarkScreen
                          ? 'border-slate-700 bg-slate-950 text-slate-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Responsável
                      </p>
                      <p className={`mt-2 font-semibold ${isDarkScreen ? 'text-white' : 'text-slate-900'}`}>
                        {lead.owner}
                      </p>
                    </div>
                    <div
                      className={`rounded-2xl border p-4 ${
                        isDarkScreen
                          ? 'border-slate-700 bg-slate-950 text-slate-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Ultimo contato
                      </p>
                      <p className={`mt-2 font-semibold ${isDarkScreen ? 'text-white' : 'text-slate-900'}`}>
                        {formatDate(lead.lastContactAt)}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {lead ? (
              <div
                className={`rounded-[24px] border p-5 ${
                  isDarkScreen
                    ? 'border-slate-700 bg-slate-950'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className={`text-sm font-medium ${isDarkScreen ? 'text-slate-300' : 'text-slate-500'}`}>
                  Visão da conta
                </p>

                <div className="mt-5 space-y-3">
                  <div className={`rounded-2xl p-4 shadow-sm ${isDarkScreen ? 'bg-slate-900' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Segmento
                        </p>
                        <p className={`mt-1 text-sm font-semibold ${isDarkScreen ? 'text-white' : 'text-slate-900'}`}>
                          {lead.segment}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl p-4 shadow-sm ${isDarkScreen ? 'bg-slate-900' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Contato
                        </p>
                        <p className={`mt-1 text-sm font-semibold ${isDarkScreen ? 'text-white' : 'text-slate-900'}`}>
                          {lead.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl p-4 shadow-sm ${isDarkScreen ? 'bg-slate-900' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Telefone
                        </p>
                        <p className={`mt-1 text-sm font-semibold ${isDarkScreen ? 'text-white' : 'text-slate-900'}`}>
                          {lead.phone ?? '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl p-4 shadow-sm ${isDarkScreen ? 'bg-slate-900' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Valor em aberto
                        </p>
                        <p className={`mt-1 text-sm font-semibold ${isDarkScreen ? 'text-white' : 'text-slate-900'}`}>
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
            <section
              className={`rounded-[28px] border p-5 shadow-sm md:p-6 ${
                isDarkScreen
                  ? 'border-slate-700 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Cadastro
                  </p>
                  <h2
                    className={`mt-2 text-2xl font-bold ${
                      isDarkScreen ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    Dados do cliente
                  </h2>
                </div>

                {canEditClient ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingClient((current) => !current);
                      setClientForm(clientToFormState(lead));
                      setClientFormError('');
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                      isDarkScreen
                        ? 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isEditingClient ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Edit3 className="h-4 w-4" />
                    )}
                    {isEditingClient ? 'Cancelar edição' : 'Editar cadastro'}
                  </button>
                ) : null}
              </div>

              {isEditingClient ? (
                <form onSubmit={handleUpdateClient} className="mt-5 grid gap-4 md:grid-cols-2">
                  {clientFormError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
                      {clientFormError}
                    </div>
                  ) : null}

                  <input
                    value={clientForm.name}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="crm-input"
                    placeholder="Nome do usuário"
                  />
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="crm-input"
                    placeholder="E-mail"
                  />
                  <input
                    value={clientForm.companyName}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, companyName: event.target.value }))
                    }
                    className="crm-input"
                    placeholder="Empresa"
                  />
                  <input
                    value={clientForm.phone}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    className="crm-input"
                    placeholder="Telefone"
                  />
                  <input
                    value={clientForm.document}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, document: event.target.value }))
                    }
                    className="crm-input"
                    placeholder="Documento"
                  />
                  <input
                    value={clientForm.segment}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, segment: event.target.value }))
                    }
                    className="crm-input"
                    placeholder="Segmento"
                  />
                  <select
                    value={clientForm.status}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        status: event.target.value as LeadStatus,
                      }))
                    }
                    className="crm-input"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                  <textarea
                    value={clientForm.notes}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, notes: event.target.value }))
                    }
                    className="crm-textarea md:col-span-2"
                    rows={3}
                    placeholder="Observações cadastrais"
                  />
                  <div className="flex justify-end md:col-span-2">
                    <button
                      type="submit"
                      disabled={savingClient}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {savingClient ? 'Salvando...' : 'Salvar cadastro'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Nome', lead.name],
                    ['E-mail', lead.email],
                    ['Empresa', lead.company],
                    ['Telefone', lead.phone ?? '-'],
                    ['Documento', lead.document ?? '-'],
                    ['Segmento', lead.segment],
                    ['Status', formatLeadStatus(lead.status)],
                    ['Observações', lead.notes ?? '-'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className={`rounded-2xl p-4 text-sm ${
                        isDarkScreen ? 'bg-slate-950' : 'bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {label}
                      </p>
                      <p
                        className={`mt-2 font-semibold ${
                          isDarkScreen ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {canEditClient ? (
              <section
                className={`rounded-[28px] border p-5 shadow-sm md:p-6 ${
                  isDarkScreen
                    ? 'border-slate-700 bg-slate-900'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                      Contato
                    </p>
                    <h2
                      className={`mt-2 text-2xl font-bold ${
                        isDarkScreen ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      Registrar contato com o cliente
                    </h2>
                    <p className={`mt-2 text-sm ${isDarkScreen ? 'text-slate-300' : 'text-slate-500'}`}>
                      Cada registro entra na linha do tempo com quem fez o contato.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                </div>

                <form onSubmit={handleCreateContact} className="mt-5 grid gap-4 lg:grid-cols-4">
                  <select
                    value={contactForm.contactChannel}
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        contactChannel: event.target.value,
                        customContactChannel:
                          event.target.value === 'Outro' ? current.customContactChannel : '',
                      }))
                    }
                    className="crm-input"
                  >
                    {contactChannels.map((channel) => (
                      <option key={channel} value={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                  {contactForm.contactChannel === 'Outro' ? (
                    <input
                      type="text"
                      value={contactForm.customContactChannel}
                      onChange={(event) =>
                        setContactForm((current) => ({
                          ...current,
                          customContactChannel: event.target.value,
                        }))
                      }
                      className="crm-input"
                      placeholder="Canal personalizado"
                    />
                  ) : null}
                  <input
                    type="text"
                    value={contactForm.contactPerson}
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        contactPerson: event.target.value,
                      }))
                    }
                    className="crm-input"
                    placeholder="Pessoa contatada"
                  />
                  <input
                    type="datetime-local"
                    value={contactForm.contactedAt}
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        contactedAt: event.target.value,
                      }))
                    }
                    className="crm-input"
                  />
                  <button
                    type="submit"
                    disabled={savingContact}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    <PhoneCall className="h-4 w-4" />
                    {savingContact ? 'Registrando...' : 'Registrar contato'}
                  </button>
                  <textarea
                    value={contactForm.description}
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="crm-textarea lg:col-span-4"
                    placeholder="Resumo do contato, retorno combinado ou próxima ação"
                  />
                </form>
              </section>
            ) : null}

            <OpportunityList
              opportunities={lead.opportunities}
              onStageChange={handleStageChange}
              onMarkLost={handleMarkLost}
              canEdit={canEditOpportunities}
              onEdit={handleEditOpportunity}
              darkMode={isDarkScreen}
            />
            <section
              className={`rounded-[28px] border p-5 shadow-sm md:p-6 ${
                isDarkScreen
                  ? 'border-slate-700 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Pré-contrato
                </p>
                <h2
                  className={`mt-2 text-2xl font-bold ${
                    isDarkScreen ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  Registrar proposta como pré-contrato
                </h2>
              </div>

              <form onSubmit={handleCreatePreContract} className="mt-5 grid gap-4 lg:grid-cols-4">
                <input
                  type="text"
                  value={preContractForm.title}
                  onChange={(event) =>
                    setPreContractForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="crm-input"
                  placeholder="Título do pré-contrato"
                />
                <input
                  type="text"
                  value={preContractForm.value}
                  onChange={(event) =>
                    setPreContractForm((current) => ({
                      ...current,
                      value: event.target.value,
                    }))
                  }
                  className="crm-input"
                  placeholder="Valor estimado"
                />
                <input
                  type="date"
                  value={preContractForm.expectedCloseDate}
                  onChange={(event) =>
                    setPreContractForm((current) => ({
                      ...current,
                      expectedCloseDate: event.target.value,
                    }))
                  }
                  className="crm-input"
                />
                <button
                  type="submit"
                  disabled={savingPreContract}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingPreContract ? 'Salvando...' : 'Incluir pré-contrato'}
                </button>
                <textarea
                  value={preContractForm.notes}
                  onChange={(event) =>
                    setPreContractForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                  className="crm-textarea lg:col-span-4"
                  placeholder="Condições, observações ou combinados comerciais"
                />
              </form>
            </section>
            <TimelineSection events={lead.timeline} darkMode={isDarkScreen} />
          </>
        ) : loading ? null : (
          <section
            className={`rounded-[28px] border p-10 text-center shadow-sm ${
              isDarkScreen
                ? 'border-slate-700 bg-slate-900'
                : 'border-slate-200 bg-white'
            }`}
          >
            <p className={`text-sm ${isDarkScreen ? 'text-slate-300' : 'text-slate-500'}`}>
              Não foi possível carregar os dados deste cliente.
            </p>
            <Button asChild className="mt-4 rounded-2xl px-4 py-2 text-sm">
              <Link href="/clients">Voltar para a lista</Link>
            </Button>
          </section>
        )}
      </div>
      <FeedbackToast
        open={!!toast}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'success'}
        onClose={() => setToast(null)}
      />
    </AppLayout>
  );
}
