"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import {
  getCities,
  getDeliveries,
  getDeliveriesSummary,
  getOccurrences,
  getPayers,
} from "@/services/deliveries.service";
import type {
  DeliveryCity,
  DeliveryFilters,
  DeliveryOccurrence,
  DeliveryPayer,
  DeliveryRow,
  DeliverySummary,
} from "@/types/deliveries";
import { Truck } from "lucide-react";
import {
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
} from "@/components/mui/crm-primitives";
import { DeliveriesFiltersPanel } from "./DeliveriesFiltersPanel";
import { DeliverySummaryCards } from "./DeliverySummaryCards";
import { DeliveriesTable } from "./DeliveriesTable";
import type { QuickFilter, SortField } from "./delivery-page.types";

const PAGE_SIZE = 10;
const DEFAULT_FILTERS: DeliveryFilters = {
  dataInicio: "",
  dataFim: "",
  ufDest: "",
  cidadeDest: "",
  nroCtrc: "",
  cnpjPagador: "",
  ocorrencia: "",
  statusEntrega: "Todos",
  classificacaoRota: "Todos",
};

const STATUS_OPTIONS = ["Todos", "Entregue", "Pendente", "Em atraso"];

function formatDate(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

function formatFilterPeriod(filters: DeliveryFilters) {
  if (filters.dataInicio && filters.dataFim) {
    return `${formatDate(filters.dataInicio)} até ${formatDate(filters.dataFim)}`;
  }

  if (filters.dataInicio) {
    return `A partir de ${formatDate(filters.dataInicio)}`;
  }

  if (filters.dataFim) {
    return `Até ${formatDate(filters.dataFim)}`;
  }

  return "Todos os períodos";
}

function formatCnpj(value?: string | null) {
  if (!value) return "-";

  const digits = value.replace(/\D/g, "");

  if (digits.length !== 14) {
    return value;
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

function exportRowsToCsv(rows: DeliveryRow[], periodLabel: string) {
  const headers = [
    "Data referência",
    "Nº CTRC",
    "Série",
    "CNPJ pagador",
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
    "Classificação rota",
  ];

  const content = rows.map((row) => [
    formatDate(row.data_ref),
    row.nro_ctrc,
    row.ser_ctrc,
    formatCnpj(row.cgc_pag),
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
  const safePeriodLabel = periodLabel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  link.download = `monitoramento-entregas-${safePeriodLabel || new Date().toISOString().slice(0, 10)}.csv`;
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
  const [cities, setCities] = useState<DeliveryCity[]>([]);
  const [payers, setPayers] = useState<DeliveryPayer[]>([]);
  const [occurrences, setOccurrences] = useState<DeliveryOccurrence[]>([]);
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
    const values = cities.length
      ? cities.map((city) => city.uf_dest)
      : rows.map((row) => row.uf_dest);

    return Array.from(new Set(values.filter(Boolean))).sort();
  }, [cities, rows]);

  const availableCities = useMemo(() => {
    return cities
      .filter((city) => !filters.ufDest || city.uf_dest === filters.ufDest)
      .map((city) => city.cidade_dest)
      .filter(Boolean)
      .filter((city, index, list) => list.indexOf(city) === index)
      .sort((left, right) => left.localeCompare(right, "pt-BR"));
  }, [cities, filters.ufDest]);

  const availableClassifications = useMemo(() => {
    const values = rows.map((row) => row.classificacao_rota);

    return Array.from(
      new Set(values.filter((value) => value && value !== "-")),
    ).sort((left, right) => left.localeCompare(right, "pt-BR"));
  }, [rows]);

  const availablePayers = useMemo(() => {
    const values = payers.length
      ? payers.map((payer) => payer.cgc_pag)
      : rows.map((row) => row.cgc_pag);

    return Array.from(new Set(values.filter(Boolean))).sort();
  }, [payers, rows]);

  const availableOccurrences = useMemo(() => {
    const source = occurrences.length
      ? occurrences
      : rows.map((row) => ({
        ult_ocor: row.ult_ocor,
        ocorrencia: row.ocorrencia,
      }));
    const seen = new Set<string>();

    return source
      .filter((occurrence) => occurrence.ult_ocor || occurrence.ocorrencia)
      .filter((occurrence) => {
        const key = `${occurrence.ult_ocor ?? ""}|${occurrence.ocorrencia ?? ""}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .sort((left, right) => {
        const leftOccurrence = String(
          left.ocorrencia ?? left.ult_ocor ?? '',
        );

        const rightOccurrence = String(
          right.ocorrencia ?? right.ult_ocor ?? '',
        );

        return leftOccurrence.localeCompare(
          rightOccurrence,
          'pt-BR',
        );
      });

      
  }, [occurrences, rows]);
  function updateFilter<K extends keyof DeliveryFilters>(
    field: K,
    value: DeliveryFilters[K],
  ) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateUfFilter(value: string) {
    setFilters((previous) => ({
      ...previous,
      ufDest: value,
      cidadeDest: "",
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

  const canViewPage =
    user?.role &&
    ["ADMIN", "GESTAO", "COMERCIAL", "MARKETING", "CLIENTE"].includes(
      user.role,
    );

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;
    const authToken = token;

    async function loadFilterOptions() {
      try {
        const optionFilters: Partial<DeliveryFilters> = {
          dataInicio: filters.dataInicio,
          dataFim: filters.dataFim,
          ufDest: filters.ufDest,
          cidadeDest: filters.cidadeDest,
          cnpjPagador: filters.cnpjPagador,
          ocorrencia: filters.ocorrencia,
          statusEntrega: filters.statusEntrega,
        };

        const [deliveryCities, deliveryPayers, deliveryOccurrences] = await Promise.all([
          getCities(optionFilters, authToken),
          getPayers(optionFilters, authToken),
          getOccurrences(optionFilters, authToken),
        ]);

        if (!isMounted) {
          return;
        }

        setCities(deliveryCities);
        setPayers(deliveryPayers);
        setOccurrences(deliveryOccurrences);
      } catch (error) {
        console.error(error);
      }
    }

    loadFilterOptions();

    return () => {
      isMounted = false;
    };
  }, [
    filters.dataFim,
    filters.dataInicio,
    filters.cidadeDest,
    filters.cnpjPagador,
    filters.ocorrencia,
    filters.statusEntrega,
    filters.ufDest,
    token,
  ]);

  if (!authLoading && !canViewPage) {
    return (
      <AppLayout>
        <CrmSection sx={{ p: 3 }}>
          <Alert severity="error">
            Você não tem permissão para acessar o monitoramento de entregas.
          </Alert>
        </CrmSection>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Operação"
          title="Monitoramento de entregas"
          // description="Acompanhe pedidos, prazos, ocorrências e status operacional das entregas."
          icon={<Truck size={30} />}
          aside={
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                px: 2.5,
                py: 2,
                bgcolor: "#fff",
              }}
            >
              <Typography
                sx={{
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                }}
              >
                Periodo aplicado
              </Typography>
              <Typography sx={{ mt: 0.5, color: "#020617", fontSize: 18, fontWeight: 900 }}>
                {formatFilterPeriod(appliedFilters)}
              </Typography>
            </Paper>
          }
        />

        <DeliveriesFiltersPanel
          filters={filters}
          availableUfs={availableUfs}
          availableCities={availableCities}
          availablePayers={availablePayers}
          availableOccurrences={availableOccurrences}
          availableClassifications={availableClassifications}
          statusOptions={STATUS_OPTIONS}
          rowsCount={rows.length}
          onUpdateFilter={updateFilter}
          onUpdateUfFilter={updateUfFilter}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          onRefreshData={refreshData}
          onExportCsv={() => exportRowsToCsv(sortedRows, formatFilterPeriod(appliedFilters))}
        />

        {errorMessage ? (
          <Alert severity="error" sx={{ borderRadius: "12px" }}>
            <Typography sx={{ fontWeight: 900 }}>Erro ao carregar entregas</Typography>
            <Typography sx={{ mt: 0.5 }}>{errorMessage}</Typography>
          </Alert>
        ) : null}

        <DeliverySummaryCards
          summary={summary}
          activeQuickFilter={activeQuickFilter}
          onToggleQuickFilter={toggleQuickFilter}
        />

        <DeliveriesTable
          rows={paginatedRows}
          loading={loading}
          page={page}
          totalPages={totalPages}
          totalFiltered={sortedRows.length}
          activeQuickFilter={activeQuickFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          onToggleSort={toggleSort}
          onPageChange={setPage}
          onToggleQuickFilter={toggleQuickFilter}
          getQuickFilterLabel={getQuickFilterLabel}
        />
      </CrmPageShell>
    </AppLayout>
  );
}
