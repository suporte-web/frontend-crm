'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';

type QuoteStatus =
  | 'PENDENTE'
  | 'EM_ANALISE'
  | 'APROVADA'
  | 'REPROVADA'
  | 'EXPIRADA';

type Quote = {
  id: string;
  code: string;
  client: string;
  service: string;
  value: number;
  status: QuoteStatus;
  createdAt: string;
  validUntil: string;
};

const initialQuotes: Quote[] = [
  {
    id: '1',
    code: 'COT-2026-001',
    client: 'Transportadora Atlas',
    service: 'Frete São Paulo → Rio de Janeiro',
    value: 3250,
    status: 'PENDENTE',
    createdAt: '2026-04-10',
    validUntil: '2026-04-20',
  },
  {
    id: '2',
    code: 'COT-2026-002',
    client: 'Logística Prime',
    service: 'Carga fracionada Campinas → Curitiba',
    value: 4890,
    status: 'APROVADA',
    createdAt: '2026-04-08',
    validUntil: '2026-04-18',
  },
  {
    id: '3',
    code: 'COT-2026-003',
    client: 'Mercado Central',
    service: 'Entrega expressa Belo Horizonte → Vitória',
    value: 1790,
    status: 'EM_ANALISE',
    createdAt: '2026-04-11',
    validUntil: '2026-04-21',
  },
  {
    id: '4',
    code: 'COT-2026-004',
    client: 'Comercial Nova Era',
    service: 'Frete dedicado Sorocaba → Santos',
    value: 2150,
    status: 'REPROVADA',
    createdAt: '2026-04-06',
    validUntil: '2026-04-16',
  },
  {
    id: '5',
    code: 'COT-2026-005',
    client: 'Indústria Aurora',
    service: 'Transporte de insumos Jundiaí → Joinville',
    value: 9320,
    status: 'EXPIRADA',
    createdAt: '2026-04-01',
    validUntil: '2026-04-12',
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

function getStatusLabel(status: QuoteStatus) {
  const map: Record<QuoteStatus, string> = {
    PENDENTE: 'Pendente',
    EM_ANALISE: 'Em análise',
    APROVADA: 'Aprovada',
    REPROVADA: 'Reprovada',
    EXPIRADA: 'Expirada',
  };

  return map[status];
}

function getStatusClasses(status: QuoteStatus) {
  const map: Record<QuoteStatus, string> = {
    PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    EM_ANALISE: 'bg-blue-100 text-blue-800 border-blue-200',
    APROVADA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REPROVADA: 'bg-red-100 text-red-800 border-red-200',
    EXPIRADA: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  return map[status];
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | QuoteStatus>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newQuote, setNewQuote] = useState({
    client: '',
    service: '',
    value: '',
    validUntil: '',
  });

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const matchesSearch =
        quote.code.toLowerCase().includes(search.toLowerCase()) ||
        quote.client.toLowerCase().includes(search.toLowerCase()) ||
        quote.service.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'TODOS' ? true : quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: quotes.length,
      approved: quotes.filter((q) => q.status === 'APROVADA').length,
      pending: quotes.filter(
        (q) => q.status === 'PENDENTE' || q.status === 'EM_ANALISE'
      ).length,
      totalValue: quotes.reduce((acc, item) => acc + item.value, 0),
    };
  }, [quotes]);

  function handleCreateQuote() {
    if (
      !newQuote.client.trim() ||
      !newQuote.service.trim() ||
      !newQuote.value.trim() ||
      !newQuote.validUntil.trim()
    ) {
      alert('Preencha todos os campos da nova cotação.');
      return;
    }

    const valueNumber = Number(newQuote.value.replace(',', '.'));

    if (Number.isNaN(valueNumber)) {
      alert('Informe um valor válido.');
      return;
    }

    const nextQuote: Quote = {
      id: crypto.randomUUID(),
      code: `COT-2026-${String(quotes.length + 1).padStart(3, '0')}`,
      client: newQuote.client,
      service: newQuote.service,
      value: valueNumber,
      status: 'PENDENTE',
      createdAt: new Date().toISOString().split('T')[0],
      validUntil: newQuote.validUntil,
    };

    setQuotes((prev) => [nextQuote, ...prev]);

    setNewQuote({
      client: '',
      service: '',
      value: '',
      validUntil: '',
    });

    setIsModalOpen(false);
  }

  function handleChangeStatus(id: string, status: QuoteStatus) {
    setQuotes((prev) =>
      prev.map((quote) => (quote.id === id ? { ...quote, status } : quote))
    );
  }

  function handleDeleteQuote(id: string) {
    const confirmed = window.confirm('Deseja realmente excluir esta cotação?');
    if (!confirmed) return;

    setQuotes((prev) => prev.filter((quote) => quote.id !== id));
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Painel comercial</p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                    Cotações
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                    Gerencie solicitações, acompanhe status e organize as propostas
                    comerciais em um só lugar.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Voltar ao dashboard
                  </Link>

                  <Link
                    href="/clients"
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Clientes
                  </Link>

                  <Link
                    href="/tickets"
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Tickets
                  </Link>

                  <Link
                    href="/trackings"
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Trackings
                  </Link>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Exportar
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Nova cotação
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-zinc-500">Total de cotações</p>
              <h2 className="mt-2 text-3xl font-bold text-zinc-900">{stats.total}</h2>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-zinc-500">Aprovadas</p>
              <h2 className="mt-2 text-3xl font-bold text-emerald-600">
                {stats.approved}
              </h2>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-zinc-500">Pendentes / Em análise</p>
              <h2 className="mt-2 text-3xl font-bold text-yellow-600">
                {stats.pending}
              </h2>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-zinc-500">Valor total</p>
              <h2 className="mt-2 text-3xl font-bold text-zinc-900">
                {formatCurrency(stats.totalValue)}
              </h2>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="w-full lg:max-w-md">
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Buscar cotação
                </label>
                <input
                  type="text"
                  placeholder="Buscar por código, cliente ou serviço..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                />
              </div>

              <div className="w-full lg:max-w-xs">
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Filtrar por status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'TODOS' | QuoteStatus)
                  }
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-900"
                >
                  <option value="TODOS">Todos</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="EM_ANALISE">Em análise</option>
                  <option value="APROVADA">Aprovada</option>
                  <option value="REPROVADA">Reprovada</option>
                  <option value="EXPIRADA">Expirada</option>
                </select>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                Lista de cotações
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                {filteredQuotes.length} registro(s) encontrado(s)
              </p>
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Código
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Cliente
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Serviço
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Valor
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Criação
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Validade
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 bg-white">
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-4 text-sm font-semibold text-zinc-900">
                        {quote.code}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-700">{quote.client}</td>
                      <td className="px-5 py-4 text-sm text-zinc-700">
                        {quote.service}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-zinc-900">
                        {formatCurrency(quote.value)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            quote.status
                          )}`}
                        >
                          {getStatusLabel(quote.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-700">
                        {formatDate(quote.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-700">
                        {formatDate(quote.validUntil)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <select
                            value={quote.status}
                            onChange={(e) =>
                              handleChangeStatus(quote.id, e.target.value as QuoteStatus)
                            }
                            className="rounded-xl border border-zinc-300 px-3 py-2 text-xs text-zinc-700 outline-none focus:border-zinc-900"
                          >
                            <option value="PENDENTE">Pendente</option>
                            <option value="EM_ANALISE">Em análise</option>
                            <option value="APROVADA">Aprovada</option>
                            <option value="REPROVADA">Reprovada</option>
                            <option value="EXPIRADA">Expirada</option>
                          </select>

                          <Link
                            href={`/quotes/${quote.id}`}
                            className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                          >
                            Ver detalhes
                          </Link>

                          <button
                            type="button"
                            className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuote(quote.id)}
                            className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredQuotes.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-10 text-center text-sm text-zinc-500"
                      >
                        Nenhuma cotação encontrada com os filtros atuais.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {filteredQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="rounded-2xl border border-zinc-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{quote.code}</p>
                      <p className="mt-1 text-sm text-zinc-600">{quote.client}</p>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        quote.status
                      )}`}
                    >
                      {getStatusLabel(quote.status)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-zinc-700">
                    <p>
                      <span className="font-semibold text-zinc-900">Serviço:</span>{' '}
                      {quote.service}
                    </p>
                    <p>
                      <span className="font-semibold text-zinc-900">Valor:</span>{' '}
                      {formatCurrency(quote.value)}
                    </p>
                    <p>
                      <span className="font-semibold text-zinc-900">Criação:</span>{' '}
                      {formatDate(quote.createdAt)}
                    </p>
                    <p>
                      <span className="font-semibold text-zinc-900">Validade:</span>{' '}
                      {formatDate(quote.validUntil)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <select
                      value={quote.status}
                      onChange={(e) =>
                        handleChangeStatus(quote.id, e.target.value as QuoteStatus)
                      }
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-900"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_ANALISE">Em análise</option>
                      <option value="APROVADA">Aprovada</option>
                      <option value="REPROVADA">Reprovada</option>
                      <option value="EXPIRADA">Expirada</option>
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                      >
                        Detalhes
                      </Link>

                      <button
                        type="button"
                        className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="col-span-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredQuotes.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
                  Nenhuma cotação encontrada com os filtros atuais.
                </div>
              )}
            </div>
          </section>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Nova cotação</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Preencha as informações para criar uma nova proposta.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={newQuote.client}
                    onChange={(e) =>
                      setNewQuote((prev) => ({ ...prev, client: e.target.value }))
                    }
                    placeholder="Digite o nome do cliente"
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Serviço
                  </label>
                  <input
                    type="text"
                    value={newQuote.service}
                    onChange={(e) =>
                      setNewQuote((prev) => ({ ...prev, service: e.target.value }))
                    }
                    placeholder="Descreva o serviço da cotação"
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Valor
                  </label>
                  <input
                    type="text"
                    value={newQuote.value}
                    onChange={(e) =>
                      setNewQuote((prev) => ({ ...prev, value: e.target.value }))
                    }
                    placeholder="Ex: 3500"
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Validade
                  </label>
                  <input
                    type="date"
                    value={newQuote.validUntil}
                    onChange={(e) =>
                      setNewQuote((prev) => ({
                        ...prev,
                        validUntil: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleCreateQuote}
                  className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Salvar cotação
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}