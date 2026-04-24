'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import {
  getDeliveries,
  getDeliveriesSummary,
} from '@/services/deliveries.service';
import type {
  DeliveryFilters,
  DeliveryRow,
  DeliverySummary,
} from '@/types/deliveries';
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  Clock3,
  Download,
  PackageSearch,
  RefreshCcw,
  Route,
  Truck,
} from 'lucide-react';

const PAGE_SIZE = 10;
const DEFAULT_FILTERS: DeliveryFilters = {
  dataRef: new Date().toISOString().slice(0, 10),
  ufDest: '',
  nroCtrc: '',
  statusEntrega: 'Todos',
  classificacaoRota: 'Todos',
};

const ROUTE_OPTIONS = ['Todos', 'Curitiba', 'Londrina', 'Maringa', '-'];
const STATUS_OPTIONS = ['Todos', 'Entregue', 'Pendente', 'Em atraso'];

type SortField =
  | 'nro_ctrc'
  | 'nome_cli_dest'
  | 'cidade_origem'
  | 'cidade_dest'
  | 'uf_dest'
  | 'data_prev_ent'
  | 'data_entrega'
  | 'status_entrega'
  | 'sla_entrega'
  | 'classificacao_rota';

type QuickFilter =
  | 'all'
  | 'entregues'
  | 'pendentes'
  | 'atraso'
  | 'slaDentro'
  | 'slaFora'
  | 'abertas';

