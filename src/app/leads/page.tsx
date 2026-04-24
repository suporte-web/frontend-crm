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

export default function LeadsPage() {
  const { user, token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<LeadImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualLoading, setManualLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [whatsLoading, setWhatsLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState<{ title: string; message: string; variant: 'success' | 'error' } | null>(null);
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
      const [leadData, jobData] = await Promise.all([
        getLeads(token, filters),
        getLeadImportJobs(token),
      ]);
      setLeads(leadData);
      setJobs(jobData);
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
        title: 'Importacao concluida',
        message: `${job.successCount} lead(s) importado(s), ${job.ignoredCount} ignorado(s).`,
        variant: 'success',
      });
      return true;
    } catch (error) {
      setToast({
        title: 'Falha na importacao',
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
        title: 'Token obrigatorio',
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
        title: response.created ? 'Lead criado via WhatsApp' : 'Interacao registrada',
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
          Esta area e restrita aos perfis internos do CRM.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Captação
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
                Leads por cadastro manual, CSV e WhatsApp
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
                Nova area de captacao separada de clientes ativos, para manter o CRM
                seguro e incremental sem mexer no portal atual.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{summary.total}</p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Manual</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">{summary.manual}</p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">CSV</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{summary.imported}</p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">WhatsApp</p>
                <p className="mt-2 text-2xl font-bold text-green-700">{summary.whatsapp}</p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status new</p>
                <p className="mt-2 text-2xl font-bold text-violet-700">{summary.fresh}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <Tabs defaultValue="manual" className="gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Entradas de lead</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Fluxos pequenos e seguros para captar sem alterar o restante do CRM.
                </p>
              </div>
              <TabsList variant="line" className="w-fit">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="csv">CSV</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="manual">
              <div className="grid gap-6 xl:grid-cols-[1fr_.9fr]">
                <article className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">Cadastro manual</h3>
                      <p className="text-sm text-slate-500">
                        Cria lead com deduplicacao por e-mail ou telefone e timeline inicial.
                      </p>
                    </div>
                  </div>
                  <LeadForm loading={manualLoading} onSubmit={handleManualCreate} />
                </article>

                <article className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Regras aplicadas</h3>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      `source` padrao: <strong>manual</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      `status` padrao: <strong>new</strong>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Duplicidade bloqueada por e-mail; sem e-mail, por telefone.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Timeline inicial: <strong>Lead criado manualmente</strong>.
                    </div>
                  </div>
                </article>
              </div>
            </TabsContent>

            <TabsContent value="csv">
              <LeadImportPanel
                loading={importLoading}
                jobs={jobs}
                onImport={handleImport}
              />
            </TabsContent>

            <TabsContent value="whatsapp">
              <div className="grid gap-6 xl:grid-cols-[1fr_.9fr]">
                <article className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                      <MessageCircleMore className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        Simular entrada via WhatsApp
                      </h3>
                      <p className="text-sm text-slate-500">
                        Usa o endpoint de integracao real preparado para futura Cloud API.
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
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                        placeholder="Numero de origem"
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
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                        placeholder="externalContactId"
                      />
                    </div>

                    <textarea
                      rows={4}
                      value={whatsForm.notes}
                      onChange={(event) =>
                        setWhatsForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
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

                <article className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">Escopo desta fase</h3>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Endpoint com token simples para integracao futura oficial.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Duplicidade por telefone antes de criar novo lead.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Se ja existir lead, registra apenas nova interacao na timeline.
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      Sem inbox, sem envio massivo e sem scraping.
                    </div>
                  </div>
                </article>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Base de leads</h2>
              <p className="mt-2 text-sm text-slate-500">
                Lista consolidada com origem e ultimo historico registrado.
              </p>
            </div>

            <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-4">
              <input
                type="text"
                value={filters.q}
                onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                placeholder="Buscar por nome, e-mail ou empresa"
              />
              <input
                type="text"
                value={filters.source}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, source: event.target.value }))
                }
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                placeholder="source"
              />
              <input
                type="text"
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, status: event.target.value }))
                }
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
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
                  className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 lg:grid-cols-[1.5fr_1fr_.8fr_1.1fr_auto]"
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
                    <p className="mt-2 text-sm font-semibold text-slate-900">{lead.status}</p>
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
