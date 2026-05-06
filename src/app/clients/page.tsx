'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Download, PlusCircle, RefreshCcw, Search, ShieldCheck, Trash2, UsersRound, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { useAuth } from '@/context/auth-context';
import {
  decideClientDeletionRequest,
  getClientDeletionRequests,
  getCrmClientSummaries,
  requestClientDeletion,
} from '@/services/crm.service';
import { createUser } from '@/services/users.service';
import { formatLeadStatus } from '@/services/crm.service';
import type {
  ClientDeletionRequest,
  ClientDeletionRequestStatus,
  LeadStatus,
  LeadSummary,
} from '@/types/crm';

const statusStyles: Record<LeadStatus, string> = {
  ATIVO: 'bg-emerald-100 text-emerald-700',
  PENDENTE: 'bg-amber-100 text-amber-700',
  INATIVO: 'bg-rose-100 text-rose-700',
};

const initialClientForm = {
  name: '',
  email: '',
  password: '',
  companyName: '',
  phone: '',
  document: '',
  segment: '',
  status: 'PENDENTE' as LeadStatus,
};

const deletionStatusLabels: Record<ClientDeletionRequestStatus, string> = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  RECUSADA: 'Recusada',
  CANCELADA: 'Cancelada',
};

const deletionStatusStyles: Record<ClientDeletionRequestStatus, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700',
  APROVADA: 'bg-emerald-100 text-emerald-700',
  RECUSADA: 'bg-rose-100 text-rose-700',
  CANCELADA: 'bg-slate-100 text-slate-700',
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(date));
}

