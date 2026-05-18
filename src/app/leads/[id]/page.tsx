'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import {
  getLeadSourceBadgeClass,
  getLeadSourceLabel,
  LeadTimeline,
} from '@/components/leads/lead-timeline';
import { useAuth } from '@/context/auth-context';
import { convertLeadToClient, getLeadById } from '@/services/leads.service';
import type { Lead } from '@/types/leads';

const internalRoles = new Set(['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING']);
const converterRoles = new Set(['ADMIN', 'GESTAO', 'COMERCIAL']);

function formatDate(date?: string | null) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertForm, setConvertForm] = useState({
    document: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    companyName: '',
    segment: '',
    status: 'PENDENTE',
  });
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const isAllowed = user?.role ? internalRoles.has(user.role) : false;
  const canConvert = user?.role ? converterRoles.has(user.role) : false;
  const isConverted = lead?.status === 'converted';

  useEffect(() => {
    async function loadLead() {
      if (!token || !id) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getLeadById(id, token);
        setLead(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar lead.');
      } finally {
        setLoading(false);
      }
    }

    if (isAllowed && token && id) {
      loadLead();
    } else {
      setLoading(false);
    }
  }, [id, isAllowed, token]);

  function openConvertModal() {
    if (!lead) {
      return;
    }

    setConvertForm({
      document: '',
      password: '',
      name: lead.name ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      companyName: lead.company ?? lead.name ?? '',
      segment: '',
      status: 'PENDENTE',
    });
    setConvertOpen(true);
  }

  async function handleConvertLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    if (!convertForm.document.trim()) {
      setToast({
        title: 'CNPJ obrigatório',
        message: 'Informe o CNPJ/documento para converter em cliente.',
        variant: 'error',
      });
      return;
    }

    if (!convertForm.email.trim()) {
      setToast({
        title: 'E-mail obrigatório',
        message: 'Informe o e-mail para criar o acesso do cliente.',
        variant: 'error',
      });
      return;
    }

    if (convertForm.password.trim().length < 6) {
      setToast({
        title: 'Senha obrigatória',
        message: 'A senha inicial precisa ter pelo menos 6 caracteres.',
        variant: 'error',
      });
      return;
    }

    try {
      setConverting(true);
      const response = await convertLeadToClient(
        lead.id,
        {
          document: convertForm.document.trim(),
          password: convertForm.password.trim(),
          name: convertForm.name.trim() || lead.name,
          email: convertForm.email.trim(),
          phone: convertForm.phone.trim() || undefined,
          companyName: convertForm.companyName.trim() || convertForm.name.trim() || lead.name,
          segment: convertForm.segment.trim() || undefined,
          status: convertForm.status,
        },
        token,
      );
      setLead(response.lead);
      setConvertOpen(false);
      setToast({
        title: 'Lead convertido',
        message: 'Cliente criado com acesso ao portal.',
        variant: 'success',
      });
    } catch (convertError) {
      setToast({
        title: 'Falha ao converter',
        message:
          convertError instanceof Error
            ? convertError.message
            : 'Erro ao converter lead em cliente.',
        variant: 'error',
      });
    } finally {
      setConverting(false);
    }
  }

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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/leads"
                className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
              >
                Voltar para leads
              </Link>

              <h1 className="mt-3 text-3xl font-bold text-slate-950">
                {lead?.name ?? 'Detalhe do lead'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Origem, dados de contato e histórico consolidado da captação.
              </p>
            </div>

            {lead ? (
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getLeadSourceBadgeClass(
                    lead.source,
                  )}`}
                >
                  {getLeadSourceLabel(lead.source)}
                </span>

                {canConvert && !isConverted ? (
                  <button
                    type="button"
                    onClick={openConvertModal}
                    className="inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Converter em cliente
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {loading ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Carregando lead...
          </section>
        ) : error ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">
            {error}
          </section>
        ) : !lead ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Lead não encontrado.
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Contato</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {lead.email || lead.phone || '-'}
                </p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Empresa</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {lead.company || '-'}
                </p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Status</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {lead.status}
                </p>
              </article>
              <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Última interação</p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {formatDate(lead.lastInteractionAt || lead.updatedAt)}
                </p>
              </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
              <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Dados do lead</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">E-mail</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {lead.email || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Telefone</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {lead.phone || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Canal</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {lead.channel || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Criado em
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatDate(lead.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Observações
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {lead.notes || 'Sem observações cadastradas.'}
                  </p>
                </div>

                {(lead.externalContactId || lead.externalMessageId || lead.sourcePhone) ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Integracao
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>externalContactId: {lead.externalContactId || '-'}</p>
                      <p>externalMessageId: {lead.externalMessageId || '-'}</p>
                      <p>Número de origem: {lead.sourcePhone || '-'}</p>
                    </div>
                  </div>
                ) : null}
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Timeline</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Eventos de criação, importação, WhatsApp e atualizações.
                </p>
                <div className="mt-5">
                  <LeadTimeline events={lead.timeline ?? []} />
                </div>
              </article>
            </section>
          </>
        )}

        {convertOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8">
            <div className="w-full max-w-3xl rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.2)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="crm-eyebrow">Conversao</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Converter lead em cliente
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Confirme os dados cadastrais e informe o CNPJ/documento.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConvertOpen(false)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleConvertLead} className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  value={convertForm.document}
                  onChange={(event) =>
                    setConvertForm((current) => ({
                      ...current,
                      document: event.target.value,
                    }))
                  }
                  className="crm-input"
                  placeholder="CNPJ/documento obrigatório"
                />
                <input
                  type="password"
                  value={convertForm.password}
                  onChange={(event) =>
                    setConvertForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="crm-input"
                  placeholder="Senha inicial"
                />
                <input
                  value={convertForm.name}
                  onChange={(event) =>
                    setConvertForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="crm-input"
                  placeholder="Nome"
                />
                <input
                  type="email"
                  value={convertForm.email}
                  onChange={(event) =>
                    setConvertForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="crm-input"
                  placeholder="E-mail"
                />
                <input
                  value={convertForm.companyName}
                  onChange={(event) =>
                    setConvertForm((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  className="crm-input"
                  placeholder="Empresa / razao social"
                />
                <input
                  value={convertForm.phone}
                  onChange={(event) =>
                    setConvertForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="crm-input"
                  placeholder="Telefone"
                />
                <input
                  value={convertForm.segment}
                  onChange={(event) =>
                    setConvertForm((current) => ({
                      ...current,
                      segment: event.target.value,
                    }))
                  }
                  className="crm-input"
                  placeholder="Segmento"
                />
                <select
                  value={convertForm.status}
                  onChange={(event) =>
                    setConvertForm((current) => ({ ...current, status: event.target.value }))
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
                    onClick={() => setConvertOpen(false)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={converting}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {converting ? 'Convertendo...' : 'Criar cliente'}
                  </button>
                </div>
              </form>
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
