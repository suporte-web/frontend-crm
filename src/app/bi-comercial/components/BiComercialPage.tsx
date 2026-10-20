"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCheck,
  Clock3,
  Filter,
  Handshake,
  ListTodo,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import { hasAnyRole } from "@/lib/user-roles";
import { moeda, montarBiComercial, numero } from "@/lib/bi-comercial";
import { getLeads } from "@/services/leads.service";
import type { Lead } from "@/types/leads";

const surface = {
  border: "1px solid #e4ebf2",
  borderRadius: 2.5,
  boxShadow: "0 3px 16px rgba(30,60,90,.035)",
  backgroundColor: "#fff",
};
const campoPeriodoSx = {
  width: '100%',
  minWidth: 0,
  bgcolor: 'transparent',
  p: 0,
  '& .MuiOutlinedInput-root': {
    height: 40,
    borderRadius: '8px',
    bgcolor: '#fff',
    '& fieldset': { borderColor: '#cbd5e1' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused fieldset': { borderColor: '#ff5805' },
  },
  '& .MuiInputBase-input': { fontSize: 13, fontWeight: 400, color: '#334155' },
};
const isoLocal = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
function Card({
  title,
  value,
  detail,
  color,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <Paper elevation={0} sx={{ ...surface, p: 2.2, minWidth: 0 }}>
      <Stack direction="row" spacing={1.4} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            bgcolor: `${color}15`,
            color,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#405568" }}>
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: 30,
              fontWeight: 850,
              color: "#17374e",
              lineHeight: 1.3,
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
      <Typography sx={{ mt: 1.5, fontSize: 11, color: "#71869a" }}>
        {detail}
      </Typography>
    </Paper>
  );
}
function PanelTitle({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ ...{ color: "#204661", mb: 2 }, alignItems: "center" }}
    >
      {icon}
      <Typography component="h2" sx={{ fontSize: 15, fontWeight: 800 }}>
        {children}
      </Typography>
    </Stack>
  );
}

