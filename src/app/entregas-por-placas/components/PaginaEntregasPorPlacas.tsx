"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  AccessTimeRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  LocalShippingRounded,
  PersonRounded,
  RefreshRounded,
  RouteRounded,
  SearchRounded,
} from "@mui/icons-material";

import { AppLayout } from "@/components/layout/app-layout";

import {
  CrmKpiCard,
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";

import { useAuth } from "@/context/auth-context";

import { getMonitoramentoEntregasPorPlacas } from "@/services/entregas-por-placas.service";

import type {
  MonitoramentoEntregasPorPlacasResponse,
  MonitoramentoEntregasPorPlacasRow,
} from "@/types/entregas-por-placas";

const tableHeadSx = {
  bgcolor: crmPalette.text,
  color: "rgba(255,255,255,0.82)",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  borderBottom: 0,
  whiteSpace: "nowrap",
};

const compactFieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 44,
    borderRadius: "12px",
    bgcolor: "#fff",
    fontSize: 14,
    fontWeight: 800,
  },
  "& .MuiInputLabel-root": {
    fontSize: 13,
    fontWeight: 800,
  },
  "& .MuiFormLabel-root:not(.MuiInputLabel-shrink)": {
    transform: "translate(14px, 11px) scale(1)",
  },
};

type FiltroResumoMonitoramento =
  | "todos"
  | "ctrcs"
  | "entregues"
  | "faltam"
  | "concluido";

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function formatPercent(value: number | null | undefined) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(Number(value || 0))}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [ano, mes, dia] = value.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDataHora(data: string | null, hora: string | null) {
  if (!data && !hora) {
    return "-";
  }

  return [formatDate(data), hora]
    .filter((item) => item && item !== "-")
    .join(" ");
}

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function getStatusConfig(row: MonitoramentoEntregasPorPlacasRow) {
  if (row.status_rota === "Finalizada") {
    return {
      label: "Finalizada",
      color: crmPalette.green,
      bg: "#ecfdf5",
    };
  }

  if (row.status_rota === "Em andamento") {
    return {
      label: "Em andamento",
      color: crmPalette.blue,
      bg: "#eaf4ff",
    };
  }

  return {
    label: "Aguardando ocorrencia",
    color: crmPalette.orangeDark,
    bg: "#fff7df",
  };
}

function getDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export default function PaginaEntregasPorPlacas() {
  const { token, loading: authLoading } = useAuth();

  const [resultado, setResultado] =
    useState<MonitoramentoEntregasPorPlacasResponse | null>(null);

  const [busca, setBusca] = useState("");
  const [dataFiltro, setDataFiltro] = useState(() => getDataHoje());
  const [filtroResumo, setFiltroResumo] =
    useState<FiltroResumoMonitoramento>("todos");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const todasRotas = resultado?.dataRows ?? [];
  const resumo = resultado?.resumo;

  const rows = useMemo(() => {
    const termo = busca.trim().toUpperCase();

    return todasRotas.filter((rota) => {
      const correspondeResumo =
        filtroResumo === "todos" ||
        (filtroResumo === "ctrcs" && rota.qtd_ctrcs > 0) ||
        (filtroResumo === "entregues" && rota.entregues > 0) ||
        (filtroResumo === "faltam" && rota.faltam > 0) ||
        (filtroResumo === "concluido" &&
          Number(rota.percentual_entregue || 0) >= 100);

      if (!correspondeResumo) {
        return false;
      }

      if (!termo) {
        return true;
      }

      return (
        (rota.romaneio ?? "").toUpperCase().includes(termo) ||
        (rota.placa_cavalo ?? "").toUpperCase().includes(termo) ||
        (rota.nome_motorista ?? "").toUpperCase().includes(termo)
      );
    });
  }, [busca, filtroResumo, todasRotas]);

  const carregarMonitoramento = useCallback(async () => {
    if (!token) {
      return;
    }

    setErro(null);

    try {
      setCarregando(true);

      const data = await getMonitoramentoEntregasPorPlacas(
        {
          data: dataFiltro,
        },
        token,
      );

      setResultado(data);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar o monitoramento.";

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }, [token, dataFiltro]);

  useEffect(() => {
    if (!authLoading && token) {
      void carregarMonitoramento();
    }
  }, [authLoading, carregarMonitoramento, token]);

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Operação"
          title="Monitoramento de entregas"
          description="Acompanhe as rotas monitoradas, motoristas e o andamento das entregas."
          icon={<LocalShippingRounded sx={{ fontSize: 32 }} />}
          aside={
            <Button
              variant="contained"
              disabled={carregando || authLoading}
              startIcon={
                carregando ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <RefreshRounded sx={{ fontSize: 20 }} />
                )
              }
              onClick={() => void carregarMonitoramento()}
              sx={{
                minHeight: 46,
                px: 2.5,
                borderRadius: "12px",
                bgcolor: crmPalette.orange,
                fontWeight: 900,
                textTransform: "none",

                "&:hover": {
                  bgcolor: crmPalette.orangeDark,
                },
              }}
            >
              Atualizar
            </Button>
          }
        />

        <CrmSection
          sx={{
            p: {
              xs: 1.5,
              md: 2,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={1.25}
            sx={{
              alignItems: {
                xs: "stretch",
                md: "center",
              },
            }}
          >
            <TextField
              label="Dia"
              type="date"
              size="small"
              value={dataFiltro}
              onChange={(event) => setDataFiltro(event.target.value)}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthRounded sx={{ color: "#94a3b8", fontSize: 19 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                ...compactFieldSx,
                width: {
                  xs: "100%",
                  md: 170,
                },
              }}
            />

            <TextField
              label="Buscar rota"
              size="small"
              placeholder="Romaneio, placa ou motorista"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded sx={{ color: "#94a3b8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                ...compactFieldSx,
                width: {
                  xs: "100%",
                  md: 360,
                },
              }}
            />
          </Stack>
        </CrmSection>

        {erro ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: "12px",
            }}
          >
            {erro}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(5, minmax(0, 1fr))",
            },

            gap: 2,
          }}
        >
          <CrmKpiCard
            title="Rotas"
            value={formatNumber(resumo?.qtdRotas)}
            icon={<RouteRounded sx={{ fontSize: 27 }} />}
            accent={crmPalette.blue}
            softColor="#eaf4ff"
            active={filtroResumo === "todos"}
            onClick={() => setFiltroResumo("todos")}
            ariaLabel="Mostrar todas as rotas"
            ariaPressed={filtroResumo === "todos"}
          />

          <CrmKpiCard
            title="CTRCs"
            value={formatNumber(resumo?.qtdCtrcs)}
            icon={<LocalShippingRounded sx={{ fontSize: 27 }} />}
            accent={crmPalette.blue}
            softColor="#eaf4ff"
            active={filtroResumo === "ctrcs"}
            onClick={() => setFiltroResumo("ctrcs")}
            ariaLabel="Filtrar rotas com CTRCs"
            ariaPressed={filtroResumo === "ctrcs"}
          />

          <CrmKpiCard
            title="Entregues"
            value={formatNumber(resumo?.entregues)}
            icon={<CheckCircleRounded sx={{ fontSize: 27 }} />}
            accent={crmPalette.green}
            softColor="#ecfdf5"
            active={filtroResumo === "entregues"}
            onClick={() => setFiltroResumo("entregues")}
            ariaLabel="Filtrar rotas com entregas realizadas"
            ariaPressed={filtroResumo === "entregues"}
          />

          <CrmKpiCard
            title="Faltam"
            value={formatNumber(resumo?.faltam)}
            icon={<AccessTimeRounded sx={{ fontSize: 27 }} />}
            accent={crmPalette.yellow}
            softColor="#fff7df"
            active={filtroResumo === "faltam"}
            onClick={() => setFiltroResumo("faltam")}
            ariaLabel="Filtrar rotas com entregas pendentes"
            ariaPressed={filtroResumo === "faltam"}
          />

          <CrmKpiCard
            title="Concluido"
            value={formatPercent(resumo?.percentualEntregue)}
            icon={<CheckCircleRounded sx={{ fontSize: 27 }} />}
            accent={crmPalette.green}
            softColor="#ecfdf5"
            active={filtroResumo === "concluido"}
            onClick={() => setFiltroResumo("concluido")}
            ariaLabel="Filtrar rotas concluidas"
            ariaPressed={filtroResumo === "concluido"}
          />
        </Box>

        <CrmSection>
          <Box
            sx={{
              px: {
                xs: 2,
                md: 2.5,
              },

              py: 2,

              borderBottom: `1px solid ${crmPalette.border}`,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              sx={{
                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },

                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: crmPalette.orangeDark,

                    fontSize: 12,

                    fontWeight: 900,

                    letterSpacing: ".16em",

                    textTransform: "uppercase",
                  }}
                >
                  Operação de entregas por placas
                </Typography>

                <Typography
                  component="h2"
                  sx={{
                    color: crmPalette.text,

                    fontSize: 23,

                    fontWeight: 900,
                  }}
                >
                  Romaneios em acompanhamento
                </Typography>
              </Box>

              <Chip
                icon={<PersonRounded />}
                label={`${formatNumber(rows.length)} rota(s)`}
                sx={{
                  fontWeight: 800,

                  "& .MuiChip-icon": {
                    fontSize: 17,
                  },
                }}
              />
            </Stack>
          </Box>

          {carregando ? <LinearProgress /> : null}

          {!carregando && rows.length === 0 ? (
            <Alert
              severity="info"
              sx={{
                m: 2,
                borderRadius: "12px",
              }}
            >
              Nenhuma rota encontrada para a data selecionada.
            </Alert>
          ) : (
            <Box
              sx={{
                bgcolor: "#f8fafc",

                p: {
                  xs: 1.25,
                  md: 1.5,
                },
              }}
            >
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: `1px solid ${crmPalette.border}`,

                  borderRadius: "14px",

                  overflow: "auto",

                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                }}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    minWidth: 1050,
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeadSx}>Romaneio</TableCell>

                      <TableCell sx={tableHeadSx}>Placa</TableCell>

                      <TableCell sx={tableHeadSx}>Motorista</TableCell>

                      <TableCell sx={tableHeadSx}>Data / Hora</TableCell>

                      <TableCell sx={tableHeadSx}>CTRCs</TableCell>

                      <TableCell sx={tableHeadSx}>Entregues</TableCell>

                      <TableCell sx={tableHeadSx}>Faltam</TableCell>

                      <TableCell sx={tableHeadSx}>Progresso</TableCell>

                      <TableCell sx={tableHeadSx}>Status</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.map((row, index) => {
                      const status = getStatusConfig(row);
                      const progresso = clampProgress(
                        Number(row.percentual_entregue || 0),
                      );

                      return (
                        <TableRow
                          hover
                          key={`${row.seq_manifesto ?? row.romaneio ?? index}`}
                          sx={{
                            bgcolor: index % 2 === 0 ? "#fff" : "#f8fafc",

                            "&:hover": {
                              bgcolor: "#fff7df!important",
                            },
                          }}
                        >
                          <TableCell>
                            <Typography
                              sx={{
                                color: crmPalette.blue,

                                fontWeight: 900,
                              }}
                            >
                              {row.romaneio ?? "-"}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 900,
                              }}
                            >
                              {row.placa_cavalo || "-"}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 800,
                              }}
                            >
                              {row.nome_motorista || "-"}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {formatDataHora(
                              row.data_inclusao,
                              row.hora_inclusao,
                            )}
                          </TableCell>

                          <TableCell
                            sx={{
                              fontWeight: 900,
                            }}
                          >
                            {formatNumber(row.qtd_ctrcs)}
                          </TableCell>

                          <TableCell
                            sx={{
                              color: crmPalette.green,

                              fontWeight: 900,
                            }}
                          >
                            {formatNumber(row.entregues)}
                          </TableCell>

                          <TableCell
                            sx={{
                              color:
                                row.faltam > 0
                                  ? crmPalette.red
                                  : crmPalette.green,

                              fontWeight: 900,
                            }}
                          >
                            {formatNumber(row.faltam)}
                          </TableCell>

                          <TableCell
                            sx={{
                              minWidth: 160,
                            }}
                          >
                            <Stack spacing={0.7}>
                              <LinearProgress
                                variant="determinate"
                                value={progresso}
                                sx={{
                                  height: 8,

                                  borderRadius: 999,

                                  bgcolor: "#e2e8f0",

                                  "& .MuiLinearProgress-bar": {
                                    bgcolor:
                                      progresso === 100
                                        ? crmPalette.green
                                        : crmPalette.orange,
                                  },
                                }}
                              />

                              <Typography
                                sx={{
                                  color: crmPalette.muted,

                                  fontSize: 12,

                                  fontWeight: 800,
                                }}
                              >
                                {formatPercent(progresso)}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={status.label}
                              sx={{
                                bgcolor: status.bg,

                                color: status.color,

                                fontWeight: 900,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CrmSection>
      </CrmPageShell>
    </AppLayout>
  );
}
