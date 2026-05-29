"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import {
  getDeliveries,
  getDeliveriesSummary,
} from "@/services/deliveries.service";
import type {
  DeliveryFilters,
  DeliveryRow,
  DeliverySummary,
} from "@/types/deliveries";
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  Clock3,
  Download,
  ListFilter,
  PackageSearch,
  Percent,
  RefreshCcw,
  Route,
  SlidersHorizontal,
  Truck,
} from "lucide-react";

const PAGE_SIZE = 10;
const DEFAULT_FILTERS: DeliveryFilters = {
  dataRef: new Date().toISOString().slice(0, 10),
  ufDest: "",
  nroCtrc: "",
  statusEntrega: "Todos",
  classificacaoRota: "Todos",
};

const ROUTE_OPTIONS = ["Todos", "Curitiba", "Londrina", "Maringa", "-"];
const STATUS_OPTIONS = ["Todos", "Entregue", "Pendente", "Em atraso"];

type SortField =
  | "nro_ctrc"
  | "nome_cli_dest"
  | "cidade_origem"
  | "cidade_dest"
  | "uf_dest"
  | "data_prev_ent"
  | "data_entrega"
  | "status_entrega"
  | "sla_entrega"
  | "classificacao_rota";

type QuickFilter =
  | "all"
  | "entregues"
  | "pendentes"
  | "atraso"
  | "slaDentro"
  | "slaFora"
  | "abertas";

const DELIVERY_TABLE_COLUMNS: Array<{
  field:
    | SortField
    | "ser_ctrc"
    | "hora_entrega"
    | "ult_ocor"
    | "ocorrencia"
    | "em_atraso";
  label: string;
  sortable?: boolean;
  className?: string;
}> = [
  {
    field: "nro_ctrc",
    label: "Nº CTRC",
    sortable: true,
    className: "min-w-[105px]",
  },
  { field: "ser_ctrc", label: "Serie", className: "min-w-[86px]" },
  {
    field: "nome_cli_dest",
    label: "Cliente destino",
    sortable: true,
    className: "min-w-[220px]",
  },
  {
    field: "cidade_origem",
    label: "Origem",
    sortable: true,
    className: "min-w-[130px]",
  },
  {
    field: "cidade_dest",
    label: "Destino",
    sortable: true,
    className: "min-w-[130px]",
  },
  { field: "uf_dest", label: "UF", sortable: true, className: "min-w-[72px]" },
  {
    field: "data_prev_ent",
    label: "Prev. entrega",
    sortable: true,
    className: "min-w-[132px]",
  },
  {
    field: "data_entrega",
    label: "Data entrega",
    sortable: true,
    className: "min-w-[132px]",
  },
  { field: "hora_entrega", label: "Hora entrega", className: "min-w-[128px]" },
  { field: "ult_ocor", label: "Ult. ocorrencia", className: "min-w-[126px]" },
  {
    field: "ocorrencia",
    label: "Descrição ocorrencia",
    className: "min-w-[280px]",
  },
  {
    field: "status_entrega",
    label: "Status",
    sortable: true,
    className: "min-w-[140px]",
  },
  { field: "em_atraso", label: "Em atraso", className: "min-w-[116px]" },
  {
    field: "sla_entrega",
    label: "SLA",
    sortable: true,
    className: "min-w-[150px]",
  },
  {
    field: "classificacao_rota",
    label: "Classificacao",
    sortable: true,
    className: "min-w-[150px]",
  },
];