export default function BiComercialPage() {
  const { user, token, loading: authLoading } = useAuth();
  const allowed = hasAnyRole(user, ["ADMIN", "GESTAO", "COMERCIAL"]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [de, setDe] = useState(() =>
    isoLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  );
  const [ate, setAte] = useState(() => isoLocal(new Date()));
  const [mode, setMode] = useState<"quantidade" | "valor">("quantidade");
  useEffect(() => {
    if (authLoading || !allowed || !token) return;
    let active = true;
    setLoading(true);
    setError("");
    // Os convertidos são uma consulta explícita porque a API retorna ativos por padrão.
    Promise.all([
      getLeads(token, { convertidoParaCliente: false }),
      getLeads(token, { convertidoParaCliente: true }),
    ])
      .then(([activeLeads, converted]) => {
        if (active) {
          setLeads([...activeLeads, ...converted]);
          setUpdated(new Date());
        }
      })
      .catch((e: unknown) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar o BI Comercial.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [allowed, authLoading, token, refresh]);
  const result = useMemo(() => {
    try {
      return { data: montarBiComercial(leads, { de, ate }), error: "" };
    } catch (e) {
      return {
        data: null,
        error: e instanceof Error ? e.message : "Período inválido.",
      };
    }
  }, [leads, de, ate, updated]);
  const bi = result.data;
  const max = bi
    ? Math.max(
      1,
      ...bi.etapas.map((row) =>
        mode === "quantidade" ? row.quantidade : row.valor,
      ),
    )
    : 1;
  const subtitle =
    "Situação atual dos leads cadastrados no período selecionado.";
  return (
    <AppLayout>
      {authLoading ? (
        <CircularProgress aria-label="Carregando sessão" />
      ) : !allowed ? (
        <Alert severity="warning">
          BI Comercial disponível para Admin, Gestão e Comercial.
        </Alert>
      ) : (
        <Stack spacing={2.2} sx={{ color: "#17374e", pb: 3 }}>
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '14px', p: { xs: 2, md: 2.5 }, bgcolor: '#fff' }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', xl: 'row' }} spacing={3} sx={{ justifyContent: 'space-between', alignItems: { xl: 'center' } }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748b', mb: 0.5 }}>BI Comercial</Typography>
                  <Typography component="h1" sx={{ fontSize: { xs: 22, md: 25 }, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.3, color: '#1f2937' }}>Visão estratégica do funil</Typography>
                  <Typography sx={{ fontSize: 13, color: '#64748b', mt: 0.75, lineHeight: 1.6 }}>Acompanhe os leads e priorize os próximos contatos.</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: '170px 170px auto' }, gap: 1.5, alignItems: 'end', flexShrink: 0 }}>
                  <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                    <Typography component="label" htmlFor="periodo-bi-de" sx={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Cadastro de</Typography>
                    <TextField id="periodo-bi-de" type="date" size="small" value={de} onChange={event => setDe(event.target.value)} sx={campoPeriodoSx} />
                  </Stack>
                  <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                    <Typography component="label" htmlFor="periodo-bi-ate" sx={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Cadastro até</Typography>
                    <TextField id="periodo-bi-ate" type="date" size="small" value={ate} onChange={event => setAte(event.target.value)} sx={campoPeriodoSx} />
                  </Stack>
                  <Button
                    startIcon={<RefreshCw size={16} />}
                    variant="contained"
                    disabled={loading}
                    onClick={() => setRefresh(valor => valor + 1)}
                    sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' }, minHeight: 40, borderRadius: '8px', px: 2, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: '#ff5805', boxShadow: 'none', '&:hover': { bgcolor: '#e94f00', boxShadow: 'none' } }}
                  >Atualizar</Button>
                </Box>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: '#64748b' }}>
                  <CalendarDays size={14} style={{ flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 12, lineHeight: 1.5 }}>{subtitle}</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  {updated && <Typography sx={{ color: '#94a3b8', fontSize: 12 }}>Atualizado às {updated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Typography>}
                  <Button size="small" onClick={() => { setDe(''); setAte(''); }} disabled={!de && !ate} sx={{ minHeight: 30, borderRadius: '6px', textTransform: 'none', fontSize: 12, color: '#64748b', '&:hover': { bgcolor: '#f8fafc', color: '#334155' } }}>Todo o período</Button>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
          {(error || result.error) && (
            <Alert severity="error">{error || result.error}</Alert>
          )}
          {loading && (
            <LinearProgress
              aria-label="Atualizando BI Comercial"
              sx={{ borderRadius: 2 }}
            />
          )}
          {bi && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2,1fr)",
                    lg: "repeat(5,1fr)",
                  },
                  gap: 1.6,
                }}
              >
                <Card
                  title="Leads ativos"
                  value={numero(bi.ativos)}
                  detail="Em acompanhamento comercial"
                  color="#ff791d"
                  icon={<Users size={23} />}
                />
                <Card
                  title="Em conversão"
                  value={numero(bi.emConversao)}
                  detail="Etapa atual: Conversão"
                  color="#00a5b5"
                  icon={<Handshake size={23} />}
                />
                <Card
                  title="Em homologação"
                  value={numero(bi.emHomologacao)}
                  detail="Cadastros em homologação"
                  color="#e9a600"
                  icon={<ShieldCheck size={23} />}
                />
                <Card
                  title="Convertidos"
                  value={numero(bi.convertidos)}
                  detail="Venda efetivada, pós-venda ou cliente"
                  color="#39a82e"
                  icon={<CheckCheck size={23} />}
                />
                <Card
                  title="Sem próximo passo"
                  value={numero(bi.semProximaAcao)}
                  detail="Leads ativos sem próxima ação"
                  color="#ef5b6b"
                  icon={<ListTodo size={23} />}
                />
              </Box>
              {!loading && bi.total === 0 && !error && (
                <Alert severity="info">
                  Nenhum lead cadastrado no período selecionado.
                </Alert>
              )}
              <Paper elevation={0} sx={{ ...surface, p: 2.2 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  sx={{
                    ...{ mb: 1.5 },
                    gap: 1,
                    justifyContent: "space-between",
                    alignItems: { sm: "center" },
                  }}
                >
                  <PanelTitle icon={<Filter size={22} />}>
                    Funil comercial
                  </PanelTitle>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={mode}
                    onChange={(_, value: "quantidade" | "valor" | null) => {
                      if (value) setMode(value);
                    }}
                    sx={{
                      "& .MuiToggleButton-root": {
                        textTransform: "none",
                        px: 2,
                      },
                      "& .Mui-selected": {
                        bgcolor: "#ff5805 !important",
                        color: "#fff !important",
                      },
                    }}
                  >
                    <ToggleButton value="quantidade">Quantidade</ToggleButton>
                    <ToggleButton value="valor">
                      Valor estimado (R$)
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2,minmax(0,1fr))",
                      md: "repeat(4,minmax(0,1fr))",
                      lg: "repeat(7,minmax(0,1fr))",
                    },
                    gap: 1.4,
                  }}
                >
                  {bi.etapas.map((row) => (
                    <Box
                      key={row.value}
                      sx={{
                        border: `1px solid ${row.cor}30`,
                        borderRadius: 1.5,
                        overflow: "hidden",
                        bgcolor: "#fbfdff",
                      }}
                    >
                      <Typography
                        sx={{
                          bgcolor: row.cor,
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 750,
                          p: 1.1,
                          minHeight: 40,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {row.label}
                      </Typography>
                      <Box sx={{ p: 1.4 }}>
                        <Typography
                          sx={{
                            fontSize: mode === "quantidade" ? 26 : 17,
                            fontWeight: 850,
                          }}
                        >
                          {mode === "quantidade"
                            ? numero(row.quantidade)
                            : moeda(row.valor)}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 11, color: "#6b8295", my: 0.7 }}
                        >
                          {mode === "quantidade"
                            ? moeda(row.valor)
                            : `${numero(row.quantidade)} cadastros`}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={
                            ((mode === "quantidade"
                              ? row.quantidade
                              : row.valor) /
                              max) *
                            100
                          }
                          sx={{
                            height: 5,
                            borderRadius: 9,
                            bgcolor: "#e9f0f4",
                            "& .MuiLinearProgress-bar": { bgcolor: row.cor },
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Typography sx={{ fontSize: 10, color: "#8193a3", mt: 1.4 }}>
                  Etapas atuais do CRM. Valores mensais estimados informados no
                  cadastro; não representam faturamento.
                </Typography>
              </Paper>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "minmax(0, .85fr) minmax(0,1.6fr)",
                  },
                  gap: 2,
                }}
              >
                <Paper elevation={0} sx={{ ...surface, p: 2.2 }}>
                  <PanelTitle icon={<BarChart3 size={21} />}>
                    Distribuição por etapa
                  </PanelTitle>
                  <Typography sx={{ fontSize: 11, color: "#71869a", mb: 2 }}>
                    Participação dos cadastros em cada etapa atual.
                  </Typography>
                  <Stack spacing={1.3}>
                    {bi.etapas.map((row) => (
                      <Stack
                        key={row.value}
                        direction="row"
                        sx={{ gap: 1.5, alignItems: "center" }}
                      >
                        <Box
                          sx={{
                            width: "39%",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Box
                            sx={{
                              height: 29,
                              width: `${Math.max(20, (row.quantidade / Math.max(1, ...bi.etapas.map((item) => item.quantidade))) * 100)}%`,
                              minWidth: 26,
                              bgcolor: row.cor,
                              clipPath: "polygon(0 0,100% 0,90% 100%,10% 100%)",
                              display: "grid",
                              placeItems: "center",
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            {row.quantidade}
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 650 }}>
                            {row.label}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: "#7a8ea0" }}>
                            {numero(row.percentual)}% dos cadastros
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
                <Paper elevation={0} sx={{ ...surface, p: 2.2, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", gap: 1 }}
                  >
                    <PanelTitle icon={<CalendarDays size={21} />}>
                      Prioridades de acompanhamento
                    </PanelTitle>
                    <Button
                      component={Link}
                      href="/leads"
                      size="small"
                      endIcon={<ArrowRight size={13} />}
                      sx={{
                        textTransform: "none",
                        fontSize: 10,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Ver leads
                    </Button>
                  </Stack>
                  <Typography sx={{ fontSize: 11, color: "#71869a", mb: 1 }}>
                    Leads ativos sem próxima ação ou sem contato registrado nos
                    últimos 7 dias.
                  </Typography>
                  <TableContainer>
                    <Table size="small" aria-label="Prioridades comerciais">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f5f9fc" }}>
                          {[
                            "Lead",
                            "Próxima ação",
                            "Responsável",
                            "Sem contato",
                          ].map((label) => (
                            <TableCell
                              key={label}
                              sx={{
                                fontSize: 10,
                                color: "#557791",
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bi.prioridades.slice(0, 7).map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell sx={{ fontSize: 12, minWidth: 130 }}>
                              <Link
                                href={`/leads/${row.id}`}
                                style={{ fontWeight: 750, color: "#245777" }}
                              >
                                {row.nome}
                              </Link>
                            </TableCell>
                            <TableCell sx={{ fontSize: 11, maxWidth: 210 }}>
                              {row.proximaAcao || (
                                <Chip
                                  size="small"
                                  label="Definir próximo passo"
                                  sx={{
                                    fontSize: 10,
                                    bgcolor: "#fff2e6",
                                    color: "#a85d22",
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: 11 }}>
                              {row.responsavel}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={
                                  row.diasSemContato === null
                                    ? "Sem registro"
                                    : `${row.diasSemContato} dias`
                                }
                                sx={{
                                  fontSize: 10,
                                  bgcolor:
                                    row.diasSemContato === null
                                      ? "#f1f5f9"
                                      : row.diasSemContato >= 14
                                        ? "#fff0f0"
                                        : "#fff6e9",
                                  color:
                                    row.diasSemContato === null
                                      ? "#62758a"
                                      : row.diasSemContato >= 14
                                        ? "#d75559"
                                        : "#b9812c",
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {!bi.prioridades.length && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              sx={{
                                fontSize: 12,
                                color: "#71869a",
                                py: 4,
                                textAlign: "center",
                              }}
                            >
                              Nenhuma pendência identificada neste período.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
              <Paper
                elevation={0}
                sx={{
                  ...surface,
                  p: 2,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2,1fr)",
                    lg: "repeat(4,1fr)",
                  },
                  gap: 2,
                }}
              >
                {[
                  {
                    title: "Tempo médio sem contato",
                    value:
                      bi.tempoMedioSemContato === null
                        ? "Sem registro"
                        : `${numero(bi.tempoMedioSemContato)} dias`,
                    icon: <Clock3 size={23} />,
                    tip: "Considera apenas leads ativos com data de interação registrada.",
                  },
                  {
                    title: "Sem interação registrada",
                    value: numero(bi.semInteracao),
                    icon: <Target size={23} />,
                    tip: "Leads ativos sem data de contato; alterações cadastrais não contam como interação.",
                  },
                  {
                    title: "Valor mensal estimado",
                    value: moeda(bi.valorMensal),
                    icon: <TrendingUp size={23} />,
                    tip: "Soma dos valores mensais estimados preenchidos nos leads do período.",
                  },
                  {
                    title: "Leads convertidos",
                    value: `${numero(bi.conversao)}%`,
                    icon: <CheckCheck size={23} />,
                    tip: "Proporção atualmente convertida entre os leads cadastrados no período selecionado.",
                  },
                ].map((item) => (
                  <Tooltip key={item.title} title={item.tip}>
                    <Stack
                      direction="row"
                      sx={{
                        ...{ p: 1, color: "#537a97" },
                        gap: 1.4,
                        alignItems: "center",
                      }}
                    >
                      {item.icon}
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 10,
                            color: "#71869a",
                            fontWeight: 650,
                          }}
                        >
                          {item.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "#204661",
                          }}
                        >
                          {item.value}
                        </Typography>
                      </Box>
                    </Stack>
                  </Tooltip>
                ))}
              </Paper>
            </>
          )}
        </Stack>
      )}
    </AppLayout>
  );
}
