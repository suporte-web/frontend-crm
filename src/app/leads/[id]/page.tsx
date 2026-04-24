'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import {
  getLeadSourceBadgeClass,
  getLeadSourceLabel,
  LeadTimeline,
} from '@/components/leads/lead-timeline';
import { useAuth } from '@/context/auth-context';
import { getLeadById } from '@/services/leads.service';
import type { Lead } from '@/types/leads';

const internalRoles = new Set(['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING']);

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

  const isAllowed = user?.role ? internalRoles.has(user.role) : false;

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
                Origem, dados de contato e historico consolidado da captacao.
              </p>
            </div>

            {lead ? (
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getLeadSourceBadgeClass(
                  lead.source,
                )}`}
              >
                {getLeadSourceLabel(lead.source)}
              </span>
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
            Lead nao encontrado.
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
                <p className="text-sm text-slate-500">Ultima interacao</p>
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
                    Observacoes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {lead.notes || 'Sem observacoes cadastradas.'}
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
                      <p>Numero de origem: {lead.sourcePhone || '-'}</p>
                    </div>
                  </div>
                ) : null}
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-slate-950">Timeline</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Eventos de criacao, importacao, WhatsApp e atualizacoes.
                </p>
                <div className="mt-5">
                  <LeadTimeline events={lead.timeline ?? []} />
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