function formatDate(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function formatPercentage(value: number) {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`;
}

function getStatusBadgeClass(status: string) {
  if (status === "Entregue") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Em atraso") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getLateBadgeClass(value: string) {
  return value === "Sim"
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-zinc-200 bg-zinc-50 text-zinc-600";
}

function getSlaBadgeClass(value: string) {
  if (value === "DENTRO DO SLA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "FORA DO SLA") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

function exportRowsToCsv(rows: DeliveryRow[], dataRef: string) {
  const headers = [
    "Data referência",
    "Nº CTRC",
    "Série",
    "Cliente destino",
    "Cidade origem",
    "Cidade destino",
    "UF destino",
    "Data previsão entrega",
    "Data entrega",
    "Hora entrega",
    "Última ocorrência",
    "Descrição ocorrência",
    "Status entrega",
    "Em atraso",
    "SLA",
    "Classificação da rota",
  ];

  const content = rows.map((row) => [
    formatDate(row.data_ref),
    row.nro_ctrc,
    row.ser_ctrc,
    row.nome_cli_dest,
    row.cidade_origem,
    row.cidade_dest,
    row.uf_dest,
    formatDate(row.data_prev_ent),
    formatDate(row.data_entrega),
    row.hora_entrega || "-",
    row.ult_ocor || "-",
    row.ocorrencia,
    row.status_entrega,
    row.em_atraso,
    row.sla_entrega,
    row.classificacao_rota,
  ]);

  const csv = [headers, ...content]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(";"),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `monitoramento-entregas-${dataRef || new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function compareValues(a: string | null, b: string | null) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, "pt-BR", { numeric: true });
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
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("data_prev_ent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilter>("all");

  useEffect(() => {
    if (authLoading || !token) {
      return;
    }

    let isMounted = true;
    const authToken = token;

    async function loadData() {
      setLoading(true);
      setErrorMessage("");

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
            : "Não foi possível carregar o monitoramento de entregas.",
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
        case "entregues":
          return row.status_entrega === "Entregue";
        case "pendentes":
          return row.status_entrega === "Pendente";
        case "atraso":
          return row.status_entrega === "Em atraso";
        case "slaDentro":
          return row.sla_entrega === "DENTRO DO SLA";
        case "slaFora":
          return row.sla_entrega === "FORA DO SLA";
        case "abertas":
          return (
            row.status_entrega === "Pendente" ||
            row.status_entrega === "Em atraso"
          );
        default:
          return true;
      }
    });

    nextRows.sort((left, right) => {
      let result = 0;

      if (sortField === "data_prev_ent" || sortField === "data_entrega") {
        result = compareValues(left[sortField], right[sortField]);
      } else {
        result = compareValues(
          String(left[sortField] ?? ""),
          String(right[sortField] ?? ""),
        );
      }

      return sortDirection === "asc" ? result : result * -1;
    });

    return nextRows;
  }, [activeQuickFilter, rows, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [page, sortedRows]);

  const availableUfs = useMemo(() => {
    return Array.from(
      new Set(rows.map((row) => row.uf_dest).filter(Boolean)),
    ).sort();
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
    setActiveQuickFilter("all");
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
    setActiveQuickFilter("all");
  }

  function refreshData() {
    setRefreshKey((value) => value + 1);
  }

  function toggleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  }

  function toggleQuickFilter(filter: QuickFilter) {
    setActiveQuickFilter((current) => (current === filter ? "all" : filter));
    setPage(1);
  }

  function getQuickFilterLabel(filter: QuickFilter) {
    const labels: Record<QuickFilter, string> = {
      all: "Todos os registros",
      entregues: "Somente entregues",
      pendentes: "Somente pendentes",
      atraso: "Somente em atraso",
      slaDentro: "Somente dentro do SLA",
      slaFora: "Somente fora do SLA",
      abertas: "Pendentes e atrasadas",
    };

    return labels[filter];
  }

  function getQuickCardClass(filter: QuickFilter) {
    return activeQuickFilter === filter
      ? "ring-2 ring-[#ec3139]/70 shadow-[0_18px_34px_rgba(236,49,57,0.16)]"
      : "";
  }

  const canViewPage =
    user?.role &&
    ["ADMIN", "GESTAO", "COMERCIAL", "MARKETING", "CLIENTE"].includes(
      user.role,
    );

  if (!authLoading && !canViewPage) {
    return (
      <AppLayout>
        <Card className="rounded-3xl border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-8 text-red-700">
            Você não tem permissão para acessar o monitoramento de entregas.
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
        <section className="crm-shell-card rounded-[24px] p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-7">
              <div className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full border border-[#ffbd7b] bg-[#fff7df]/70 text-[#ec3f12]">
                <Truck className="h-9 w-9" />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.12em] text-[#ec3f12]">
                  Operação
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                  Monitoramento de entregas
                </h1>
                <p className="mt-3 text-lg font-medium text-slate-500">
                  BI - Aero | E-commerce.
                </p>
              </div>
            </div>

            <div className="w-fit rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-sm font-black uppercase text-slate-400">
                Data base
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-950">
                {formatDate(filters.dataRef)}
              </p>
            </div>
          </div>
        </section>

        <section className="crm-shell-card rounded-[24px] p-8">
          <div className="flex items-center gap-4">
            <SlidersHorizontal className="h-6 w-6 text-[#ec3f12]" />
            <h2 className="text-2xl font-black text-slate-950">
              Filtros de consulta
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-3 block text-base font-semibold text-slate-900">
                Data de referência
              </label>
              <Input
                type="date"
                value={filters.dataRef}
                onChange={(event) =>
                  updateFilter("dataRef", event.target.value)
                }
                className="h-[68px] rounded-2xl border-slate-300 bg-white px-5 text-base text-slate-900 shadow-none transition focus-visible:bg-white"
              />
            </div>

            <div>
              <label className="mb-3 block text-base font-semibold text-slate-900">
                UF destino
              </label>
              <select
                value={filters.ufDest}
                onChange={(event) => updateFilter("ufDest", event.target.value)}
                className="flex h-[68px] w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-500/20"
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
              <label className="mb-3 block text-base font-semibold text-slate-900">
                Nº CTRC
              </label>
              <Input
                value={filters.nroCtrc}
                onChange={(event) =>
                  updateFilter("nroCtrc", event.target.value)
                }
                placeholder="Digite parte do CTRC"
                className="h-[68px] rounded-2xl border-slate-300 bg-white px-5 text-base text-slate-900 shadow-none transition focus-visible:bg-white"
              />
            </div>

            <div>
              <label className="mb-3 block text-base font-semibold text-slate-900">
                Status entrega
              </label>
              <select
                value={filters.statusEntrega}
                onChange={(event) =>
                  updateFilter("statusEntrega", event.target.value)
                }
                className="flex h-[68px] w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-500/20"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-3 block text-base font-semibold text-slate-900">
                Classificação operacional
              </label>
              <select
                value={filters.classificacaoRota}
                onChange={(event) =>
                  updateFilter("classificacaoRota", event.target.value)
                }
                className="flex h-[68px] w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-500/20"
              >
                {ROUTE_OPTIONS.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-end gap-4 border-t border-slate-200 pt-8">
            <Button
              type="button"
              variant="outline"
              className="h-[58px] rounded-2xl border-slate-200 bg-white px-7 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
              onClick={() =>
                exportRowsToCsv(sortedRows, appliedFilters.dataRef)
              }
              disabled={rows.length === 0}
            >
              <Download className="mr-3 h-5 w-5" />
              Exportar CSV
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-[58px] rounded-2xl border-slate-200 bg-white px-7 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
              onClick={clearFilters}
            >
              <ListFilter className="mr-3 h-5 w-5" />
              Limpar filtros
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-[58px] rounded-2xl border-slate-200 bg-white px-7 text-base font-semibold text-slate-800 transition hover:bg-slate-50"
              onClick={refreshData}
            >
              <RefreshCcw className="mr-3 h-5 w-5" />
              Atualizar
            </Button>

            <Button
              type="button"
              className="h-[58px] rounded-2xl bg-[#ec3f12] px-8 text-base font-bold text-white shadow-[0_12px_24px_rgba(236,63,18,0.24)] transition hover:bg-[#d7350e]"
              onClick={applyFilters}
            >
              Aplicar filtros
            </Button>
          </div>
        </section>
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-[0_14px_34px_rgba(239,68,68,0.08)]">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold text-red-800">
                Erro ao carregar entregas
              </p>

              <p className="mt-1 leading-6">{errorMessage}</p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
          <button
            type="button"
            onClick={() => toggleQuickFilter("all")}
            className={`group relative min-h-[236px] overflow-hidden rounded-[18px] border border-slate-200/70 bg-white p-8 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)] xl:col-span-2 ${getQuickCardClass(
              "all",
            )}`}
          >
            <div className="absolute inset-x-6 top-0 h-1 bg-[#1f76c9]" />

            <div className="flex h-full flex-col justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#1f76c9] ring-1 ring-[#cde5ff]">
                  <PackageSearch className="h-6 w-6" />
                </div>
                <p className="text-base font-medium text-slate-900">
                  Total de pedidos
                </p>
              </div>

              <p className="text-5xl font-bold tracking-tight text-slate-950">
                {summary.totalPedidos}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleQuickFilter("entregues")}
            className={`group relative min-h-[236px] overflow-hidden rounded-[18px] border border-slate-200/70 bg-white p-8 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)] xl:col-span-2 ${getQuickCardClass(
              "entregues",
            )}`}
          >
            <div className="absolute inset-x-6 top-0 h-1 bg-[#35a853]" />

            <div className="flex h-full flex-col justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#eaf8ed] text-[#35a853] ring-1 ring-[#cdebd3]">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-base font-medium text-slate-900">
                  Entregues
                </p>
              </div>

              <p className="text-5xl font-bold tracking-tight text-slate-950">
                {summary.entregues}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleQuickFilter("pendentes")}
            className={`group relative min-h-[236px] overflow-hidden rounded-[18px] border border-slate-200/70 bg-white p-8 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)] xl:col-span-2 ${getQuickCardClass(
              "pendentes",
            )}`}
          >
            <div className="absolute inset-x-6 top-0 h-1 bg-[#fab519]" />

            <div className="flex h-full flex-col justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#fff7df] text-[#b87900] ring-1 ring-[#ffe6a3]">
                  <Clock3 className="h-6 w-6" />
                </div>
                <p className="text-base font-medium text-slate-900">
                  Pendentes
                </p>
              </div>

              <p className="text-5xl font-bold tracking-tight text-slate-950">
                {summary.pendentes}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleQuickFilter("atraso")}
            className={`group relative min-h-[236px] overflow-hidden rounded-[18px] border border-slate-200/70 bg-white p-8 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)] xl:col-span-2 ${getQuickCardClass(
              "atraso",
            )}`}
          >
            <div className="absolute inset-x-6 top-0 h-1 bg-[#ec3f12]" />

            <div className="flex h-full flex-col justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#fff0f1] text-[#ec3f12] ring-1 ring-[#ffd3d6]">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <p className="text-base font-medium text-slate-900">
                  Em atraso
                </p>
              </div>

              <p className="text-5xl font-bold tracking-tight text-slate-950">
                {summary.emAtraso}
              </p>
            </div>
          </button>

          <article
            className={`relative min-h-[236px] overflow-hidden rounded-[18px] border border-slate-200/70 bg-white p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)] xl:col-span-4 ${getQuickCardClass(
              "all",
            )}`}
          >
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#ffbd7b] bg-[#fff7df] text-[#ec3f12]">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-950">
                    Porcentagem de entrega
                  </p>
                </div>
              </div>

              <div>
                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                  <p className="text-4xl font-black tracking-tight text-slate-950">
                    {formatPercentage(summary.porcentagemEntrega)}
                  </p>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#ec3f12] transition-all"
                      style={{ width: progressWidth }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <p className="text-base font-semibold text-slate-500">
                    {summary.entregues} de {summary.totalPedidos} pedidos
                  </p>
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    onClick={() => toggleQuickFilter("abertas")}
                  >
                    Ver abertas
                  </button>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="overflow-hidden rounded-[30px] border border-slate-200/70 bg-white shadow-[0_24px_70px_rgba(52,52,52,0.08)]">
          <div className="relative overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#fff7df_48%,#fff1f2_100%)] px-6 py-6">
            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#fab519]/25 blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[#ec3139]/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ec3139]">
                  Detalhamento
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#343434] md:text-3xl">
                  Lista detalhada dos CTRCs
                </h2>

                <p className="mt-2 inline-flex rounded-full border border-slate-200 bg-white/75 px-3 py-1 text-sm font-semibold leading-6 text-slate-600">
                  Total filtrado: {sortedRows.length} registros.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-[#fab519]/50 bg-[#fab519]/15 px-4 py-3 text-sm font-bold text-[#343434]">
                  {getQuickFilterLabel(activeQuickFilter)}
                </div>

                {activeQuickFilter !== "all" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-2xl border-slate-200 bg-white px-4 font-semibold text-slate-700 transition hover:border-[#fab519]/60 hover:bg-[#fab519]/10"
                    onClick={() => toggleQuickFilter("all")}
                  >
                    Limpar filtro rápido
                  </Button>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm text-slate-600 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-[#ec3139]" />

                    <span>
                      Ordenação atual: {sortField} (
                      {sortDirection === "asc" ? "crescente" : "decrescente"})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/70 p-4">
            {loading ? (
              <div className="rounded-[26px] border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3 rounded-[22px] border border-[#fab519]/40 bg-[#fab519]/10 px-5 py-4 text-sm font-semibold text-[#343434]">
                  <RefreshCcw className="h-4 w-4 animate-spin text-[#ec3139]" />
                  Carregando entregas...
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                  <div className="max-h-[680px] overflow-auto">
                    <table className="min-w-[1740px] border-separate border-spacing-0">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-[#343434] text-left text-[11px] uppercase tracking-[0.14em] text-white/72 shadow-sm">
                          {[
                            ["nro_ctrc", "Nº CTRC"],
                            ["ser_ctrc", "Serie"],
                            ["nome_cli_dest", "Cliente destino"],
                            ["cidade_origem", "Origem"],
                            ["cidade_dest", "Destino"],
                            ["uf_dest", "UF"],
                            ["data_prev_ent", "Prev. entrega"],
                            ["data_entrega", "Data entrega"],
                            ["hora_entrega", "Hora entrega"],
                            ["ult_ocor", "Ult. ocorrencia"],
                            ["ocorrencia", "Descrição ocorrencia"],
                            ["status_entrega", "Status"],
                            ["em_atraso", "Em atraso"],
                            ["sla_entrega", "SLA"],
                            ["classificacao_rota", "Classificacao"],
                          ].map(([field, label]) => {
                            const sortable = [
                              "nro_ctrc",
                              "nome_cli_dest",
                              "cidade_origem",
                              "cidade_dest",
                              "uf_dest",
                              "data_prev_ent",
                              "data_entrega",
                              "status_entrega",
                              "sla_entrega",
                              "classificacao_rota",
                            ].includes(field);

                            return (
                              <th
                                key={field}
                                className="border-b border-white/10 px-4 py-4 font-bold"
                              >
                                {sortable ? (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-2 text-left transition hover:text-[#fab519]"
                                    onClick={() =>
                                      toggleSort(field as SortField)
                                    }
                                  >
                                    <span>{label}</span>

                                    {sortField === field ? (
                                      sortDirection === "asc" ? (
                                        <ArrowUpAZ className="h-3.5 w-3.5 text-[#fab519]" />
                                      ) : (
                                        <ArrowDownAZ className="h-3.5 w-3.5 text-[#fab519]" />
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
                              colSpan={DELIVERY_TABLE_COLUMNS.length}
                              className="px-4 py-12 text-center text-sm text-slate-500"
                            >
                              Nenhuma entrega encontrada com os filtros atuais.
                            </td>
                          </tr>
                        ) : (
                          paginatedRows.map((row, index) => (
                            <tr
                              key={`${row.seq_ctrc}-${row.nro_ctrc}`}
                              className={`align-top transition hover:bg-[#fab519]/10 ${
                                index % 2 === 0 ? "bg-white" : "bg-slate-50/55"
                              }`}
                            >
                              <td className="border-b border-slate-100 px-4 py-4">
                                <div className="inline-flex rounded-2xl bg-[#343434] px-3 py-2 text-sm font-black text-white shadow-[0_10px_22px_rgba(52,52,52,0.12)]">
                                  {row.nro_ctrc}
                                </div>
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm font-semibold text-slate-600">
                                {row.ser_ctrc}
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm">
                                <p className="max-w-[220px] font-bold leading-6 text-[#343434]">
                                  {row.nome_cli_dest}
                                </p>
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                                {row.cidade_origem}
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                                {row.cidade_dest}
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm">
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                                  {row.uf_dest}
                                </span>
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                                {formatDate(row.data_prev_ent)}
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                                {formatDate(row.data_entrega)}
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-600">
                                {row.hora_entrega || "-"}
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                  {row.ult_ocor || "-"}
                                </span>
                              </td>

                              <td className="max-w-[360px] border-b border-slate-100 px-4 py-4 text-sm">
                                <p className="max-w-[300px] leading-6 text-slate-600">
                                  {row.ocorrencia || "-"}
                                </p>
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm">
                                <Badge
                                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusBadgeClass(
                                    row.status_entrega,
                                  )}`}
                                >
                                  {row.status_entrega}
                                </Badge>
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm">
                                <Badge
                                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getLateBadgeClass(
                                    row.em_atraso,
                                  )}`}
                                >
                                  {row.em_atraso}
                                </Badge>
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm">
                                <Badge
                                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getSlaBadgeClass(
                                    row.sla_entrega,
                                  )}`}
                                >
                                  {row.sla_entrega}
                                </Badge>
                              </td>

                              <td className="border-b border-slate-100 px-4 py-4 text-sm">
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                                  {row.classificacao_rota || "-"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Página {page} de {totalPages}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-2xl border-slate-200 bg-white px-4 font-semibold text-slate-700 transition hover:border-[#fab519]/60 hover:bg-[#fab519]/10"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                    >
                      Anterior
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-2xl border-slate-200 bg-[#343434] px-4 font-semibold text-white transition hover:bg-[#eb2c38] disabled:bg-slate-200 disabled:text-slate-400"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