function exportClients(clients: LeadSummary[]) {
  const headers = ['Cliente', 'Email', 'Empresa', 'Segmento', 'Responsavel', 'Status', 'Criado em'];
  const csv = [headers, ...clients.map((client) => [
    client.name,
    client.email,
    client.company,
    client.segment,
    client.owner,
    client.status,
    formatDate(client.createdAt),
  ])]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ClientsPage() {
  const { token, user } = useAuth();
  const [clients, setClients] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | LeadStatus>('TODOS');
  const [deletionRequests, setDeletionRequests] = useState<ClientDeletionRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletionModalClient, setDeletionModalClient] = useState<LeadSummary | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [decisionRequest, setDecisionRequest] = useState<ClientDeletionRequest | null>(null);
  const [decisionMessage, setDecisionMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialClientForm);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);
  const isManagement = user?.role === 'GESTAO' || user?.role === 'ADMIN';

  async function loadClients() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError('');
      const [data, requests] = await Promise.all([
        getCrmClientSummaries(token),
        getClientDeletionRequests(token).catch(() => []),
      ]);
      setClients(data);
      setDeletionRequests(requests);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, [token]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus = statusFilter === 'TODOS' || client.status === statusFilter;
      const matchesSearch =
        !query ||
        [client.name, client.email, client.company, client.segment, client.owner]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [clients, search, statusFilter]);

  const summary = useMemo(() => {
    const active = clients.filter((client) => client.status === 'ATIVO').length;
    const pending = clients.filter((client) => client.status === 'PENDENTE').length;
    const month = new Date().toISOString().slice(0, 7);
    const newThisMonth = clients.filter((client) => client.createdAt.startsWith(month)).length;

    return {
      total: clients.length,
      active,
      pending,
      newThisMonth,
    };
  }, [clients]);

  const pendingDeletionByClientId = useMemo(
    () =>
      new Map(
        deletionRequests
          .filter((request) => request.status === 'PENDENTE' && request.clientId)
          .map((request) => [request.clientId as string, request]),
      ),
    [deletionRequests],
  );

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setToast({
        title: 'Campos obrigatorios',
        message: 'Informe nome, e-mail e senha inicial.',
        variant: 'error',
      });
      return;
    }

    try {
      setSaving(true);
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'CLIENTE',
        isActive: true,
        companyName: form.companyName.trim() || form.name.trim(),
        phone: form.phone.trim() || undefined,
        document: form.document.trim() || undefined,
        segment: form.segment.trim() || undefined,
        status: form.status,
        internalOwnerId: user?.id,
      });
      setToast({
        title: 'Cliente criado',
        message: 'Novo cliente registrado na base.',
        variant: 'success',
      });
      setForm(initialClientForm);
      setIsModalOpen(false);
      await loadClients();
    } catch (error) {
      setToast({
        title: 'Falha ao criar cliente',
        message: error instanceof Error ? error.message : 'Erro ao criar cliente.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestDeletion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !deletionModalClient) {
      return;
    }

    try {
      setSaving(true);
      await requestClientDeletion(
        deletionModalClient.id,
        { reason: deletionReason.trim() || undefined },
        token,
      );
      setToast({
        title: 'Solicitacao enviada',
        message: 'A exclusao do cliente foi enviada para aprovacao da Gestao.',
        variant: 'success',
      });
      setDeletionModalClient(null);
      setDeletionReason('');
      await loadClients();
    } catch (error) {
      setToast({
        title: 'Falha ao solicitar exclusao',
        message:
          error instanceof Error ? error.message : 'Erro ao solicitar exclusao.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletionDecision(action: 'APPROVE' | 'REJECT') {
    if (!token || !decisionRequest) {
      return;
    }

    try {
      setSaving(true);
      const result = await decideClientDeletionRequest(
        decisionRequest.id,
        {
          action,
          message: decisionMessage.trim() || undefined,
        },
        token,
      );
      setToast({
        title:
          action === 'APPROVE' ? 'Exclusao aprovada' : 'Solicitacao recusada',
        message: result.message,
        variant: 'success',
      });
      setDecisionRequest(null);
      setDecisionMessage('');
      await loadClients();
    } catch (error) {
      setToast({
        title: 'Falha ao analisar solicitacao',
        message:
          error instanceof Error ? error.message : 'Erro ao analisar solicitacao.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="crm-shell-card p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="crm-eyebrow">CRM</p>
              <h1 className="crm-page-title">Gestao de clientes</h1>
              <p className="crm-page-copy">
                Base real de clientes com cadastro, filtro, exportacao e acesso ao pipeline por conta.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => loadClients()}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCcw className="h-4 w-4" />
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => exportClients(filteredClients)}
                disabled={filteredClients.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Exportar lista
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <PlusCircle className="h-4 w-4" />
                Novo cliente
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total de clientes', summary.total, 'text-slate-950'],
            ['Ativos', summary.active, 'text-emerald-600'],
            ['Pendentes', summary.pending, 'text-amber-600'],
            ['Novos no mes', summary.newThisMonth, 'text-blue-600'],
          ].map(([label, value, color]) => (
            <article key={label} className="crm-kpi-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <h2 className={`mt-2 text-3xl font-bold ${color}`}>{value}</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <UsersRound className="h-5 w-5" />
                </div>
              </div>
            </article>
          ))}
        </section>

        {isManagement && deletionRequests.length > 0 ? (
          <section className="crm-shell-card overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 md:px-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Solicitacoes de exclusao
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Gestao aprova ou recusa a remocao definitiva de clientes.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {deletionRequests.slice(0, 6).map((request) => (
                <div
                  key={request.id}
                  className="grid gap-4 px-5 py-5 md:px-6 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {request.client?.companyName ||
                        request.client?.user?.name ||
                        request.clientNameSnapshot ||
                        'Cliente'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.client?.user?.email ||
                        request.clientEmailSnapshot ||
                        'Sem e-mail'}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-700">Solicitado por</p>
                    <p>{request.requestedBy?.name || 'Time interno'}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${deletionStatusStyles[request.status]}`}
                    >
                      {deletionStatusLabels[request.status]}
                    </span>
                    <p className="mt-2 text-sm text-slate-500">
                      {request.reason || 'Sem justificativa informada.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-start lg:justify-end">
                    {request.status === 'PENDENTE' ? (
                      <button
                        type="button"
                        onClick={() => setDecisionRequest(request)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Analisar
                      </button>
                    ) : (
                      <span className="text-sm text-slate-400">
                        {request.approvedBy?.name
                          ? `Analisado por ${request.approvedBy.name}`
                          : 'Concluido'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="crm-shell-card p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar cliente
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, email, empresa ou segmento"
                  className="crm-input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'TODOS' | LeadStatus)}
                className="crm-input"
              >
                <option value="TODOS">Todos</option>
                <option value="ATIVO">Ativo</option>
                <option value="PENDENTE">Pendente</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>
        </section>

        <section className="crm-shell-card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 md:px-6">
            <h2 className="text-lg font-semibold text-slate-900">Base de clientes</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredClients.length} cliente(s) encontrado(s)
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando clientes...</div>
          ) : pageError ? (
            <div className="p-10 text-center text-sm text-rose-600">{pageError}</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredClients.map((client) => {
                const pendingDeletion = pendingDeletionByClientId.get(client.id);

                return (
                <div
                  key={client.id}
                  className="grid gap-5 px-5 py-5 transition hover:bg-slate-50 lg:grid-cols-[1.5fr_1fr_.8fr_.9fr_auto] md:px-6"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">{client.company}</p>
                    <p className="mt-1 text-sm text-slate-500">{client.email}</p>
                    {pendingDeletion ? (
                      <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Exclusao aguardando Gestao
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-700 lg:hidden">Segmento</p>
                    <p>{client.segment}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700 lg:hidden">Status</p>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[client.status]
                      }`}
                    >
                      {formatLeadStatus(client.status)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{client.owner}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDate(client.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                    <Link
                      href={`/clients/${client.id}`}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Ver detalhes
                    </Link>
                    <button
                      type="button"
                      disabled={!!pendingDeletion}
                      onClick={() => setDeletionModalClient(client)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              )})}

              {filteredClients.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Nenhum cliente encontrado com os filtros atuais.
                </div>
              ) : null}
            </div>
          )}
        </section>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
            <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.16)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="crm-eyebrow">Novo cliente</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Cadastro de acesso do cliente
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="crm-input"
                  placeholder="Nome do usuario"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="crm-input"
                  placeholder="E-mail"
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="crm-input"
                  placeholder="Senha inicial"
                />
                <input
                  value={form.companyName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, companyName: event.target.value }))
                  }
                  className="crm-input"
                  placeholder="Empresa"
                />
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="crm-input"
                  placeholder="Telefone"
                />
                <input
                  value={form.document}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, document: event.target.value }))
                  }
                  className="crm-input"
                  placeholder="Documento"
                />
                <input
                  value={form.segment}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, segment: event.target.value }))
                  }
                  className="crm-input"
                  placeholder="Segmento"
                />
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as LeadStatus }))
                  }
                  className="crm-input"
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>

                <div className="flex justify-end gap-3 md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? 'Salvando...' : 'Salvar cliente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {deletionModalClient ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-xl rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.16)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="crm-eyebrow">Exclusao de cliente</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Solicitar aprovacao da Gestao
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    O cliente {deletionModalClient.company} so sera excluido
                    apos aprovacao formal da Gestao.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeletionModalClient(null);
                    setDeletionReason('');
                  }}
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={handleRequestDeletion} className="mt-6 space-y-4">
                <textarea
                  value={deletionReason}
                  onChange={(event) => setDeletionReason(event.target.value)}
                  className="crm-textarea"
                  rows={4}
                  placeholder="Motivo da exclusao"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeletionModalClient(null);
                      setDeletionReason('');
                    }}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                  >
                    {saving ? 'Enviando...' : 'Enviar para Gestao'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {decisionRequest ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-xl rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.16)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="crm-eyebrow">Analise da Gestao</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Aprovar ou recusar exclusao
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    O retorno sera registrado para o time comercial.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDecisionRequest(null);
                    setDecisionMessage('');
                  }}
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">
                  {decisionRequest.client?.companyName ||
                    decisionRequest.client?.user?.name ||
                    decisionRequest.clientNameSnapshot}
                </p>
                <p className="mt-1">{decisionRequest.reason || 'Sem motivo informado.'}</p>
              </div>

              <textarea
                value={decisionMessage}
                onChange={(event) => setDecisionMessage(event.target.value)}
                className="crm-textarea mt-4"
                rows={4}
                placeholder="Parecer da Gestao"
              />

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDeletionDecision('REJECT')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  Recusar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDeletionDecision('APPROVE')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Aprovar exclusao
                </button>
              </div>
            </div>
          </div>
        ) : null}
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
