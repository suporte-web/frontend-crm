"use client";

import { hasAnyRole } from "@/lib/user-roles";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChartSpline } from "lucide-react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AppLayout } from "@/components/layout/app-layout";
import {
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
} from "@/components/mui/crm-primitives";
import { appScreens, isScreenEnabledForRole } from "@/config/screens";
import { useAuth } from "@/context/auth-context";
import { ManualAnalyticsReports } from "@/components/marketing/ManualAnalyticsReports";
import { listarIntegracoesMarketing } from "@/services/marketing-integrations.service";
import { carregarMetricasMarketing } from "@/services/marketing-metrics.service";
import type {
  MarketingMetrics,
  MarketingSummary,
  MetricsFilter,
} from "@/types/marketing-metrics";

const screen = appScreens.find((item) => item.key === "marketingMetrics")!;
const number = new Intl.NumberFormat("pt-BR");
const dateLabel = (date: string) => date.split("-").reverse().join("/");

function AccessChart({ acessos }: { acessos: MarketingSummary["acessos"] }) {
  const [metric, setMetric] = useState<
    "sessoes" | "usuarios" | "visualizacoes"
  >("sessoes");
  const max = Math.max(1, ...acessos.map((day) => day[metric]));
  const x = (index: number) =>
    55 + (index * 880) / Math.max(1, acessos.length - 1);
  const y = (value: number) => 225 - (value * 180) / max;
  const labels = new Set([
    0,
    Math.floor((acessos.length - 1) / 2),
    acessos.length - 1,
  ]);
  return (
    <CrmSection sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", mb: 2 }}
      >
        <Typography variant="h6">Acessos por período</Typography>
        <TextField
          select
          size="small"
          label="Indicador"
          value={metric}
          onChange={(event) => setMetric(event.target.value as typeof metric)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="sessoes">Sessões</MenuItem>
          <MenuItem value="usuarios">Usuários</MenuItem>
          <MenuItem value="visualizacoes">Visualizações</MenuItem>
        </TextField>
      </Stack>
      <Box sx={{ overflowX: "auto" }}>
        <svg
          viewBox="0 0 980 270"
          role="img"
          aria-label={`Evolução diária de ${metric}`}
          style={{ width: "100%", minWidth: 700 }}
        >
          <title>Evolução diária de {metric}</title>
          {[0, 0.5, 1].map((ratio) => (
            <g key={ratio}>
              <line
                x1="55"
                x2="935"
                y1={y(max * ratio)}
                y2={y(max * ratio)}
                stroke="#e2e8f0"
              />
              <text
                x="45"
                y={y(max * ratio) + 4}
                textAnchor="end"
                fill="#64748b"
                fontSize="16"
              >
                {new Intl.NumberFormat("pt-BR", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(max * ratio)}
              </text>
            </g>
          ))}
          <polyline
            fill="none"
            stroke="#ff4d00"
            strokeWidth="3"
            points={acessos
              .map((day, index) => `${x(index)},${y(day[metric])}`)
              .join(" ")}
          />
          {acessos.map((day, index) => (
            <g key={day.data}>
              <circle cx={x(index)} cy={y(day[metric])} r="4" fill="#ff4d00">
                <title>
                  {dateLabel(day.data)}: {number.format(day[metric])}
                </title>
              </circle>
              {labels.has(index) ? (
                <text
                  x={x(index)}
                  y="255"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="16"
                >
                  {dateLabel(day.data)}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </Box>
    </CrmSection>
  );
}

function MetricsTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <CrmSection>
      <Typography variant="h6" sx={{ p: 2.5 }}>
        {title}
      </Typography>
      {!rows.length ? (
        <Typography sx={{ p: 3 }} color="text.secondary">
          Nenhum dado no período selecionado.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small" aria-label={title}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {row.map((value, cell) => (
                    <TableCell
                      key={cell}
                      sx={{ maxWidth: 400, overflowWrap: "anywhere" }}
                    >
                      {typeof value === "number" ? number.format(value) : value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CrmSection>
  );
}

export default function MarketingMetricsPage() {
  const { token, user, loading: authLoading } = useAuth();
  const allowed = Boolean(
    user &&
    hasAnyRole(user, ["ADMIN", "MARKETING"]) &&
    isScreenEnabledForRole(
      screen,
      user.roles?.length ? user.roles : user.role,
      user.screenPermissions,
    ),
  );
  const [filter, setFilter] = useState<MetricsFilter>({ periodo: "30" });
  const [source, setSource] = useState<"manual" | "google">("manual");
  const [draft, setDraft] = useState<MetricsFilter>({ periodo: "30" });
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token || !allowed || source === "manual") return;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      setMetrics(null);
      try {
        const integrations = await listarIntegracoesMarketing(token);
        if (controller.signal.aborted) return;
        const ga = integrations.find(
          (item) => item.provider === "GOOGLE_ANALYTICS",
        );
        const isConnected = Boolean(
          ga?.ativo && typeof ga.metadata?.propertyId === "string",
        );
        setConnected(isConnected);
        if (isConnected) {
          const result = await carregarMetricasMarketing(
            token!,
            filter,
            controller.signal,
          );
          if (!controller.signal.aborted) setMetrics(result);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as métricas. Tente novamente.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [token, allowed, filter, reload, source]);

  return (
    <AppLayout>
      {authLoading ? (
        <CircularProgress aria-label="Carregando" />
      ) : !allowed ? (
        <Alert severity="warning">
          Esta área é restrita aos perfis de Marketing e Administração com
          acesso às métricas.
        </Alert>
      ) : (
        <CrmPageShell>
          <CrmPageHeader
            eyebrow="Marketing"
            title="Métricas"
            icon={<ChartSpline size={24} />}
            description="Acompanhe os acessos, a origem do tráfego e os resultados do site no Google Analytics 4."
            aside={
              source === "google" ? (
                <Button
                  onClick={() => setReload((value) => value + 1)}
                  disabled={loading}
                >
                  Atualizar
                </Button>
              ) : undefined
            }
          />
          <TextField
            select
            label="Origem dos dados"
            value={source}
            onChange={(event) =>
              setSource(event.target.value as "manual" | "google")
            }
            sx={{ maxWidth: 400 }}
          >
            <MenuItem value="manual">
              Importação de CSV (sem Google Cloud)
            </MenuItem>
            <MenuItem value="google">Conexão automática com o Google</MenuItem>
          </TextField>
          {source === "manual" ? (
            <ManualAnalyticsReports token={token} />
          ) : (
            <>
              <CrmSection sx={{ p: 2.5 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    select
                    label="Período"
                    value={draft.periodo}
                    sx={{ minWidth: 200 }}
                    onChange={(event) => {
                      const value = {
                        ...draft,
                        periodo: event.target.value as MetricsFilter["periodo"],
                      };
                      setDraft(value);
                      if (value.periodo !== "personalizado") setFilter(value);
                    }}
                  >
                    <MenuItem value="7">7 dias</MenuItem>
                    <MenuItem value="30">30 dias</MenuItem>
                    <MenuItem value="90">90 dias</MenuItem>
                    <MenuItem value="personalizado">
                      Período personalizado
                    </MenuItem>
                  </TextField>
                  {draft.periodo === "personalizado" ? (
                    <>
                      <TextField
                        type="date"
                        label="Início"
                        value={draft.inicio ?? ""}
                        slotProps={{ inputLabel: { shrink: true } }}
                        onChange={(event) =>
                          setDraft({ ...draft, inicio: event.target.value })
                        }
                      />
                      <TextField
                        type="date"
                        label="Fim"
                        value={draft.fim ?? ""}
                        slotProps={{ inputLabel: { shrink: true } }}
                        onChange={(event) =>
                          setDraft({ ...draft, fim: event.target.value })
                        }
                      />
                      <Button
                        variant="contained"
                        disabled={
                          !draft.inicio ||
                          !draft.fim ||
                          draft.inicio > draft.fim
                        }
                        onClick={() => setFilter({ ...draft })}
                      >
                        Aplicar
                      </Button>
                    </>
                  ) : null}
                </Stack>
              </CrmSection>
              {loading ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <CircularProgress aria-label="Carregando métricas" />
                </Box>
              ) : error ? (
                <Alert
                  severity="error"
                  action={
                    <Button
                      component={Link}
                      href="/marketing/integracoes"
                      color="inherit"
                    >
                      Integrações
                    </Button>
                  }
                >
                  {error}
                </Alert>
              ) : !connected ? (
                <CrmSection sx={{ p: 4 }}>
                  <Typography sx={{ mb: 2 }}>
                    Google Analytics ainda não conectado. Configure em Marketing
                    &gt; Integrações.
                  </Typography>
                  <Button
                    component={Link}
                    href="/marketing/integracoes"
                    variant="contained"
                  >
                    Configurar integração
                  </Button>
                </CrmSection>
              ) : metrics ? (
                <>
                  <Typography color="text.secondary">
                    {dateLabel(metrics.resumo.periodo.inicio)} a{" "}
                    {dateLabel(metrics.resumo.periodo.fim)}
                    {metrics.resumo.fusoHorario
                      ? ` · Fuso da propriedade: ${metrics.resumo.fusoHorario}`
                      : ""}
                    . Os dados podem levar algum tempo para serem processados
                    pelo Google.
                  </Typography>
                  {metrics.resumo.dadosLimitados ? (
                    <Alert severity="info">
                      O Google aplicou limites de privacidade ou agregação neste
                      relatório.
                    </Alert>
                  ) : null}
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        lg: "repeat(3, 1fr)",
                      },
                    }}
                  >
                    {[
                      ["Usuários", metrics.resumo.totais.usuarios],
                      ["Sessões", metrics.resumo.totais.sessoes],
                      ["Visualizações", metrics.resumo.totais.visualizacoes],
                      ["Novos usuários", metrics.resumo.totais.novosUsuarios],
                      [
                        "Conversões (eventos principais)",
                        metrics.resumo.totais.conversoes,
                      ],
                      ["Eventos", metrics.resumo.totais.eventos],
                    ].map(([label, value]) => (
                      <CrmSection key={String(label)} sx={{ p: 3 }}>
                        <Typography color="text.secondary">{label}</Typography>
                        <Typography
                          variant="h4"
                          sx={{ mt: 1, fontWeight: 700 }}
                        >
                          {number.format(Number(value))}
                        </Typography>
                      </CrmSection>
                    ))}
                  </Box>
                  <AccessChart acessos={metrics.resumo.acessos} />
                  <MetricsTable
                    title="Origem do tráfego"
                    columns={["Origem / mídia", "Canal", "Sessões", "Usuários"]}
                    rows={metrics.trafego.map((row) => [
                      row.origem,
                      row.canal,
                      row.sessoes,
                      row.usuarios,
                    ])}
                  />
                  <MetricsTable
                    title="Páginas mais acessadas"
                    columns={["Página", "Título", "Visualizações", "Usuários"]}
                    rows={metrics.paginas.map((row) => [
                      row.pagina,
                      row.titulo,
                      row.visualizacoes,
                      row.usuarios,
                    ])}
                  />
                  <MetricsTable
                    title="Eventos mais relevantes"
                    columns={["Evento", "Quantidade", "Conversões"]}
                    rows={metrics.eventos.map((row) => [
                      row.evento,
                      row.quantidade,
                      row.conversoes,
                    ])}
                  />
                </>
              ) : null}
            </>
          )}
        </CrmPageShell>
      )}
    </AppLayout>
  );
}
