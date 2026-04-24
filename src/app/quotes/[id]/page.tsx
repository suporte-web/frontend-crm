'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuth } from '@/context/auth-context';
import { getQuoteById } from '@/services/quotes.service';
import type { Quote } from '@/types/quotes';

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
    timeStyle: 'short',
  }).format(new Date(date));
}

function getStatusLabel(status: Quote['status']) {
  const map: Record<Quote['status'], string> = {
    RECEIVED: 'Recebida',
    IN_ANALYSIS: 'Em analise',
    ANSWERED: 'Respondida',
    APPROVED: 'Aprovada',
    REJECTED: 'Rejeitada',
  };

  return map[status];
}

export default function QuoteDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadQuote() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const { id } = await params;
        const data = await getQuoteById(id, token);

        if (active) {
          setQuote(data);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Erro ao carregar a cotacao.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQuote();

    return () => {
      active = false;
    };
  }, [params, token]);

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-500">Detalhe da cotacao</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                Informacoes da solicitacao
              </h1>
            </div>

            <Link
              href="/quotes"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Voltar para cotacoes
            </Link>
          </div>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
            Carregando cotacao...
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700 shadow-sm">
            {error}
          </section>
        ) : quote ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Status</p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                  {getStatusLabel(quote.status)}
                </h2>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Valor respondido</p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                  {formatCurrency(quote.price)}
                </h2>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Prazo desejado</p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                  {formatDate(quote.desiredDeadline)}
                </h2>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Mercadoria</p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                  {formatCurrency(quote.merchandiseValue)}
                </h2>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
              <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-zinc-900">
                  Dados da solicitacao
                </h2>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Origem</p>
                    <p className="mt-1 font-semibold text-zinc-900">{quote.origin}</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Destino</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {quote.destination}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Servico</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {quote.serviceType}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Tipo</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {quote.requestType || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Contato</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {quote.contactName || '-'}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {quote.contactPhone || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4">
                    <p className="text-sm text-zinc-500">Dimensoes operacionais</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      Peso: {quote.weight ? `${quote.weight} kg` : '-'}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Volume: {quote.volume ? `${quote.volume} m3` : '-'} | Quantidade:{' '}
                      {quote.quantity ?? '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4 md:col-span-2">
                    <p className="text-sm text-zinc-500">Endereco de coleta</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {quote.pickupAddress || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4 md:col-span-2">
                    <p className="text-sm text-zinc-500">Endereco de entrega</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {quote.deliveryAddress || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4 md:col-span-2">
                    <p className="text-sm text-zinc-500">Descricao da carga / servico</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {quote.cargoDescription || '-'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-zinc-50 p-4 md:col-span-2">
                    <p className="text-sm text-zinc-500">Observacoes</p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {quote.notes || '-'}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-zinc-900">Historico</h2>

                <div className="mt-6 space-y-3">
                  {quote.history?.length ? (
                    quote.history.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <p className="text-sm font-semibold text-zinc-900">
                          {getStatusLabel(entry.status)}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatDate(entry.createdAt)}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                          {entry.notes || 'Sem observacoes registradas.'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                      Nenhum historico registrado.
                    </div>
                  )}

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Retorno comercial
                    </p>
                    <p className="mt-3 text-sm leading-6 text-blue-800">
                      {quote.commercialNotes || 'Ainda nao ha retorno comercial registrado.'}
                    </p>
                  </div>
                </div>
              </article>
            </section>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
