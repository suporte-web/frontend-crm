'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Building2, FileStack, PlusCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { useAuth } from '@/context/auth-context';
import { createQuote, getAllQuotes, getMyQuotes } from '@/services/quotes.service';
import type { CreateQuotePayload, Quote, QuoteStatus } from '@/types/quotes';

type QuoteFormState = {
  origin: string;
  destination: string;
  serviceType: string;
  requestType: string;
  pickupAddress: string;
  deliveryAddress: string;
  cargoDescription: string;
  contactName: string;
  contactPhone: string;
  weight: string;
  volume: string;
  quantity: string;
  merchandiseValue: string;
  desiredDeadline: string;
  notes: string;
};

const initialFormState: QuoteFormState = {
  origin: '',
  destination: '',
  serviceType: '',
  requestType: '',
  pickupAddress: '',
  deliveryAddress: '',
  cargoDescription: '',
  contactName: '',
  contactPhone: '',
  weight: '',
  volume: '',
  quantity: '',
  merchandiseValue: '',
  desiredDeadline: '',
  notes: '',
};

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date?: string | null) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(date));
}

function getStatusLabel(status: QuoteStatus) {
  const map: Record<QuoteStatus, string> = {
    RECEIVED: 'Recebida',
    IN_ANALYSIS: 'Em analise',
    ANSWERED: 'Respondida',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
  };

  return map[status];
}