function formatDate(value?: string | null) {
  if (!value) return '-';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR').format(parsed);
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function getStatusBadgeClass(status: string) {
  if (status === 'Entregue') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (status === 'Em atraso') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function getLateBadgeClass(value: string) {
  return value === 'Sim'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-zinc-200 bg-zinc-50 text-zinc-600';
}

function getSlaBadgeClass(value: string) {
  if (value === 'DENTRO DO SLA') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (value === 'FORA DO SLA') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-zinc-200 bg-zinc-50 text-zinc-600';
}

function exportRowsToCsv(rows: DeliveryRow[]) {
  const headers = [
    'Nº CTRC',
    'Série',
    'Cliente destino',
    'Cidade origem',
    'Cidade destino',
    'UF destino',
    'Data previsão entrega',
    'Data entrega',
    'Hora entrega',
    'Última ocorrência',
    'Descrição ocorrência',
    'Status entrega',
    'Em atraso',
    'SLA',
    'Classificação da rota',
  ];

  const content = rows.map((row) => [
    row.nro_ctrc,
    row.ser_ctrc,
    row.nome_cli_dest,
    row.cidade_origem,
    row.cidade_dest,
    row.uf_dest,
    formatDate(row.data_prev_ent),
    formatDate(row.data_entrega),
    row.hora_entrega || '-',
    row.ult_ocor || '-',
    row.ocorrencia,
    row.status_entrega,
    row.em_atraso,
    row.sla_entrega,
    row.classificacao_rota,
  ]);

  const csv = [headers, ...content]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(';'),
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `monitoramento-entregas-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function compareValues(a: string | null, b: string | null) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, 'pt-BR', { numeric: true });
}

export default function DeliveriesPage() {
  const { token, user, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState<DeliveryFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<DeliveryFilters>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [summary, setSummary] = useState<DeliverySummary>({
    totalPedidos: 0,
    entregues: 0,
    pendentes: 0,
    emAtraso: 0,
    entregueDentroDoSla: 0,
    entregueForaDoSla: 0,
    porcentagemEntrega: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('data_prev_ent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilter>('all');

  useEffect(() => {
    if (authLoading || !token) {
      return;
    }

    let isMounted = true;
    const authToken = token;

    async function loadData() {
      setLoading(true);
      setErrorMessage('');

      try {
        // A lista e o resumo usam os mesmos filtros para manter o painel coerente.
        const [deliveryRows, deliverySummary] = await Promise.all([
          getDeliveries(appliedFilters, authToken),
          getDeliveriesSummary(appliedFilters, authToken),
        ]);

        if (!isMounted) {
          return;
        }

        setRows(deliveryRows);
        setSummary(deliverySummary);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar o monitoramento de entregas.',
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters, authLoading, refreshKey, token]);

  const sortedRows = useMemo(() => {
    const nextRows = [...rows].filter((row) => {
      switch (activeQuickFilter) {
        case 'entregues':
          return row.status_entrega === 'Entregue';
        case 'pendentes':
          return row.status_entrega === 'Pendente';
        case 'atraso':
          return row.status_entrega === 'Em atraso';
        case 'slaDentro':
          return row.sla_entrega === 'DENTRO DO SLA';
        case 'slaFora':
          return row.sla_entrega === 'FORA DO SLA';
        case 'abertas':
          return row.status_entrega === 'Pendente' || row.status_entrega === 'Em atraso';
        default:
          return true;
      }
    });

    nextRows.sort((left, right) => {
      let result = 0;

      if (sortField === 'data_prev_ent' || sortField === 'data_entrega') {
        result = compareValues(left[sortField], right[sortField]);
      } else {
        result = compareValues(
          String(left[sortField] ?? ''),
          String(right[sortField] ?? ''),
        );
      }

      return sortDirection === 'asc' ? result : result * -1;
    });

    return nextRows;
  }, [activeQuickFilter, rows, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [page, sortedRows]);

  const availableUfs = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.uf_dest).filter(Boolean))).sort();
  }, [rows]);
  const pendingVolume = summary.pendentes + summary.emAtraso;
  const progressWidth = `${Math.min(Math.max(summary.porcentagemEntrega, 0), 100)}%`;

  function updateFilter<K extends keyof DeliveryFilters>(
    field: K,
    value: DeliveryFilters[K],
  ) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function applyFilters() {
    setAppliedFilters(filters);
    setPage(1);
    setActiveQuickFilter('all');
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
    setActiveQuickFilter('all');
  }

  function refreshData() {
    setRefreshKey((value) => value + 1);
  }

  function toggleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  }

  function toggleQuickFilter(filter: QuickFilter) {
    setActiveQuickFilter((current) => (current === filter ? 'all' : filter));
    setPage(1);
  }

  function getQuickFilterLabel(filter: QuickFilter) {
    const labels: Record<QuickFilter, string> = {
      all: 'Todos os registros',
      entregues: 'Somente entregues',
      pendentes: 'Somente pendentes',
      atraso: 'Somente em atraso',
      slaDentro: 'Somente dentro do SLA',
      slaFora: 'Somente fora do SLA',
      abertas: 'Pendentes e atrasadas',
    };

    return labels[filter];
  }

  function getQuickCardClass(filter: QuickFilter) {
    return activeQuickFilter === filter
      ? 'ring-2 ring-blue-500 shadow-[0_18px_34px_rgba(37,99,235,0.18)]'
      : '';
  }

  const canViewPage =
    user?.role && ['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING'].includes(user.role);

  if (!authLoading && !canViewPage) {
    return (
      <AppLayout>
        <Card className="rounded-3xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-8 text-red-700">
            Voce nao tem permissao para acessar o monitoramento de entregas.
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
        <Card className="rounded-3xl border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100">
            <div>
              <p className="text-sm font-medium text-zinc-500">Operacao</p>
              <CardTitle className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                Monitoramento de entregas -  Aero | E-commerce
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-zinc-600">
                Acompanhamento de entregas diário
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Data de referencia
                </label>
                <Input
                  type="date"
                  value={filters.dataRef}
                  onChange={(event) => updateFilter('dataRef', event.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  UF destino
                </label>
                <select
                  value={filters.ufDest}
                  onChange={(event) => updateFilter('ufDest', event.target.value)}
                  className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm"
                >
                  <option value="">Todas</option>
                  {availableUfs.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Nº CTRC
                </label>
                <Input
                  value={filters.nroCtrc}
                  onChange={(event) => updateFilter('nroCtrc', event.target.value)}
                  placeholder="Digite parte do CTRC"
                  className="h-12 rounded-2xl"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Status entrega
                </label>
                <select
                  value={filters.statusEntrega}
                  onChange={(event) =>
                    updateFilter('statusEntrega', event.target.value)
                  }
                  className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Classificacao operacional
                </label>
                <select
                  value={filters.classificacaoRota}
                  onChange={(event) =>
                    updateFilter('classificacaoRota', event.target.value)
                  }
                  className="flex h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm"
                >
                  {ROUTE_OPTIONS.map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => exportRowsToCsv(sortedRows)}
                disabled={rows.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Extrair CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={clearFilters}
              >
                Limpar filtros
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={refreshData}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
              <Button
                type="button"
                className="rounded-2xl"
                onClick={applyFilters}
              >
                Aplicar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {errorMessage && (
          <Card className="rounded-3xl border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-6 text-sm text-red-700">
              {errorMessage}
            </CardContent>
          </Card>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          <Card
            className={`rounded-3xl border-zinc-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md xl:col-span-2 ${getQuickCardClass(
              'all',
            )}`}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
                <PackageSearch className="h-5 w-5" />
              </div>
              <button
                type="button"
                className="text-left"
                onClick={() => toggleQuickFilter('all')}
              >
                <p className="text-sm text-zinc-500">Total de pedidos</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {summary.totalPedidos}
                </p>
              </button>
            </CardContent>
          </Card>

          <Card
            className={`rounded-3xl border-zinc-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md xl:col-span-2 ${getQuickCardClass(
              'entregues',
            )}`}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <button
                type="button"
                className="text-left"
                onClick={() => toggleQuickFilter('entregues')}
              >
                <p className="text-sm text-zinc-500">Entregues</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {summary.entregues}
                </p>
              </button>
            </CardContent>
          </Card>

          <Card
            className={`rounded-3xl border-zinc-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md xl:col-span-2 ${getQuickCardClass(
              'pendentes',
            )}`}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Clock3 className="h-5 w-5" />
              </div>
              <button
                type="button"
                className="text-left"
                onClick={() => toggleQuickFilter('pendentes')}
              >
                <p className="text-sm text-zinc-500">Pendentes</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {summary.pendentes}
                </p>
              </button>
            </CardContent>
          </Card>

          <Card
            className={`rounded-3xl border-zinc-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md xl:col-span-2 ${getQuickCardClass(
              'atraso',
            )}`}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <button
                type="button"
                className="text-left"
                onClick={() => toggleQuickFilter('atraso')}
              >
                <p className="text-sm text-zinc-500">Em atraso</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {summary.emAtraso}
                </p>
              </button>
            </CardContent>
          </Card>

          <Card
            className={`rounded-3xl border-zinc-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md xl:col-span-4 ${getQuickCardClass(
              'all',
            )}`}
          >
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Truck className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">Porcentagem de entrega</p>
                    <p className="mt-1 text-3xl font-bold text-zinc-900">
                      {formatPercentage(summary.porcentagemEntrega)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-600 transition hover:border-blue-200 hover:text-zinc-900"
                  onClick={() => toggleQuickFilter('abertas')}
                >
                  {summary.entregues} concluida(s) • {pendingVolume} em aberto
                </button>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  <span>Progresso operacional</span>
                  <span>{formatPercentage(summary.porcentagemEntrega)}</span>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#38bdf8_100%)] transition-all"
                    style={{ width: progressWidth }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-zinc-500">
                  <span>Volume total: {summary.totalPedidos}</span>
                  <span>Entregues: {summary.entregues}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[1.55fr_0.85fr]">
          <Card className="rounded-3xl border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 pb-4">
              <div className="flex flex-col gap 3 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                    Painel de SLA
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-zinc-900">
                    Controle de prazo das entregas
                  </h3>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  Performance atual: {formatPercentage(summary.porcentagemEntrega)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => toggleQuickFilter('slaDentro')}
                  className={`rounded-3xl border border-emerald-200 bg-[linear-gradient(180deg,#f3fff7_0%,#ecfdf3_100%)] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${getQuickCardClass(
                    'slaDentro',
                  )}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Dentro do SLA
                  </p>
                  <p className="mt-3 text-4xl font-bold text-zinc-900">
                    {summary.entregueDentroDoSla}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Entregas finalizadas dentro do prazo prometido.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => toggleQuickFilter('slaFora')}
                  className={`rounded-3xl border border-red-200 bg-[linear-gradient(180deg,#fff4f4_0%,#fef2f2_100%)] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${getQuickCardClass(
                    'slaFora',
                  )}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700">
                    Fora do SLA
                  </p>
                  <p className="mt-3 text-4xl font-bold text-zinc-900">
                    {summary.entregueForaDoSla}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Entregas baixadas apos a data prevista.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => toggleQuickFilter('abertas')}
                  className={`rounded-3xl border border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${getQuickCardClass(
                    'abertas',
                  )}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Pendencias ativas
                  </p>
                  <p className="mt-3 text-4xl font-bold text-zinc-900">
                    {summary.pendentes + summary.emAtraso}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Volume ainda aberto entre pendentes e atrasadas.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-zinc-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-zinc-900">
                Resumo operacional
              </CardTitle>
              <CardDescription className="text-sm text-zinc-500">
                Corte baseado na ultima ocorrencia e no prazo prometido.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Dentro do SLA
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {summary.entregueDentroDoSla} entrega(s) com baixa dentro do prazo.
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Fora do SLA
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {summary.entregueForaDoSla} entrega(s) com baixa fora do prazo.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Taxa de entrega
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {formatPercentage(summary.porcentagemEntrega)} do volume filtrado.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="rounded-3xl border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-col gap-2 border-b border-zinc-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg text-zinc-900">
                Lista detalhada dos CTRCs
              </CardTitle>
              <CardDescription className="text-sm text-zinc-500">
                Total filtrado: {sortedRows.length} registros.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {getQuickFilterLabel(activeQuickFilter)}
              </div>

              {activeQuickFilter !== 'all' && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => toggleQuickFilter('all')}
                >
                  Limpar filtro rapido
                </Button>
              )}

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  <span>
                    Ordenacao atual: {sortField} ({sortDirection === 'asc' ? 'crescente' : 'decrescente'})
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-sm text-zinc-500">Carregando entregas...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                        {[
                          ['nro_ctrc', 'Nº CTRC'],
                          ['ser_ctrc', 'Serie'],
                          ['nome_cli_dest', 'Cliente destino'],
                          ['cidade_origem', 'Origem'],
                          ['cidade_dest', 'Destino'],
                          ['uf_dest', 'UF'],
                          ['data_prev_ent', 'Prev. entrega'],
                          ['data_entrega', 'Data entrega'],
                          ['hora_entrega', 'Hora entrega'],
                          ['ult_ocor', 'Ult. ocorrencia'],
                          ['ocorrencia', 'Descricao ocorrencia'],
                          ['status_entrega', 'Status'],
                          ['em_atraso', 'Em atraso'],
                          ['sla_entrega', 'SLA'],
                          ['classificacao_rota', 'Classificacao'],
                        ].map(([field, label]) => {
                          const sortable = [
                            'nro_ctrc',
                            'nome_cli_dest',
                            'cidade_origem',
                            'cidade_dest',
                            'uf_dest',
                            'data_prev_ent',
                            'data_entrega',
                            'status_entrega',
                            'sla_entrega',
                            'classificacao_rota',
                          ].includes(field);

                          return (
                            <th
                              key={field}
                              className="border-b border-zinc-200 px-4 py-3 font-semibold"
                            >
                              {sortable ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 text-left"
                                  onClick={() => toggleSort(field as SortField)}
                                >
                                  <span>{label}</span>
                                  {sortField === field ? (
                                    sortDirection === 'asc' ? (
                                      <ArrowUpAZ className="h-3.5 w-3.5" />
                                    ) : (
                                      <ArrowDownAZ className="h-3.5 w-3.5" />
                                    )
                                  ) : null}
                                </button>
                              ) : (
                                label
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={15}
                            className="px-4 py-10 text-center text-sm text-zinc-500"
                          >
                            Nenhuma entrega encontrada com os filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row) => (
                          <tr key={`${row.seq_ctrc}-${row.nro_ctrc}`} className="align-top">
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm font-semibold text-zinc-900">
                              {row.nro_ctrc}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {row.ser_ctrc}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {row.nome_cli_dest}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {row.cidade_origem}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {row.cidade_dest}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {row.uf_dest}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {formatDate(row.data_prev_ent)}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {formatDate(row.data_entrega)}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {row.hora_entrega || '-'}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {row.ult_ocor || '-'}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {row.ocorrencia}
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm">
                              <Badge
                                className={`rounded-full border px-3 py-1 font-semibold ${getStatusBadgeClass(
                                  row.status_entrega,
                                )}`}
                              >
                                {row.status_entrega}
                              </Badge>
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm">
                              <Badge
                                className={`rounded-full border px-3 py-1 font-semibold ${getLateBadgeClass(
                                  row.em_atraso,
                                )}`}
                              >
                                {row.em_atraso}
                              </Badge>
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm">
                              <Badge
                                className={`rounded-full border px-3 py-1 font-semibold ${getSlaBadgeClass(
                                  row.sla_entrega,
                                )}`}
                              >
                                {row.sla_entrega}
                              </Badge>
                            </td>
                            <td className="border-b border-zinc-100 px-4 py-4 text-sm text-zinc-600">
                              {row.classificacao_rota}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-500">
                    Pagina {page} de {totalPages}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Anterior
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                    >
                      Proxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
