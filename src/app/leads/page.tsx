'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MessageCircleMore, UserPlus } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { LeadForm } from '@/components/leads/lead-form';
import {
  getLeadSourceBadgeClass,
  getLeadSourceLabel,
} from '@/components/leads/lead-timeline';
import { LeadImportPanel } from '@/components/leads/lead-import-panel';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import {
  createLead,
  getLeadImportJobs,
  getLeads,
  importLeadsCsv,
  simulateWhatsAppLead,
} from '@/services/leads.service';
import type { Lead, LeadImportJob, ReceiveWhatsAppLeadPayload } from '@/types/leads';

const internalRoles = new Set(['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING']);

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function getLeadStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    new: 'Novo',
    qualified: 'Qualificado',
    converted: 'Convertido em cliente',
    converted_to_prospect: 'Convertido',
  };

  return status ? labels[status] ?? status : '-';
}

export default function LeadsPage() {
  const { user, token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<LeadImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualLoading, setManualLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [whatsLoading, setWhatsLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);
  const [filters, setFilters] = useState({
    q: '',
    source: '',
    status: '',
  });
  const [whatsForm, setWhatsForm] = useState({
    integrationToken: '',
    phone: '',
    name: '',
    company: '',
    sourcePhone: '',
    externalMessageId: '',
    externalContactId: '',
    notes: '',
  });

  const isAllowed = user?.role ? internalRoles.has(user.role) : false;

  async function loadData() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setPageError('');
      const leadData = await getLeads(token, filters);
      setLeads(leadData);

      try {
        const jobData = await getLeadImportJobs(token);
        setJobs(jobData);
      } catch {
        setJobs([]);
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Erro ao carregar os leads.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAllowed && token) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAllowed, token]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData();
  }

  async function handleManualCreate(payload: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    status?: string;
    notes?: string;
  }): Promise<boolean> {
    if (!token) {
      return false;
    }

    try {
      setManualLoading(true);
      const created = await createLead(payload, token);
      setLeads((prev) => [created, ...prev]);
      setToast({
        title: 'Lead criado',
        message: 'Cadastro manual concluido com sucesso.',
        variant: 'success',
      });
      return true;
    } catch (error) {
      setToast({
        title: 'Falha ao criar lead',
        message: error instanceof Error ? error.message : 'Erro ao criar lead.',
        variant: 'error',
      });
      return false;
    } finally {
      setManualLoading(false);
    }
  }

  async function handleImport(payload: {
    file: File;
    defaultSource?: string;
    defaultStatus?: string;
  }): Promise<boolean> {
    if (!token) {
      return false;
    }

    try {
      setImportLoading(true);
      const job = await importLeadsCsv(payload, token);
      setJobs((prev) => [job, ...prev.filter((item) => item.id !== job.id)]);
      await loadData();
      setToast({
        title: 'Importação concluída',
        message: `${job.successCount} lead(s) importado(s), ${job.ignoredCount} ignorado(s).`,
        variant: 'success',
      });
      return true;
    } catch (error) {
      setToast({
        title: 'Falha na importação',
        message: error instanceof Error ? error.message : 'Erro ao importar arquivo.',
        variant: 'error',
      });
      return false;
    } finally {
      setImportLoading(false);
    }
  }

  async function handleWhatsAppSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!whatsForm.integrationToken.trim()) {
      setToast({
        title: 'Token obrigatório',
        message: 'Informe o token de integracao do endpoint de WhatsApp.',
        variant: 'error',
      });
      return;
    }

    const payload: ReceiveWhatsAppLeadPayload = {
      phone: whatsForm.phone.trim(),
      name: whatsForm.name.trim() || undefined,
      company: whatsForm.company.trim() || undefined,
      sourcePhone: whatsForm.sourcePhone.trim() || undefined,
      externalMessageId: whatsForm.externalMessageId.trim() || undefined,
      externalContactId: whatsForm.externalContactId.trim() || undefined,
      notes: whatsForm.notes.trim() || undefined,
      channel: 'whatsapp',
      metadata: {
        simulatedBy: user?.email ?? 'interno',
      },
      rawPayload: {
        kind: 'manual_simulation',
      },
    };

    try {
      setWhatsLoading(true);
      const response = await simulateWhatsAppLead(
        payload,
        whatsForm.integrationToken.trim(),
      );
      await loadData();
      setToast({
        title: response.created ? 'Lead criado via WhatsApp' : 'Interação registrada',
        message: response.message,
        variant: 'success',
      });
    } catch (error) {
      setToast({
        title: 'Falha no WhatsApp',
        message: error instanceof Error ? error.message : 'Erro ao simular WhatsApp.',
        variant: 'error',
      });
    } finally {
      setWhatsLoading(false);
    }
  }

  const summary = useMemo(() => {
    const total = leads.length;
    const manual = leads.filter((lead) => lead.source === 'manual').length;
    const imported = leads.filter((lead) => lead.source === 'import_csv').length;
    const whatsapp = leads.filter((lead) => lead.source === 'whatsapp').length;
    const fresh = leads.filter((lead) => lead.status === 'new').length;

    return { total, manual, imported, whatsapp, fresh };
  }, [leads]);

  if (!isAllowed) {
    return (
      <AppLayout>
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Esta área e restrita aos perfis internos do CRM.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="crm-shell-card p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="crm-eyebrow">Captação</p>
              <h1 className="crm-page-title">Leads por cadastro manual, CSV e WhatsApp</h1>
              <p className="crm-page-copy">
                Falta fazer o fluxo"
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <article className="crm-soft-panel px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{summary.total}</p>
              </article>
              <article className="crm-soft-panel px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Manual</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">{summary.manual}</p>
              </article>
              <article className="crm-soft-panel px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CSV</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{summary.imported}</p>
              </article>
              <article className="crm-soft-panel px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">WhatsApp</p>
                <p className="mt-2 text-2xl font-bold text-green-700">{summary.whatsapp}</p>
              </article>
              <article className="crm-soft-panel px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status novo</p>
                <p className="mt-2 text-2xl font-bold text-violet-700">{summary.fresh}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="crm-shell-card p-6">
          <Tabs defaultValue="manual" className="gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Entradas de lead</h2>
              </div>
              <TabsList variant="line" className="w-fit">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="csv">CSV</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="manual">
              <div className="grid gap-6">
                <article className="crm-soft-panel p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">Cadastro manual</h3>
                      <p className="text-sm text-slate-500">
                        Entrada rápida.
                      </p>
                    </div>
                  </div>
                  <LeadForm loading={manualLoading} onSubmit={handleManualCreate} />
                </article>

                <article className="hidden">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">Regras da captação</h3>
                      <p className="text-sm text-slate-500">
                        Parametros atuais do CRM para manter a base limpa.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm leading-6 text-slate-600">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Origem padrao: <strong>manual</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Status padrao: <strong>novo</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Duplicidade por e-mail; sem e-mail, por telefone.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Timeline inicial criada automaticamente no backend.
                    </div>
                  </div>
                </article>
              </div>
            </TabsContent>

            <TabsContent value="csv">
              <LeadImportPanel loading={importLoading} jobs={jobs} onImport={handleImport} />
            </TabsContent>

            <TabsContent value="whatsapp">
              <div className="grid gap-6 xl:grid-cols-[1fr_.88fr]">
                <article className="crm-soft-panel p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                      <MessageCircleMore className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        Entrada via WhatsApp
                      </h3>
                      <p className="text-sm text-slate-500">
                        Teste o endpoint e valide o fluxo mínimo de captação por telefone.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Token de integracao
                      </label>
                      <input
                        type="text"
                        value={whatsForm.integrationToken}
                        onChange={(event) =>
                          setWhatsForm((prev) => ({
                            ...prev,
                            integrationToken: event.target.value,
                          }))
                        }
                        className="crm-input"
                        placeholder="Mesmo token configurado no backend"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Telefone
                        </label>
                        <input
                          type="text"
                          value={whatsForm.phone}
                          onChange={(event) =>
                            setWhatsForm((prev) => ({ ...prev, phone: event.target.value }))
                          }
                          className="crm-input"
                          placeholder="5511999999999"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Nome
                        </label>
                        <input
                          type="text"
                          value={whatsForm.name}
                          onChange={(event) =>
                            setWhatsForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                          className="crm-input"
                          placeholder="Contato via WhatsApp"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={whatsForm.company}
                        onChange={(event) =>
                          setWhatsForm((prev) => ({ ...prev, company: event.target.value }))
                        }
                        className="crm-input"
                        placeholder="Empresa"
                      />
                      <input
                        type="text"
                        value={whatsForm.sourcePhone}
                        onChange={(event) =>
                          setWhatsForm((prev) => ({
                            ...prev,
                            sourcePhone: event.target.value,
                          }))
                        }
                        className="crm-input"
                        placeholder="Número de origem"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={whatsForm.externalMessageId}
                        onChange={(event) =>
                          setWhatsForm((prev) => ({
                            ...prev,
                            externalMessageId: event.target.value,
                          }))
                        }
                        className="crm-input"
                        placeholder="externalMessageId"
                      />
                      <input
                        type="text"
                        value={whatsForm.externalContactId}
                        onChange={(event) =>
                          setWhatsForm((prev) => ({
                            ...prev,
                            externalContactId: event.target.value,
                          }))
                        }
                        className="crm-input"
                        placeholder="externalContactId"
                      />
                    </div>

                    <textarea
                      rows={4}
                      value={whatsForm.notes}
                      onChange={(event) =>
                        setWhatsForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      className="crm-textarea"
                      placeholder="Mensagem ou contexto recebido."
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={whatsLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                      >
                        {whatsLoading ? 'Processando...' : 'Simular webhook'}
                      </button>
                    </div>
                  </form>
                </article>

                <article className="crm-soft-panel p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Escopo desta fase</h3>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Recebimento de lead via webhook, sem inbox e sem envio de mensagem.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Deduplicação por telefone antes de abrir um novo cadastro.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Timeline registra criação ou nova interação do mesmo contato.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Estrutura pronta para encaixar Cloud API de forma oficial depois.
                    </div>
                  </div>
                </article>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <section className="crm-shell-card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="crm-eyebrow">Pipeline de entrada</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">Base de leads</h2>
              <p className="mt-2 text-sm text-slate-500">
                Visão de lista para comercial.
              </p>
            </div>

            <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-4">
              <input
                type="text"
                value={filters.q}
                onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                className="crm-input"
                placeholder="Buscar por nome, e-mail ou empresa"
              />
              <input
                type="text"
                value={filters.source}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, source: event.target.value }))
                }
                className="crm-input"
                placeholder="source"
              />
              <input
                type="text"
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, status: event.target.value }))
                }
                className="crm-input"
                placeholder="status"
              />
              <button
                type="submit"
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Filtrar
              </button>
            </form>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando leads...</div>
          ) : pageError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {pageError}
            </div>
          ) : leads.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Nenhum lead encontrado.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {leads.map((lead) => (
                <article
                  key={lead.id}
                  className="grid gap-4 rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 shadow-sm lg:grid-cols-[1.6fr_1fr_.8fr_1.1fr_auto]"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-950">{lead.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {lead.email || lead.phone || 'Sem contato principal'}
                    </p>
                    {lead.company ? (
                      <p className="mt-1 text-sm text-slate-400">{lead.company}</p>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Origem</p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getLeadSourceBadgeClass(
                        lead.source,
                      )}`}
                    >
                      {getLeadSourceLabel(lead.source)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {getLeadStatusLabel(lead.status)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Criado em
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{formatDate(lead.createdAt)}</p>
                  </div>

                  <div className="flex items-center justify-end">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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