function getStatusClasses(status: QuoteStatus) {
  const map: Record<QuoteStatus, string> = {
    RECEIVED: 'bg-sky-100 text-sky-800 border-sky-200',
    IN_ANALYSIS: 'bg-amber-100 text-amber-800 border-amber-200',
    ANSWERED: 'bg-violet-100 text-violet-800 border-violet-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  return map[status];
}

function getClientName(quote: Quote) {
  return quote.client?.companyName || quote.client?.user?.name || 'Cliente';
}

export default function QuotesPage() {
  const { user, token } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | QuoteStatus>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorToastMessage, setErrorToastMessage] = useState('');
  const [form, setForm] = useState<QuoteFormState>(initialFormState);

  const isClient = user?.role === 'CLIENTE';

  async function loadQuotes() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError('');
      const data = isClient ? await getMyQuotes(token) : await getAllQuotes(token);
      setQuotes(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Erro ao carregar cotacoes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes();
  }, [token, isClient]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorToastMessage) return;
    const timer = setTimeout(() => setErrorToastMessage(''), 6000);
    return () => clearTimeout(timer);
  }, [errorToastMessage]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const haystack = [
        quote.origin,
        quote.destination,
        quote.serviceType,
        quote.requestType ?? '',
        getClientName(quote),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'TODOS' || quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: quotes.length,
      answered: quotes.filter((q) => q.status === 'ANSWERED').length,
      pending: quotes.filter(
        (q) => q.status === 'RECEIVED' || q.status === 'IN_ANALYSIS',
      ).length,
      totalValue: quotes.reduce((acc, item) => acc + Number(item.price ?? 0), 0),
    };
  }, [quotes]);

  function resetForm() {
    setForm(initialFormState);
    setFormError('');
  }

  function validateForm() {
    if (!form.origin.trim()) return 'Informe a origem.';
    if (!form.destination.trim()) return 'Informe o destino.';
    if (!form.serviceType.trim()) return 'Informe o tipo de servico.';
    if (!form.requestType.trim()) return 'Informe se e cotacao avulsa ou contrato.';
    if (!form.cargoDescription.trim()) return 'Descreva a carga ou servico.';
    if (!form.contactName.trim()) return 'Informe o nome do contato.';
    if (!form.contactPhone.trim()) return 'Informe o telefone do contato.';
    return '';
  }

  async function handleCreateQuote() {
    if (!token) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      setErrorToastMessage(validationError);
      return;
    }

    const payload: CreateQuotePayload = {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      serviceType: form.serviceType.trim(),
      requestType: form.requestType.trim(),
      pickupAddress: form.pickupAddress.trim() || undefined,
      deliveryAddress: form.deliveryAddress.trim() || undefined,
      cargoDescription: form.cargoDescription.trim(),
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      weight: form.weight ? Number(form.weight.replace(',', '.')) : undefined,
      volume: form.volume ? Number(form.volume.replace(',', '.')) : undefined,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      merchandiseValue: form.merchandiseValue
        ? Number(form.merchandiseValue.replace(',', '.'))
        : undefined,
      desiredDeadline: form.desiredDeadline || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      setSaving(true);
      setFormError('');
      const created = await createQuote(payload, token);
      setQuotes((prev) => [created, ...prev]);
      setSuccessMessage('Cotacao enviada com sucesso.');
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar cotacao.';
      setFormError(message);
      setErrorToastMessage(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="crm-shell-card p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="crm-eyebrow">{isClient ? 'Solicitacoes' : 'Pipeline comercial'}</p>
              <h1 className="crm-page-title">Cotacoes</h1>
              <p className="crm-page-copy">
                {isClient
                  ? 'Solicite servicos com mais contexto operacional e acompanhe o retorno comercial com mais clareza.'
                  : 'Visual empresarial para leitura de volume, resposta e contexto operacional de cada pedido.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isClient ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/clients"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Clientes
                  </Link>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(true);
                  setFormError('');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <PlusCircle className="h-4 w-4" />
                Nova cotacao
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="crm-kpi-card">
            <p className="text-sm text-slate-500">Total de cotacoes</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</h2>
          </article>
          <article className="crm-kpi-card">
            <p className="text-sm text-slate-500">Respondidas</p>
            <h2 className="mt-2 text-3xl font-bold text-violet-600">{stats.answered}</h2>
          </article>
          <article className="crm-kpi-card">
            <p className="text-sm text-slate-500">Em andamento</p>
            <h2 className="mt-2 text-3xl font-bold text-amber-600">{stats.pending}</h2>
          </article>
          <article className="crm-kpi-card">
            <p className="text-sm text-slate-500">Valor respondido</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              {formatCurrency(stats.totalValue)}
            </h2>
          </article>
        </section>

        <section className="crm-shell-card p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar cotacao
              </label>
              <input
                type="text"
                placeholder="Buscar por cliente, origem, destino ou servico..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="crm-input"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filtrar por status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'TODOS' | QuoteStatus)}
                className="crm-input"
              >
                <option value="TODOS">Todos</option>
                <option value="RECEIVED">Recebida</option>
                <option value="IN_ANALYSIS">Em analise</option>
                <option value="ANSWERED">Respondida</option>
                <option value="APPROVED">Aprovada</option>
                <option value="REJECTED">Rejeitada</option>
              </select>
            </div>
          </div>
        </section>

        <section className="crm-shell-card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Lista de cotacoes</h3>
            <p className="mt-1 text-sm text-slate-500">
              {filteredQuotes.length} registro(s) encontrado(s)
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando cotacoes...</div>
          ) : pageError ? (
            <div className="p-10 text-center text-sm text-rose-600">{pageError}</div>
          ) : (
            <div className="grid gap-4 p-4">
              {filteredQuotes.map((quote) => (
                <article
                  key={quote.id}
                  className="rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            quote.status,
                          )}`}
                        >
                          {getStatusLabel(quote.status)}
                        </span>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {formatDate(quote.createdAt)}
                        </span>
                      </div>

                      <h4 className="mt-3 text-2xl font-bold text-slate-950">
                        {quote.serviceType}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {quote.origin} {'->'} {quote.destination}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Building2 className="h-3.5 w-3.5" />
                        {isClient ? 'Solicitacao enviada' : getClientName(quote)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Ver detalhes
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="crm-soft-panel p-4 text-sm">
                      <p className="text-slate-500">Tipo de solicitacao</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {quote.requestType || '-'}
                      </p>
                    </div>
                    <div className="crm-soft-panel p-4 text-sm">
                      <p className="text-slate-500">Peso</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {quote.weight ? `${quote.weight} kg` : '-'}
                      </p>
                    </div>
                    <div className="crm-soft-panel p-4 text-sm">
                      <p className="text-slate-500">Valor da mercadoria</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatCurrency(quote.merchandiseValue)}
                      </p>
                    </div>
                    <div className="crm-soft-panel p-4 text-sm">
                      <p className="text-slate-500">Prazo desejado</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatDate(quote.desiredDeadline)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}

              {filteredQuotes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Nenhuma cotacao encontrada com os filtros atuais.
                </div>
              ) : null}
            </div>
          )}
        </section>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-5xl rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_32px_90px_rgba(15,23,42,0.16)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="crm-eyebrow">Nova solicitacao</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-950">Nova cotacao</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Quanto mais contexto operacional entrar aqui, melhor fica a resposta comercial.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError('');
                  }}
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {formError ? (
                  <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Origem</label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Destino</label>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, destination: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo de servico
                  </label>
                  <input
                    type="text"
                    value={form.serviceType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, serviceType: e.target.value }))
                    }
                    placeholder="Ex: Transporte fracionado"
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo de solicitacao
                  </label>
                  <select
                    value={form.requestType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, requestType: e.target.value }))
                    }
                    className="crm-input"
                  >
                    <option value="">Selecione</option>
                    <option value="Avulsa">Avulsa</option>
                    <option value="Contrato">Contrato</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Endereco de coleta
                  </label>
                  <input
                    type="text"
                    value={form.pickupAddress}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, pickupAddress: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Endereco de entrega
                  </label>
                  <input
                    type="text"
                    value={form.deliveryAddress}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Descricao da carga / servico
                  </label>
                  <textarea
                    value={form.cargoDescription}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, cargoDescription: e.target.value }))
                    }
                    rows={3}
                    className="crm-textarea"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Contato responsavel
                  </label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, contactName: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Telefone do contato
                  </label>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, contactPhone: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Peso estimado (kg)
                  </label>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Volume (m3)
                  </label>
                  <input
                    type="text"
                    value={form.volume}
                    onChange={(e) => setForm((prev) => ({ ...prev, volume: e.target.value }))}
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Valor da mercadoria
                  </label>
                  <input
                    type="text"
                    value={form.merchandiseValue}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, merchandiseValue: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Prazo desejado
                  </label>
                  <input
                    type="date"
                    value={form.desiredDeadline}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, desiredDeadline: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Observacoes adicionais
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="crm-textarea"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError('');
                  }}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCreateQuote}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  <FileStack className="h-4 w-4" />
                  {saving ? 'Enviando...' : 'Salvar cotacao'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <FeedbackToast
          open={!!successMessage}
          title="Sucesso"
          message={successMessage}
          variant="success"
          onClose={() => setSuccessMessage('')}
        />

        <FeedbackToast
          open={!!errorToastMessage}
          title="Atencao"
          message={errorToastMessage}
          variant="error"
          onClose={() => setErrorToastMessage('')}
          bottomClassName="bottom-24"
        />
      </div>
    </AppLayout>
  );
}
