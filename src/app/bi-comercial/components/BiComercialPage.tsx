"use client";
import { efeitoCardBiSx } from './estilos-bi';
import { IndicadoresSegmentosOportunidades } from './IndicadoresSegmentosOportunidades';
import { AnalisePerdasOportunidades } from './AnalisePerdasOportunidades';

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
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
  LayoutDashboard,
  Activity,
  CircleX,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import { hasAnyRole } from "@/lib/user-roles";
import { moeda, montarBiCadastros, montarBiOportunidades, numero, filtrarBiPorResponsavel, listarResponsaveisBi, type ResponsavelBi, type CadastroBi, type OportunidadeBi } from "@/lib/bi-comercial";
import { carregarCadastrosBi, carregarOportunidadesBi } from "@/services/bi-comercial.service";

const abasBi = [
  { valor: 'visao-geral', titulo: 'Visão geral', icone: LayoutDashboard },
  { valor: 'funil', titulo: 'Funil e cadastros', icone: Filter },
  { valor: 'oportunidades', titulo: 'Oportunidades', icone: Target },
  { valor: 'perdas', titulo: 'Motivos de perda', icone: CircleX },
  { valor: 'acompanhamento', titulo: 'Acompanhamento', icone: Activity },
] as const;
type AbaBi = typeof abasBi[number]['valor'];

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
    <Paper elevation={0} sx={{ ...surface, ...efeitoCardBiSx, p: 2.2, minWidth: 0 }}>
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
  const [cadastros, setCadastros] = useState<CadastroBi[]>([]);
  const [oportunidades, setOportunidades] = useState<OportunidadeBi[] | null>(null);
  const [erroOportunidades, setErroOportunidades] = useState('');
  const [avisos, setAvisos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [mode, setMode] = useState<"quantidade" | "valor">("quantidade");
  const [aba, setAba] = useState<AbaBi>('visao-geral');
  const [responsavel, setResponsavel] = useState<ResponsavelBi | null>(null);
  useEffect(() => {
    if (authLoading || !allowed || !token || !user) return;
    let active = true;
    setLoading(true);
    setError('');
    setErroOportunidades('');
    setCadastros([]);
    setOportunidades(null);
    setAvisos([]);
    Promise.allSettled([carregarCadastrosBi(token, user), carregarOportunidadesBi(token, user)])
      .then(([cadastrosResult, oportunidadesResult]) => {
        if (!active) return;
        if (cadastrosResult.status === 'fulfilled') {
          setCadastros(cadastrosResult.value.cadastros);
          setAvisos(cadastrosResult.value.avisos);
        } else setError(cadastrosResult.reason instanceof Error ? cadastrosResult.reason.message : 'Não foi possível carregar os cadastros.');
        if (oportunidadesResult.status === 'fulfilled') setOportunidades(oportunidadesResult.value);
        else setErroOportunidades(oportunidadesResult.reason instanceof Error ? oportunidadesResult.reason.message : 'Não foi possível carregar as oportunidades.');
        if (cadastrosResult.status === 'fulfilled' || oportunidadesResult.status === 'fulfilled') setUpdated(new Date());
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [allowed, authLoading, token, refresh, user]);
  const responsaveis = useMemo(() => listarResponsaveisBi(cadastros), [cadastros]);
  const opcoesResponsavel = responsavel && !responsaveis.some(item => item.valor === responsavel.valor) ? [responsavel, ...responsaveis] : responsaveis;
  const dadosFiltrados = useMemo(() => filtrarBiPorResponsavel(cadastros, oportunidades, responsavel?.valor || ''), [cadastros, oportunidades, responsavel]);
  const resultadoOportunidades = useMemo(() => {
    try { return { data: dadosFiltrados.oportunidades === null ? null : montarBiOportunidades(dadosFiltrados.oportunidades, { de, ate }), error: '' }; }
    catch (e) { return { data: null, error: e instanceof Error ? e.message : 'Período inválido.' }; }
  }, [dadosFiltrados.oportunidades, de, ate]);
  const result = useMemo(() => {
    try {
      return { data: montarBiCadastros(dadosFiltrados.cadastros, { de, ate }), error: "" };
    } catch (e) {
      return {
        data: null,
        error: e instanceof Error ? e.message : "Período inválido.",
      };
    }
  }, [dadosFiltrados.cadastros, de, ate, updated]);
  const bi = error || loading ? null : result.data;
  const max = bi
    ? Math.max(
      1,
      ...bi.etapas.map((row) =>
        mode === "quantidade" ? row.quantidade : row.valor,
      ),
    )
    : 1;
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
          <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', p: { xs: 2, md: 2.5 }, bgcolor: '#fff', minWidth: 0 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Typography component="h2" sx={{ fontSize: { xs: 22, md: 24 }, fontWeight: 700, lineHeight: 1.3, color: '#1f2937' }}>BI Comercial</Typography>
              {updated && <Typography sx={{ color: '#94a3b8', fontSize: 11 }}>Atualizado às {updated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Typography>}
            </Stack>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'minmax(0, 1.3fr) repeat(2, minmax(0, 1fr)) auto' }, gap: 1.5, alignItems: 'center' }}>
              <TextField id="responsavel-bi" select label="Responsável" size="small" value={responsavel?.valor || ''} disabled={loading} onChange={event => setResponsavel(responsaveis.find(item => item.valor === event.target.value) || null)} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true, MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } } } }} sx={{ ...campoPeriodoSx, '& .MuiSelect-select': { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
                <MenuItem value="">Todos os responsáveis</MenuItem>
                {opcoesResponsavel.map(item => <MenuItem key={item.valor} value={item.valor}>{item.rotulo}</MenuItem>)}
              </TextField>
              <TextField id="periodo-bi-de" label="De" type="date" size="small" value={de} onChange={event => setDe(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={campoPeriodoSx} />
              <TextField id="periodo-bi-ate" label="Até" type="date" size="small" value={ate} onChange={event => setAte(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={campoPeriodoSx} />
              <Stack direction="row" spacing={1} sx={{ gridColumn: { xs: 'auto', sm: '1 / -1', lg: 'auto' }, justifyContent: 'flex-end' }}>
                <Button startIcon={<RefreshCw size={16} />} variant="contained" disabled={loading} onClick={() => setRefresh(valor => valor + 1)} sx={{ minHeight: 40, borderRadius: '8px', px: 2, textTransform: 'none', fontSize: 13, fontWeight: 600, bgcolor: '#ff5805', boxShadow: 'none', '&:hover': { bgcolor: '#e94f00', boxShadow: 'none' } }}>Atualizar</Button>
                <Button onClick={() => { setDe(''); setAte(''); setResponsavel(null); }} disabled={!de && !ate && !responsavel} sx={{ minHeight: 40, borderRadius: '8px', px: 1.5, textTransform: 'none', fontSize: 13, color: '#64748b', '&:hover': { bgcolor: '#f8fafc' } }}>Limpar</Button>
              </Stack>
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ ...surface, p: 0.6, minWidth: 0 }}>
            <Tabs value={aba} onChange={(_, valor: AbaBi) => setAba(valor)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="Seções do BI Comercial"
              sx={{ minHeight: 42, '& .MuiTabs-indicator': { display: 'none' }, '& .MuiTabs-list': { gap: 0.5 }, '& .MuiTab-root': { minHeight: 42, borderRadius: '8px', textTransform: 'none', fontSize: 12, fontWeight: 600, px: { xs: 1.5, md: 2.5 }, color: '#64748b' }, '& .MuiTab-root:hover': { bgcolor: '#fff4eb', color: '#e94f00' }, '& .MuiTab-root.Mui-selected': { bgcolor: '#ff5805', color: '#fff' }, '& .MuiTab-root.Mui-focusVisible': { outline: '2px solid #ff5805', outlineOffset: '-2px' } }}>
              {abasBi.map(item => <Tab key={item.valor} id={`aba-bi-${item.valor}`} aria-controls={`painel-bi-${item.valor}`} value={item.valor} label={item.titulo} icon={<item.icone size={17} />} iconPosition="start" />)}
            </Tabs>
          </Paper>
          <Stack role="tabpanel" id={`painel-bi-${aba}`} aria-labelledby={`aba-bi-${aba}`} spacing={2.2} sx={{ minWidth: 0 }}>
          {(error || result.error) && (
            <Alert severity="error">{error || result.error}</Alert>
          )}
          {loading && (
            <LinearProgress
              aria-label="Atualizando BI Comercial"
              sx={{ borderRadius: 2 }}
            />
          )}
          {avisos.map(aviso => <Alert key={aviso} severity="warning">{aviso}</Alert>)}
          {bi && <>
            {(aba === 'visao-geral' || aba === 'funil') && <Box
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
                  title="Cadastros"
                  value={numero(bi.total)}
                  detail={`${numero(bi.leads)} leads e ${numero(bi.clientes)} clientes`}
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
                  title="Clientes"
                  value={numero(bi.clientes)}
                  detail="Modalidade Cliente na base atual"
                  color="#39a82e"
                  icon={<CheckCheck size={23} />}
                />
                <Card
                  title="Sem próximo passo"
                  value={bi.acompanhamentosIndisponiveis > 0 && bi.acompanhamentosDisponiveis === 0 ? "Indisponível" : numero(bi.semProximaAcao)}
                  detail="Cadastros em acompanhamento sem próxima ação"
                  color="#ef5b6b"
                  icon={<ListTodo size={23} />}
                />
              </Box>}
          </>}
          {(aba === 'visao-geral' || aba === 'oportunidades') && <IndicadoresSegmentosOportunidades
            exibicao={aba === 'oportunidades' ? 'oportunidades' : 'ambos'}
            cadastros={bi}
            oportunidades={resultadoOportunidades.data}
            carregando={loading}
            erroCadastros={error || result.error}
            erroOportunidades={erroOportunidades || resultadoOportunidades.error}
          />}
          {aba === 'perdas' && token && <AnalisePerdasOportunidades token={token} de={de} ate={ate} refresh={refresh} records={dadosFiltrados.oportunidades} carregando={loading} erroOportunidades={erroOportunidades} />}
          {bi && (
            <>
              {!loading && (aba === 'visao-geral' || aba === 'funil') && bi.total === 0 && !error && (
                <Alert severity="info">
                  Nenhum cadastro no período selecionado.
                </Alert>
              )}
              {aba === 'funil' && <Paper elevation={0} sx={{ ...surface, ...efeitoCardBiSx, p: 2.2 }}>
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
                            : row.valoresInformados ? moeda(row.valor) : row.valoresIndisponiveis ? "Indisponível" : "Não informado"}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 11, color: "#6b8295", my: 0.7 }}
                        >
                          {mode === "quantidade"
                            ? (row.valoresInformados ? moeda(row.valor) : row.valoresIndisponiveis ? "Valor indisponível" : "Valor não informado")
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
              </Paper>}
              {(aba === 'funil' || aba === 'acompanhamento') && <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "1fr",
                  },
                  gap: 2,
                }}
              >
                {aba === 'funil' && <Paper elevation={0} sx={{ ...surface, ...efeitoCardBiSx, p: 2.2 }}>
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
                </Paper>}
                {aba === 'acompanhamento' && <Paper elevation={0} sx={{ ...surface, p: 2.2, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}
                  >
                    <PanelTitle icon={<CalendarDays size={21} />}>
                      Prioridades de acompanhamento
                    </PanelTitle>
                    <Button
                      component={Link}
                      href="/cadastros"
                      size="small"
                      endIcon={<ArrowRight size={13} />}
                      sx={{
                        textTransform: "none",
                        fontSize: 10,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Ver cadastros
                    </Button>
                  </Stack>
                  <Typography sx={{ fontSize: 11, color: "#71869a", mb: 1 }}>
                    Cadastros em acompanhamento sem próxima ação ou sem contato registrado nos
                    últimos 7 dias.
                  </Typography>
                  <TableContainer>
                    <Table size="small" aria-label="Prioridades comerciais">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f5f9fc" }}>
                          {[
                            "Cadastro",
                            "Próxima ação",
                            "Responsável",
                            "Situação do contato",
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
                                href={row.href ?? `/cadastros/${row.id}`}
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
                            <TableCell sx={{ fontSize: 11 }}>{row.situacaoContato || "Não informada"}</TableCell>
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
                              colSpan={5}
                              sx={{
                                fontSize: 12,
                                color: "#71869a",
                                py: 4,
                                textAlign: "center",
                              }}
                            >
                              {bi.acompanhamentosIndisponiveis > 0 ? "Acompanhamento parcial: alguns cadastros não puderam ser avaliados." : "Nenhuma pendência identificada neste período."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>}
              </Box>}
              {aba === 'acompanhamento' && <Paper
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
                        ? (bi.acompanhamentosIndisponiveis > 0 && bi.acompanhamentosDisponiveis === 0 ? "Indisponível" : "Sem registro")
                        : `${numero(bi.tempoMedioSemContato)} dias`,
                    icon: <Clock3 size={23} />,
                    tip: "Considera cadastros em acompanhamento com data de interação registrada.",
                  },
                  {
                    title: "Sem interação registrada",
                    value: bi.acompanhamentosIndisponiveis > 0 && bi.acompanhamentosDisponiveis === 0 ? "Indisponível" : numero(bi.semInteracao),
                    icon: <Target size={23} />,
                    tip: "Cadastros em acompanhamento sem data de contato; alterações cadastrais não contam como interação.",
                  },
                  {
                    title: "Valor mensal estimado",
                    value: bi.cadastrosComValorMensal ? moeda(bi.valorMensal) : bi.acompanhamentosIndisponiveis > 0 ? "Indisponível" : "Não informado",
                    icon: <TrendingUp size={23} />,
                    tip: `Soma dos valores preenchidos em ${bi.cadastrosComValorMensal} de ${bi.total} cadastros do período. Valores ausentes não foram estimados.`,
                  },
                  {
                    title: "Participação de clientes",
                    value: `${numero(bi.percentualClientes)}%`,
                    icon: <CheckCheck size={23} />,
                    tip: "Proporção de cadastros na modalidade Cliente; não representa uma taxa histórica de conversão.",
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
              </Paper>}
            </>
          )}
          </Stack>
        </Stack>
      )}
    </AppLayout>
  );
}
