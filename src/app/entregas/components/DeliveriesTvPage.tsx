"use client";

import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";

import { useAuth } from "@/context/auth-context";
import {
  getCities,
  getDeliveries,
  getRegions,
  getDeliveriesSummary,
} from "@/services/deliveries.service";
import type {
  DeliveryCity,
  DeliveryFilters,
  DeliveryRegion,
  DeliveryRow,
  DeliverySummary,
} from "@/types/deliveries";

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

const EMPTY_SUMMARY: DeliverySummary = {
  totalPedidos: 0,
  entregues: 0,
  pendentes: 0,
  emAtraso: 0,
  entregueDentroDoSla: 0,
  entregueForaDoSla: 0,
  porcentagemEntrega: 0,
};

const numberFormatter = new Intl.NumberFormat("pt-BR");
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR");
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const DASHBOARD_COLORS = {
  page: "#f6f8fc",
  surface: "#ffffff",
  surfaceSoft: "#f8fafc",
  border: "#e4e9f1",

  text: "#101828",
  textSecondary: "#667085",

  primary: "#3b82f6",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#0ea5e9",
};

const dashboardCardSx = {
  bgcolor: DASHBOARD_COLORS.surface,
  border: `1px solid ${DASHBOARD_COLORS.border}`,
  borderRadius: "18px",
  boxShadow: "0 4px 16px rgba(16, 24, 40, 0.06)",
};

type DailyMetric = {
  date: string;
  total: number;
  delivered: number;
  pending: number;
  inSla: number;
  outSla: number;
};

type OccurrenceMetric = {
  label: string;
  quantity: number;
};

const ALL_OPERATIONS = "Todos";
const ALL_FILTERS = "Todos";
const BRAZIL_STATE_NAMES: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapa",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceara",
  DF: "Distrito Federal",
  ES: "Espirito Santo",
  GO: "Goias",
  MA: "Maranhao",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Para",
  PB: "Paraiba",
  PR: "Parana",
  PE: "Pernambuco",
  PI: "Piaui",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondonia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "Sao Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

type TvFilterState = {
  dataInicio: string;
  dataFim: string;
  ufDest: string;
  cidadeDest: string;
};

const DEFAULT_TV_FILTERS: TvFilterState = {
  dataInicio: "",
  dataFim: "",
  ufDest: ALL_FILTERS,
  cidadeDest: ALL_FILTERS,
};

function parseDateValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00`;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value?: string | null) {
  const parsed = parseDateValue(value);

  return parsed ? dateFormatter.format(parsed) : value || "-";
}

function formatNumber(value: number) {
  return numberFormatter.format(value || 0);
}

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function getDeliveryPercent(summary: DeliverySummary) {
  if (summary.porcentagemEntrega) {
    return normalizePercent(summary.porcentagemEntrega);
  }

  if (!summary.totalPedidos) {
    return 0;
  }

  return normalizePercent((summary.entregues / summary.totalPedidos) * 100);
}

function groupRowsByDate(rows: DeliveryRow[]) {
  const metrics = new Map<string, DailyMetric>();

  rows.forEach((row) => {
    const key = row.data_ref || "Sem data";
    const current =
      metrics.get(key) ??
      {
        date: key,
        total: 0,
        delivered: 0,
        pending: 0,
        inSla: 0,
        outSla: 0,
      };

    current.total += 1;

    if (row.status_entrega === "Entregue") {
      current.delivered += 1;
    } else {
      current.pending += 1;
    }

    if (row.sla_entrega === "DENTRO DO SLA") {
      current.inSla += 1;
    }

    if (row.sla_entrega === "FORA DO SLA") {
      current.outSla += 1;
    }

    metrics.set(key, current);
  });

  return Array.from(metrics.values())
    .sort((left, right) => {
      const leftDate = parseDateValue(left.date)?.getTime() ?? 0;
      const rightDate = parseDateValue(right.date)?.getTime() ?? 0;

      return rightDate - leftDate;
    })
    .slice(0, 8);
}

function groupOccurrences(rows: DeliveryRow[]) {
  const metrics = new Map<string, number>();

  rows.forEach((row) => {
    const label = row.ocorrencia?.trim() || row.status_entrega || "Sem ocorrência";
    metrics.set(label, (metrics.get(label) ?? 0) + 1);
  });

  return Array.from(metrics.entries())
    .map(([label, quantity]) => ({ label, quantity }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 7);
}

function getActiveFilters(
  operation: string,
  filterState: TvFilterState,
): DeliveryFilters {
  return {
    ...DEFAULT_FILTERS,
    classificacaoRota: operation === ALL_OPERATIONS ? "Todos" : operation,
    dataInicio: filterState.dataInicio,
    dataFim: filterState.dataFim,
    ufDest: filterState.ufDest === ALL_FILTERS ? "" : filterState.ufDest,
    cidadeDest:
      filterState.cidadeDest === ALL_FILTERS ? "" : filterState.cidadeDest,
  };
}

function getOperationLabel(operation: string) {
  return operation === "-" ? "Sem operação" : operation;
}

function getUfLabel(uf: string) {
  if (uf === ALL_FILTERS) {
    return "Todos";
  }

  return BRAZIL_STATE_NAMES[uf] ? `${uf} ${BRAZIL_STATE_NAMES[uf]}` : uf;
}

function getAvailableOperations(regions: DeliveryRegion[], rows: DeliveryRow[]) {
  const values = new Set<string>();

  regions.forEach((region) => {
    if (region.classificacao_rota) {
      values.add(region.classificacao_rota);
    }
  });

  rows.forEach((row) => {
    if (row.classificacao_rota) {
      values.add(row.classificacao_rota);
    }
  });

  return Array.from(values).sort((left, right) => {
    if (left === "-") return 1;
    if (right === "-") return -1;

    return left.localeCompare(right, "pt-BR");
  });
}

function getAvailableUfs(cities: DeliveryCity[], rows: DeliveryRow[]) {
  const values = new Set<string>();

  cities.forEach((city) => {
    if (city.uf_dest) {
      values.add(city.uf_dest);
    }
  });

  rows.forEach((row) => {
    if (row.uf_dest) {
      values.add(row.uf_dest);
    }
  });

  return Array.from(values).sort((left, right) =>
    left.localeCompare(right, "pt-BR"),
  );
}

function getAvailableCities(cities: DeliveryCity[], filters: TvFilterState) {
  return cities
    .filter((city) => {
      if (filters.ufDest === ALL_FILTERS) {
        return true;
      }

      return city.uf_dest === filters.ufDest;
    })
    .map((city) => city.cidade_dest)
    .filter(Boolean)
    .filter((city, index, list) => list.indexOf(city) === index)
    .sort((left, right) => left.localeCompare(right, "pt-BR"));
}

export default function DeliveriesTvPage() {
  const { token, loading: authLoading } = useAuth();

  const [rows, setRows] = useState<DeliveryRow[]>([]);
  const [cities, setCities] = useState<DeliveryCity[]>([]);
  const [regions, setRegions] = useState<DeliveryRegion[]>([]);
  const [selectedOperation, setSelectedOperation] = useState(ALL_OPERATIONS);
  const [draftFilters, setDraftFilters] =
    useState<TvFilterState>(DEFAULT_TV_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<TvFilterState>(DEFAULT_TV_FILTERS);

  const [showFilters, setShowFilters] = useState(false);
  const [summary, setSummary] = useState<DeliverySummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (authLoading || !token) {
      return;
    }

    let isMounted = true;
    const authToken = token;
    const activeFilters = getActiveFilters(
      selectedOperation,
      appliedFilters,
    );

    async function loadData() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [deliveryRows, deliverySummary] = await Promise.all([
          getDeliveries(activeFilters, authToken),
          getDeliveriesSummary(activeFilters, authToken),
        ]);

        if (!isMounted) {
          return;
        }

        setRows(deliveryRows);
        setSummary(deliverySummary);
        setLastUpdatedAt(new Date());
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o painel da TV.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    const intervalId = window.setInterval(() => {
      void loadData();
    }, 60_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [
    authLoading,
    appliedFilters,
    selectedOperation,
    token,
  ]);

  useEffect(() => {
    if (authLoading || !token) {
      return;
    }

    let isMounted = true;
    const authToken = token;

    async function loadOperations() {
      try {
        const deliveryRegions = await getRegions(DEFAULT_FILTERS, authToken);

        if (isMounted) {
          setRegions(deliveryRegions);
        }
      } catch (error) {
        console.error(error);
      }
    }

    void loadOperations();

    return () => {
      isMounted = false;
    };
  }, [authLoading, token]);

  useEffect(() => {
    if (authLoading || !token) {
      return;
    }

    let isMounted = true;
    const authToken = token;
    const optionFilters = getActiveFilters(
      selectedOperation,
      {
        ...draftFilters,
        ufDest: ALL_FILTERS,
        cidadeDest: ALL_FILTERS,
      },
    );

    async function loadCities() {
      try {
        const deliveryCities = await getCities(optionFilters, authToken);

        if (isMounted) {
          setCities(deliveryCities);
        }
      } catch (error) {
        console.error(error);
      }
    }

    void loadCities();

    return () => {
      isMounted = false;
    };
  }, [
    authLoading,
    draftFilters.dataFim,
    draftFilters.dataInicio,
    selectedOperation,
    token,
  ]);

  const deliveryPercent = useMemo(() => getDeliveryPercent(summary), [summary]);
  const occurrenceMetrics = useMemo(() => groupOccurrences(rows), [rows]);
  const availableOperations = useMemo(
    () => getAvailableOperations(regions, rows),
    [regions, rows],
  );
  const availableUfs = useMemo(
    () => getAvailableUfs(cities, rows),
    [cities, rows],
  );
  const availableCities = useMemo(
    () => getAvailableCities(cities, draftFilters),
    [cities, draftFilters],
  );

  const slaPercent = summary.entregues
    ? normalizePercent((summary.entregueDentroDoSla / summary.entregues) * 100)
    : 0;

  const periodLabel = useMemo(() => {
    if (
      appliedFilters.dataInicio &&
      appliedFilters.dataFim
    ) {
      return `${formatDate(
        appliedFilters.dataInicio,
      )} até ${formatDate(appliedFilters.dataFim)}`;
    }

    if (appliedFilters.dataInicio) {
      return `A partir de ${formatDate(
        appliedFilters.dataInicio,
      )}`;
    }

    if (appliedFilters.dataFim) {
      return `Até ${formatDate(
        appliedFilters.dataFim,
      )}`;
    }

    return "Todos os períodos";
  }, [
    appliedFilters.dataFim,
    appliedFilters.dataInicio,
  ]);

  const destinationLabel = useMemo(() => {
    if (
      appliedFilters.cidadeDest !== ALL_FILTERS
    ) {
      return appliedFilters.cidadeDest;
    }

    if (appliedFilters.ufDest !== ALL_FILTERS) {
      return `Todas as cidades - ${appliedFilters.ufDest}`;
    }

    return "Todos os destinos";
  }, [
    appliedFilters.cidadeDest,
    appliedFilters.ufDest,
  ]);

  const operationLabel =
    selectedOperation === ALL_OPERATIONS
      ? "Todas as operações"
      : getOperationLabel(selectedOperation);


  if (authLoading) {
    return <FullScreenLoader />;
  }

  if (!token) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: DASHBOARD_COLORS.page,
          color: DASHBOARD_COLORS.text,
          overflowX: "hidden",
          overflowY: "auto",
          p: {
            xs: 2,
            lg: 3,
          },
        }}
      >
        <Alert severity="warning">Faça login para acessar o modo TV.</Alert>
      </Box>
    );
  }

  if (loading && !rows.length) {
    return <FullScreenLoader />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: DASHBOARD_COLORS.page,
        color: DASHBOARD_COLORS.text,
        overflowX: "hidden",
        overflowY: "auto",
        p: { xs: 2, lg: 3 },
      }}
    >
      <Stack spacing={2} sx={{ minHeight: "calc(100vh - 48px)" }}>
        <TvHeader
          lastUpdatedAt={lastUpdatedAt}
          loading={loading}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            minHeight: 40,
            mb: -0.5,
          }}
        >
          <Button
            variant={showFilters ? "contained" : "outlined"}
            startIcon={<FilterListRoundedIcon />}
            onClick={() => {
              setShowFilters((current) => !current);
            }}
            sx={{
              height: 40,
              borderRadius: "10px",
              px: 2,

              color: showFilters
                ? "#ffffff"
                : DASHBOARD_COLORS.primary,

              bgcolor: showFilters
                ? DASHBOARD_COLORS.primary
                : DASHBOARD_COLORS.surface,

              borderColor: DASHBOARD_COLORS.primary,
              fontWeight: 800,
              textTransform: "none",

              "&:hover": {
                bgcolor: showFilters
                  ? "#2563eb"
                  : "#eff6ff",
              },
            }}
          >
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </Button>
        </Box>

        <Collapse in={showFilters} unmountOnExit>
          <TvFiltersPanel
            availableCities={availableCities}
            availableOperations={availableOperations}
            availableUfs={availableUfs}
            filters={draftFilters}
            onChangeFilters={setDraftFilters}
            selectedOperation={selectedOperation}
            onSelectOperation={setSelectedOperation}
            onApplyFilters={() => {
              setAppliedFilters(draftFilters);
              setShowFilters(false);
            }}
            onClearFilters={() => {
              setDraftFilters(DEFAULT_TV_FILTERS);
              setAppliedFilters(DEFAULT_TV_FILTERS);
              setSelectedOperation(ALL_OPERATIONS);
              setShowFilters(false);
            }}
          />
        </Collapse>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <ContextCard
            title="Cidade / destino"
            value={destinationLabel}
            icon={<MapRoundedIcon />}
            accent={DASHBOARD_COLORS.primary}
          />

          <ContextCard
            title="Período aplicado"
            value={periodLabel}
            icon={<CalendarMonthRoundedIcon />}
            accent={DASHBOARD_COLORS.info}
          />

          <ContextCard
            title="Operação"
            value={operationLabel}
            icon={<LocalShippingRoundedIcon />}
            accent="#8b5cf6"
          />

          <ContextCard
            title="Última atualização"
            value={
              lastUpdatedAt
                ? timeFormatter.format(lastUpdatedAt)
                : "--:--"
            }
            subtitle="Atualização automática a cada 60 segundos"
            icon={<AccessTimeRoundedIcon />}
            accent={DASHBOARD_COLORS.success}
          />
        </Box>

        {errorMessage ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: "14px",
              border: "1px solid #fecaca",
              bgcolor: "#fef2f2",
              color: "#991b1b",
              "& .MuiAlert-icon": { color: DASHBOARD_COLORS.danger },
            }}
          >
            {errorMessage}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(5, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <MetricCard
            accent={DASHBOARD_COLORS.primary}
            title="Total de pedidos"
            subtitle="Pedidos no período"
            value={summary.totalPedidos}
            icon={<LocalShippingRoundedIcon />}
          />

          <MetricCard
            accent={DASHBOARD_COLORS.success}
            title="Entregues"
            subtitle="Pedidos concluídos"
            value={summary.entregues}
            icon={<TaskAltRoundedIcon />}
          />

          <MetricCard
            accent={DASHBOARD_COLORS.warning}
            title="Pendentes"
            subtitle="Aguardando conclusão"
            value={summary.pendentes}
            icon={<AccessTimeRoundedIcon />}
          />

          <MetricCard
            accent={DASHBOARD_COLORS.info}
            title="Dentro do SLA"
            subtitle="Dentro do prazo"
            value={summary.entregueDentroDoSla}
            icon={<LocalShippingRoundedIcon />}
          />

          <MetricCard
            accent={DASHBOARD_COLORS.danger}
            title="Fora do SLA"
            subtitle="Fora do prazo"
            value={summary.entregueForaDoSla}
            icon={<WarningAmberRoundedIcon />}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              xl: "minmax(0, 1.55fr) minmax(360px, 0.85fr)",
            },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <MainProgressPanel
            deliveryPercent={deliveryPercent}
            slaPercent={slaPercent}
            summary={summary}
          />

          <OccurrencePanel
            occurrences={occurrenceMetrics}
            total={summary.totalPedidos}
          />
        </Box>

        <DeliveryDetailsTable rows={rows} />
      </Stack>
    </Box>
  );
}

function FullScreenLoader() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        bgcolor: DASHBOARD_COLORS.page,
        color: DASHBOARD_COLORS.text,
      }}
    >
      <CircularProgress
        sx={{ color: DASHBOARD_COLORS.primary }}
        size={52}
        thickness={4}
      />

      <Typography sx={{ fontWeight: 700 }}>
        Carregando painel de entregas...
      </Typography>
    </Box>
  );
}

type ContextCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  accent: string;
  icon: React.ReactNode;
};

function ContextCard({
  title,
  value,
  subtitle,
  accent,
  icon,
}: ContextCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...dashboardCardSx,
        p: 2.25,
        minHeight: 112,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 48,
          height: 48,
          borderRadius: "14px",
          display: "grid",
          placeItems: "center",
          bgcolor: `${accent}14`,
          color: accent,

          "& svg": {
            fontSize: 26,
          },
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: DASHBOARD_COLORS.textSecondary,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".04em",
          }}
        >
          {title}
        </Typography>

        <Typography
          noWrap
          title={value}
          sx={{
            mt: 0.5,
            color: DASHBOARD_COLORS.text,
            fontSize: 19,
            fontWeight: 800,
          }}
        >
          {value}
        </Typography>

        {subtitle ? (
          <Typography
            noWrap
            sx={{
              mt: 0.3,
              color:
                DASHBOARD_COLORS.textSecondary,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    </Paper>
  );
}

type TvHeaderProps = {
  lastUpdatedAt: Date | null;
  loading: boolean;
};

function TvHeader({
  lastUpdatedAt,
  loading,
}: TvHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...dashboardCardSx,
        px: { xs: 2, lg: 3 },
        py: 2,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "auto auto" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2.5,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Box
            component="img"
            src="/imagem/logopizzatto.png"
            alt="Pizzatto Log"
            sx={{
              width: 136,
              height: 50,
              objectFit: "contain",
            }}
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: DASHBOARD_COLORS.border }}
          />

          <Box>
            <Typography
              sx={{
                color: DASHBOARD_COLORS.primary,
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}
            >
              Modo TV
            </Typography>

            <Typography
              component="h1"
              sx={{
                color: DASHBOARD_COLORS.text,
                fontSize: { xs: 24, lg: 32 },
                fontWeight: 900,
                lineHeight: 1.05,
              }}
            >
              Monitoramento de entregas
            </Typography>
          </Box>
        </Stack>

        <Stack
          spacing={0.75}
          sx={{ alignItems: { xs: "flex-start", lg: "flex-end" } }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <AccessTimeRoundedIcon
              sx={{ color: DASHBOARD_COLORS.info, fontSize: 22 }}
            />

            <Typography
              sx={{
                color: DASHBOARD_COLORS.textSecondary,
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              Atualizado {lastUpdatedAt ? timeFormatter.format(lastUpdatedAt) : "--:--"}
            </Typography>
          </Stack>

          <Chip
            size="small"
            label={loading ? "Sincronizando" : "Atualização automática 60s"}
            sx={{
              bgcolor: loading ? "#fffbeb" : "#ecfdf3",
              color: loading ? "#92400e" : DASHBOARD_COLORS.success,
              border: loading ? "1px solid #fde68a" : "1px solid #bbf7d0",
              fontWeight: 800,
            }}
          />
        </Stack>
      </Box>
    </Paper>
  );
}

type TvFiltersPanelProps = {
  availableCities: string[];
  availableOperations: string[];
  availableUfs: string[];
  filters: TvFilterState;
  onChangeFilters: React.Dispatch<React.SetStateAction<TvFilterState>>;
  onSelectOperation: (operation: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  selectedOperation: string;
};

function TvFiltersPanel({
  availableCities,
  availableOperations,
  availableUfs,
  filters,
  onChangeFilters,
  onSelectOperation,
  onApplyFilters,
  onClearFilters,
  selectedOperation,
}: TvFiltersPanelProps) {
  function updateFilter<K extends keyof TvFilterState>(
    field: K,
    value: TvFilterState[K],
  ) {
    onChangeFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateUfFilter(ufDest: string) {
    onChangeFilters((current) => ({
      ...current,
      ufDest,

      // Sempre limpa a cidade ao trocar o estado.
      // Isso evita manter uma cidade pertencente a outra UF.
      cidadeDest: ALL_FILTERS,
    }));
  }

  const hasActiveFilters =
    Boolean(filters.dataInicio) ||
    Boolean(filters.dataFim) ||
    filters.ufDest !== ALL_FILTERS ||
    filters.cidadeDest !== ALL_FILTERS ||
    selectedOperation !== ALL_OPERATIONS;

  return (
    <Paper
      elevation={0}
      sx={{
        ...dashboardCardSx,
        borderRadius: "18px",
        p: {
          xs: 2,
          lg: 2.25,
        },
      }}
    >
      {/* Cabeçalho do painel */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: DASHBOARD_COLORS.text,
              fontSize: 17,
              fontWeight: 850,
            }}
          >
            Filtros do painel
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              color: DASHBOARD_COLORS.textSecondary,
              fontSize: 12,
            }}
          >
            Defina o período e o destino das entregas
          </Typography>
        </Box>

        <Chip
          size="small"
          label={
            hasActiveFilters
              ? "Filtros selecionados"
              : "Todos os registros"
          }
          sx={{
            bgcolor: hasActiveFilters
              ? "#eff6ff"
              : "#f8fafc",

            color: hasActiveFilters
              ? DASHBOARD_COLORS.primary
              : DASHBOARD_COLORS.textSecondary,

            border: hasActiveFilters
              ? "1px solid #bfdbfe"
              : `1px solid ${DASHBOARD_COLORS.border}`,

            fontWeight: 750,
          }}
        />
      </Box>

      {/* Campos dos filtros */}
      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            md: "repeat(2, minmax(0, 1fr))",

            xl: `
              minmax(360px, 1.1fr)
              minmax(240px, 0.75fr)
              minmax(240px, 0.75fr)
              minmax(260px, 0.85fr)
              minmax(270px, auto)
            `,
          },

          gap: 1.5,
          alignItems: "end",
        }}
      >
        {/* Período */}
        <Stack spacing={0.75}>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: "center",
              minHeight: 24,
            }}
          >
            <CalendarMonthRoundedIcon
              sx={{
                color: DASHBOARD_COLORS.info,
                fontSize: 20,
              }}
            />

            <Typography
              sx={{
                color: DASHBOARD_COLORS.text,
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: ".03em",
              }}
            >
              Período
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: 1.25,
            }}
          >
            <TextField
              label="Início"
              type="date"
              value={filters.dataInicio}
              onChange={(event) => {
                updateFilter(
                  "dataInicio",
                  event.target.value,
                );
              }}
              size="small"
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={dateFieldSx}
            />

            <TextField
              label="Fim"
              type="date"
              value={filters.dataFim}
              onChange={(event) => {
                updateFilter(
                  "dataFim",
                  event.target.value,
                );
              }}
              size="small"
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={dateFieldSx}
            />
          </Box>
        </Stack>

        {/* Operacao */}
        <Stack spacing={0.75}>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: "center",
              minHeight: 24,
            }}
          >
            <LocalShippingRoundedIcon
              sx={{
                color: "#8b5cf6",
                fontSize: 20,
              }}
            />

            <Typography
              sx={{
                color: DASHBOARD_COLORS.text,
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: ".03em",
              }}
            >
              Operacao
            </Typography>
          </Stack>

          <FormControl
            size="small"
            fullWidth
            sx={selectFieldSx}
          >
            <InputLabel id="tv-operation-filter-label">
              Operacao
            </InputLabel>

            <Select
              labelId="tv-operation-filter-label"
              label="Operação"
              value={selectedOperation}
              onChange={(event) => {
                onSelectOperation(String(event.target.value));
              }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      mt: 0.5,
                      maxHeight: 320,
                      borderRadius: "12px",
                      boxShadow:
                        "0 12px 30px rgba(16, 24, 40, 0.14)",
                    },
                  },
                },
              }}
            >
              <MenuItem value={ALL_OPERATIONS}>
                Todas as operações
              </MenuItem>

              {availableOperations.map((operation) => (
                <MenuItem key={operation} value={operation}>
                  {getOperationLabel(operation)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Estado */}
        <Stack spacing={0.75}>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: "center",
              minHeight: 24,
            }}
          >
            <MapRoundedIcon
              sx={{
                color: DASHBOARD_COLORS.primary,
                fontSize: 20,
              }}
            />

            <Typography
              sx={{
                color: DASHBOARD_COLORS.text,
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: ".03em",
              }}
            >
              Estado / UF
            </Typography>
          </Stack>

          <FormControl
            size="small"
            fullWidth
            sx={selectFieldSx}
          >
            <InputLabel id="tv-uf-filter-label">
              Estado
            </InputLabel>

            <Select
              labelId="tv-uf-filter-label"
              label="Estado"
              value={filters.ufDest}
              onChange={(event) => {
                updateUfFilter(String(event.target.value));
              }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      mt: 0.5,
                      maxHeight: 320,
                      borderRadius: "12px",
                      boxShadow:
                        "0 12px 30px rgba(16, 24, 40, 0.14)",
                    },
                  },
                },
              }}
            >
              <MenuItem value={ALL_FILTERS}>
                Todos os estados
              </MenuItem>

              {availableUfs.map((uf) => (
                <MenuItem key={uf} value={uf}>
                  {getUfLabel(uf)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Cidade */}
        <Stack spacing={0.75}>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: "center",
              minHeight: 24,
            }}
          >
            <FilterAltRoundedIcon
              sx={{
                color: "#8b5cf6",
                fontSize: 20,
              }}
            />

            <Typography
              sx={{
                color: DASHBOARD_COLORS.text,
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: ".03em",
              }}
            >
              Cidade
            </Typography>
          </Stack>

          <FormControl
            size="small"
            fullWidth
            sx={selectFieldSx}
          >
            <InputLabel id="tv-city-filter-label">
              Destino
            </InputLabel>

            <Select
              labelId="tv-city-filter-label"
              label="Destino"
              value={filters.cidadeDest}
              onChange={(event) => {
                updateFilter(
                  "cidadeDest",
                  String(event.target.value),
                );
              }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      mt: 0.5,
                      maxHeight: 320,
                      borderRadius: "12px",
                      boxShadow:
                        "0 12px 30px rgba(16, 24, 40, 0.14)",
                    },
                  },
                },
              }}
            >
              <MenuItem value={ALL_FILTERS}>
                Todas as cidades
              </MenuItem>

              {availableCities.map((city) => (
                <MenuItem
                  key={city}
                  value={city}
                >
                  {city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Botões */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",

            gridColumn: {
              xs: "1",
              md: "1 / -1",
              xl: "auto",
            },
          }}
        >
          <Button
            variant="contained"
            onClick={onApplyFilters}
            sx={{
              flex: 1,
              minWidth: 145,
              height: 44,
              borderRadius: "11px",

              bgcolor: DASHBOARD_COLORS.primary,
              color: "#ffffff",

              boxShadow:
                "0 5px 12px rgba(59, 130, 246, 0.2)",

              fontSize: 14,
              fontWeight: 800,
              textTransform: "none",

              "&:hover": {
                bgcolor: "#2563eb",
                boxShadow:
                  "0 7px 16px rgba(59, 130, 246, 0.26)",
              },
            }}
          >
            Aplicar filtros
          </Button>

          <Button
            variant="outlined"
            startIcon={<RestartAltRoundedIcon />}
            disabled={!hasActiveFilters}
            onClick={onClearFilters}
            sx={{
              flex: 1,
              minWidth: 115,
              height: 44,
              borderRadius: "11px",

              color: DASHBOARD_COLORS.text,
              borderColor: DASHBOARD_COLORS.border,

              fontSize: 14,
              fontWeight: 750,
              textTransform: "none",

              "&:hover": {
                bgcolor: DASHBOARD_COLORS.surfaceSoft,
                borderColor: "#94a3b8",
              },

              "&.Mui-disabled": {
                color: "#b8bec8",
                borderColor: "#e5e7eb",
              },
            }}
          >
            Limpar
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
const filterSectionTitleSx = {
  color: DASHBOARD_COLORS.text,
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".04em",
};

function getHeaderChipSx(active: boolean) {
  return {
    bgcolor: active
      ? DASHBOARD_COLORS.primary
      : DASHBOARD_COLORS.surfaceSoft,
    color: active ? "#ffffff" : DASHBOARD_COLORS.text,
    border: active
      ? `1px solid ${DASHBOARD_COLORS.primary}`
      : `1px solid ${DASHBOARD_COLORS.border}`,
    borderRadius: "10px",
    height: 36,
    fontSize: 14,
    fontWeight: 800,
    boxShadow: active
      ? "0 5px 14px rgba(59, 130, 246, 0.22)"
      : "none",
    "&:hover": {
      bgcolor: active ? "#2563eb" : "#eef4fb",
    },
  };
}

const dateFieldSx = {
  "& .MuiInputBase-root": {
    height: 44,
    bgcolor: DASHBOARD_COLORS.surfaceSoft,
    color: DASHBOARD_COLORS.text,
    borderRadius: "11px",
    fontWeight: 700,
  },

  "& .MuiInputLabel-root": {
    color: DASHBOARD_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: 650,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: DASHBOARD_COLORS.primary,
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: DASHBOARD_COLORS.border,
  },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#93c5fd",
  },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: DASHBOARD_COLORS.primary,
    borderWidth: 2,
  },

  "& input": {
    py: 1.1,
    fontSize: 14,
  },

  "& input::-webkit-calendar-picker-indicator": {
    opacity: 0.65,
    cursor: "pointer",
  },
};
const selectFieldSx = {
  "& .MuiInputBase-root": {
    height: 44,
    bgcolor: DASHBOARD_COLORS.surfaceSoft,
    color: DASHBOARD_COLORS.text,
    borderRadius: "11px",
    fontWeight: 700,
  },

  "& .MuiInputLabel-root": {
    color: DASHBOARD_COLORS.textSecondary,
    fontSize: 13,
    fontWeight: 650,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: DASHBOARD_COLORS.primary,
  },

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: DASHBOARD_COLORS.border,
  },

  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#93c5fd",
  },

  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: DASHBOARD_COLORS.primary,
    borderWidth: 2,
  },

  "& .MuiSelect-select": {
    py: 1.1,
    fontSize: 14,
  },

  "& .MuiSelect-icon": {
    color: DASHBOARD_COLORS.textSecondary,
  },
};
type MainProgressPanelProps = {
  deliveryPercent: number;
  slaPercent: number;
  summary: DeliverySummary;
};

function MainProgressPanel({
  deliveryPercent,
  slaPercent,
  summary,
}: MainProgressPanelProps) {
  const outsideSlaPercent = summary.entregues
    ? normalizePercent(
      (summary.entregueForaDoSla / summary.entregues) * 100,
    )
    : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        ...dashboardCardSx,
        p: {
          xs: 2.5,
          lg: 3,
        },
        minHeight: 410,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: DASHBOARD_COLORS.text,
              fontSize: {
                xs: 20,
                lg: 23,
              },
              fontWeight: 800,
            }}
          >
            Performance operacional
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: DASHBOARD_COLORS.textSecondary,
              fontSize: 14,
            }}
          >
            Visão consolidada das entregas no período selecionado
          </Typography>
        </Box>

        <Chip
          label="Tempo real"
          size="small"
          sx={{
            bgcolor: "#ecfdf3",
            color: DASHBOARD_COLORS.success,
            border: "1px solid #bbf7d0",
            fontWeight: 800,
          }}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "300px minmax(0, 1fr)",
          },
          alignItems: "center",
          gap: {
            xs: 3,
            lg: 4,
          },
        }}
      >
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
          }}
        >
          <Box
            role="img"
            aria-label={`${percentFormatter.format(
              deliveryPercent,
            )}% das entregas concluídas`}
            sx={{
              width: {
                xs: 220,
                lg: 260,
              },
              maxWidth: "100%",
              aspectRatio: "1 / 1",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              position: "relative",

              background: `conic-gradient(
                ${DASHBOARD_COLORS.primary}
                ${deliveryPercent * 3.6}deg,
                #e8edf5 0deg
              )`,

              boxShadow:
                "0 14px 34px rgba(59, 130, 246, 0.16)",

              "&::after": {
                content: '""',
                position: "absolute",
                inset: "15%",
                borderRadius: "50%",
                bgcolor: DASHBOARD_COLORS.surface,
                boxShadow:
                  "inset 0 0 0 1px rgba(228, 233, 241, 0.9)",
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  color: DASHBOARD_COLORS.text,
                  fontSize: {
                    xs: 42,
                    lg: 50,
                  },
                  fontWeight: 900,
                  lineHeight: 1,
                }}
              >
                {percentFormatter.format(deliveryPercent)}%
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  color: DASHBOARD_COLORS.textSecondary,
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                }}
              >
                Entregas concluídas
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color: DASHBOARD_COLORS.textSecondary,
                  fontSize: 13,
                }}
              >
                {formatNumber(summary.entregues)} de{" "}
                {formatNumber(summary.totalPedidos)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack spacing={2}>
          <ProgressLine
            color={DASHBOARD_COLORS.success}
            backgroundColor="#ecfdf3"
            label="Entregues"
            value={deliveryPercent}
            detail={`${formatNumber(
              summary.entregues,
            )} de ${formatNumber(summary.totalPedidos)}`}
            icon={<TaskAltRoundedIcon />}
          />

          <ProgressLine
            color={DASHBOARD_COLORS.info}
            backgroundColor="#f0f9ff"
            label="Dentro do SLA"
            value={slaPercent}
            detail={`${formatNumber(
              summary.entregueDentroDoSla,
            )} entregas`}
            icon={<LocalShippingRoundedIcon />}
          />

          <ProgressLine
            color={DASHBOARD_COLORS.danger}
            backgroundColor="#fef2f2"
            label="Fora do SLA"
            value={outsideSlaPercent}
            detail={`${formatNumber(
              summary.entregueForaDoSla,
            )} entregas`}
            icon={<WarningAmberRoundedIcon />}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: 1.5,
              pt: 0.5,
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "14px",
              }}
            >
              <Typography
                sx={{
                  color: "#92400e",
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                Pendentes
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color: DASHBOARD_COLORS.warning,
                  fontSize: 28,
                  lineHeight: 1,
                  fontWeight: 900,
                }}
              >
                {formatNumber(summary.pendentes)}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                bgcolor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "14px",
              }}
            >
              <Typography
                sx={{
                  color: "#991b1b",
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                Em atraso
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color: DASHBOARD_COLORS.danger,
                  fontSize: 28,
                  lineHeight: 1,
                  fontWeight: 900,
                }}
              >
                {formatNumber(summary.emAtraso)}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}

type ProgressLineProps = {
  backgroundColor: string;
  color: string;
  detail: string;
  icon: React.ReactNode;
  label: string;
  value: number;
};

function ProgressLine({
  backgroundColor,
  color,
  detail,
  icon,
  label,
  value,
}: ProgressLineProps) {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: backgroundColor,
        border: `1px solid ${color}24`,
        borderRadius: "16px",
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            alignItems: "center",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: "12px",
              bgcolor: DASHBOARD_COLORS.surface,
              color,
              display: "grid",
              placeItems: "center",
              boxShadow:
                "0 3px 8px rgba(16, 24, 40, 0.06)",

              "& svg": {
                fontSize: 22,
              },
            }}
          >
            {icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: DASHBOARD_COLORS.text,
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              {label}
            </Typography>

            <Typography
              noWrap
              sx={{
                mt: 0.2,
                color: DASHBOARD_COLORS.textSecondary,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {detail}
            </Typography>
          </Box>
        </Stack>

        <Typography
          sx={{
            color,
            fontSize: 18,
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {percentFormatter.format(normalizePercent(value))}%
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={normalizePercent(value)}
        sx={{
          mt: 1.5,
          height: 8,
          borderRadius: 999,
          bgcolor: `${color}1A`,

          "& .MuiLinearProgress-bar": {
            bgcolor: color,
            borderRadius: 999,
          },
        }}
      />
    </Box>
  );
}

type MetricCardProps = {
  accent: string;
  title: string;
  subtitle: string;
  value: number;
  icon: React.ReactNode;
};

function MetricCard({
  accent,
  title,
  subtitle,
  value,
  icon,
}: MetricCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...dashboardCardSx,
        p: 2.25,
        minHeight: 150,
        position: "relative",
        overflow: "hidden",

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: accent,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              color:
                DASHBOARD_COLORS.textSecondary,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 1.4,
              color: accent,
              fontSize: {
                xs: 34,
                lg: 40,
              },
              lineHeight: 1,
              fontWeight: 850,
            }}
          >
            {formatNumber(value)}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: "14px",
            display: "grid",
            placeItems: "center",
            bgcolor: `${accent}14`,
            color: accent,

            "& svg": {
              fontSize: 27,
            },
          }}
        >
          {icon}
        </Box>
      </Box>

      <Typography
        sx={{
          mt: 1.5,
          color: DASHBOARD_COLORS.textSecondary,
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        {subtitle}
      </Typography>
    </Paper>
  );
}

type DeliveryDetailsTableProps = {
  rows: DeliveryRow[];
};

function DeliveryDetailsTable({ rows }: DeliveryDetailsTableProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...dashboardCardSx,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          borderBottom: `1px solid ${DASHBOARD_COLORS.border}`,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: DASHBOARD_COLORS.text,
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            Resumo detalhado
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              color: DASHBOARD_COLORS.textSecondary,
              fontSize: 13,
            }}
          >
            Pedidos filtrados com status, SLA, destino e ocorrencia
          </Typography>
        </Box>

        <Chip
          label={`${rows.length} ${rows.length === 1 ? "registro" : "registros"}`}
          size="small"
          sx={{
            bgcolor: "#eff6ff",
            color: DASHBOARD_COLORS.primary,
            border: "1px solid #bfdbfe",
            fontWeight: 800,
          }}
        />
      </Box>

      <TableContainer sx={{ maxHeight: 520 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {[
                "Data",
                "CTRC",
                "Destino",
                "UF",
                "Status",
                "SLA",
                "Previsao",
                "Entrega",
                "Ocorrencia",
              ].map((label) => (
                <TableCell
                  key={label}
                  align={["UF", "Status", "SLA"].includes(label) ? "center" : "left"}
                  sx={headCellSx}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  hover
                  key={`${row.sigla_fil_emit}-${row.seq_ctrc}-${row.ser_ctrc}-${row.nro_ctrc}-${row.data_ref}`}
                  sx={{
                    "&:last-child td": {
                      borderBottom: 0,
                    },

                    "&:hover td": {
                      bgcolor: "#f8fbff",
                    },
                  }}
                >
                  <TableCell sx={bodyCellSx}>{formatDate(row.data_ref)}</TableCell>

                  <TableCell sx={bodyCellSx}>
                    <Typography sx={{ fontSize: 14, fontWeight: 850 }}>
                      {row.nro_ctrc || "-"}
                    </Typography>
                    <Typography
                      sx={{
                        color: DASHBOARD_COLORS.textSecondary,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Serie {row.ser_ctrc || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ ...bodyCellSx, minWidth: 220 }}>
                    <Typography
                      title={row.nome_cli_dest}
                      sx={{
                        color: DASHBOARD_COLORS.text,
                        fontSize: 13,
                        fontWeight: 800,
                        maxWidth: 250,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.nome_cli_dest || "-"}
                    </Typography>
                    <Typography
                      sx={{
                        color: DASHBOARD_COLORS.textSecondary,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {row.cidade_dest || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell align="center" sx={bodyCellSx}>
                    {row.uf_dest || "-"}
                  </TableCell>

                  <TableCell align="center" sx={bodyCellSx}>
                    <StatusBadge status={row.status_entrega} />
                  </TableCell>

                  <TableCell align="center" sx={bodyCellSx}>
                    <SlaBadge sla={row.sla_entrega} />
                  </TableCell>

                  <TableCell sx={bodyCellSx}>
                    {formatDate(row.data_prev_ent)}
                  </TableCell>

                  <TableCell sx={bodyCellSx}>
                    {formatDate(row.data_entrega)}
                  </TableCell>

                  <TableCell sx={{ ...bodyCellSx, minWidth: 260 }}>
                    <Typography
                      title={row.ocorrencia}
                      sx={{
                        color: DASHBOARD_COLORS.text,
                        fontSize: 13,
                        fontWeight: 700,
                        maxWidth: 330,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.ocorrencia || "-"}
                    </Typography>
                    <Typography
                      sx={{
                        color: DASHBOARD_COLORS.textSecondary,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Operacao: {getOperationLabel(row.classificacao_rota || "-")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  align="center"
                  sx={{
                    ...bodyCellSx,
                    py: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color: DASHBOARD_COLORS.text,
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    Nenhuma entrega carregada
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      color: DASHBOARD_COLORS.textSecondary,
                      fontSize: 13,
                    }}
                  >
                    Altere os filtros para consultar outros dados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function StatusBadge({ status }: { status: DeliveryRow["status_entrega"] }) {
  const color =
    status === "Entregue"
      ? DASHBOARD_COLORS.success
      : status === "Em atraso"
        ? DASHBOARD_COLORS.danger
        : DASHBOARD_COLORS.warning;

  return (
    <Chip
      size="small"
      label={status}
      sx={{
        bgcolor: `${color}14`,
        color,
        border: `1px solid ${color}33`,
        borderRadius: "8px",
        fontSize: 12,
        fontWeight: 850,
      }}
    />
  );
}

function SlaBadge({ sla }: { sla: DeliveryRow["sla_entrega"] }) {
  const color =
    sla === "DENTRO DO SLA"
      ? DASHBOARD_COLORS.success
      : sla === "FORA DO SLA"
        ? DASHBOARD_COLORS.danger
        : DASHBOARD_COLORS.textSecondary;

  return (
    <Chip
      size="small"
      label={sla}
      sx={{
        bgcolor: `${color}14`,
        color,
        border: `1px solid ${color}33`,
        borderRadius: "8px",
        fontSize: 12,
        fontWeight: 850,
      }}
    />
  );
}

type DailyTableProps = {
  dailyMetrics: DailyMetric[];
};

function DailyTable({
  dailyMetrics,
}: DailyTableProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...dashboardCardSx,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          borderBottom: `1px solid ${DASHBOARD_COLORS.border}`,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: DASHBOARD_COLORS.text,
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            Resumo por data
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              color: DASHBOARD_COLORS.textSecondary,
              fontSize: 13,
            }}
          >
            Evolução diária dos pedidos e indicadores de SLA
          </Typography>
        </Box>

        <Chip
          label={`${dailyMetrics.length} ${dailyMetrics.length === 1 ? "dia" : "dias"
            }`}
          size="small"
          sx={{
            bgcolor: "#eff6ff",
            color: DASHBOARD_COLORS.primary,
            border: "1px solid #bfdbfe",
            fontWeight: 800,
          }}
        />
      </Box>

      <TableContainer
        sx={{
          maxHeight: 430,
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {[
                "Data",
                "Pedidos",
                "Entregues",
                "Pendentes",
                "Dentro SLA",
                "Fora SLA",
              ].map((label) => (
                <TableCell
                  key={label}
                  align={label === "Data" ? "left" : "center"}
                  sx={headCellSx}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {dailyMetrics.length ? (
              dailyMetrics.map((metric) => (
                <TableRow
                  hover
                  key={metric.date}
                  sx={{
                    "&:last-child td": {
                      borderBottom: 0,
                    },

                    "&:hover td": {
                      bgcolor: "#f8fbff",
                    },
                  }}
                >
                  <TableCell sx={bodyCellSx}>
                    <Typography
                      sx={{
                        color: DASHBOARD_COLORS.text,
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {formatDate(metric.date)}
                    </Typography>
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={bodyCellSx}
                  >
                    {formatNumber(metric.total)}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      ...bodyCellSx,
                      color: DASHBOARD_COLORS.success,
                    }}
                  >
                    {formatNumber(metric.delivered)}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      ...bodyCellSx,
                      color: DASHBOARD_COLORS.warning,
                    }}
                  >
                    {formatNumber(metric.pending)}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      ...bodyCellSx,
                      color: DASHBOARD_COLORS.info,
                    }}
                  >
                    {formatNumber(metric.inSla)}
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      ...bodyCellSx,
                      color: DASHBOARD_COLORS.danger,
                    }}
                  >
                    {formatNumber(metric.outSla)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{
                    ...bodyCellSx,
                    py: 6,
                  }}
                >
                  <Typography
                    sx={{
                      color: DASHBOARD_COLORS.text,
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    Nenhuma entrega carregada
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      color:
                        DASHBOARD_COLORS.textSecondary,
                      fontSize: 13,
                    }}
                  >
                    Altere os filtros para consultar outros dados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

type OccurrencePanelProps = {
  occurrences: OccurrenceMetric[];
  total: number;
};

function OccurrencePanel({
  occurrences,
  total,
}: OccurrencePanelProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...dashboardCardSx,
        minHeight: 410,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2.25,
          borderBottom: `1px solid ${DASHBOARD_COLORS.border}`,
        }}
      >
        <Typography
          sx={{
            color: DASHBOARD_COLORS.text,
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          Ocorrências mais frequentes
        </Typography>

        <Typography
          sx={{
            mt: 0.4,
            color: DASHBOARD_COLORS.textSecondary,
            fontSize: 13,
          }}
        >
          Principais motivos registrados no período
        </Typography>
      </Box>

      <Stack
        spacing={0}
        sx={{
          px: 2.5,
          py: 1,
        }}
      >
        {occurrences.length ? (
          occurrences.map((occurrence, index) => {
            const percent = total
              ? normalizePercent(
                (occurrence.quantity / total) * 100,
              )
              : 0;

            const isFirst = index === 0;

            return (
              <Box
                key={occurrence.label}
                sx={{
                  py: 1.65,
                  borderBottom:
                    index < occurrences.length - 1
                      ? `1px solid ${DASHBOARD_COLORS.border}`
                      : "none",
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 34,
                      height: 34,
                      borderRadius: "10px",
                      display: "grid",
                      placeItems: "center",

                      bgcolor: isFirst
                        ? "#fff1f2"
                        : "#eff6ff",

                      color: isFirst
                        ? DASHBOARD_COLORS.danger
                        : DASHBOARD_COLORS.primary,

                      fontSize: 14,
                      fontWeight: 900,
                    }}
                  >
                    {index + 1}
                  </Box>

                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      title={occurrence.label}
                      sx={{
                        color: DASHBOARD_COLORS.text,
                        fontSize: 14,
                        fontWeight: 750,
                        lineHeight: 1.25,

                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {occurrence.label}
                    </Typography>

                    <Stack
                      direction="row"
                      sx={{
                        mt: 0.5,
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            DASHBOARD_COLORS.textSecondary,
                          fontSize: 12,
                        }}
                      >
                        {percentFormatter.format(percent)}% do volume
                      </Typography>

                      <Typography
                        sx={{
                          color: isFirst
                            ? DASHBOARD_COLORS.danger
                            : DASHBOARD_COLORS.primary,
                          fontSize: 16,
                          fontWeight: 900,
                        }}
                      >
                        {formatNumber(occurrence.quantity)}
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{
                        mt: 0.8,
                        height: 6,
                        borderRadius: 999,
                        bgcolor: "#edf1f6",

                        "& .MuiLinearProgress-bar": {
                          bgcolor: isFirst
                            ? DASHBOARD_COLORS.danger
                            : DASHBOARD_COLORS.primary,
                          borderRadius: 999,
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Box>
            );
          })
        ) : (
          <Box
            sx={{
              minHeight: 260,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              p: 3,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: DASHBOARD_COLORS.text,
                  fontSize: 17,
                  fontWeight: 800,
                }}
              >
                Nenhuma ocorrência encontrada
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color: DASHBOARD_COLORS.textSecondary,
                  fontSize: 13,
                }}
              >
                Não existem ocorrências para os filtros aplicados.
              </Typography>
            </Box>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

const headCellSx = {
  bgcolor: "#f8fafc",
  color: DASHBOARD_COLORS.textSecondary,
  borderColor: DASHBOARD_COLORS.border,
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".04em",
  py: 1.5,
};

const bodyCellSx = {
  bgcolor: DASHBOARD_COLORS.surface,
  color: DASHBOARD_COLORS.text,
  borderColor: DASHBOARD_COLORS.border,
  fontSize: 14,
  fontWeight: 700,
  py: 1.6,
  transition: "background-color 150ms ease",
};
