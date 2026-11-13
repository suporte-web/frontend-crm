"use client";

import { PageTopContent } from "@/components/layout/page-top";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Pagination,
  Paper,
  IconButton,
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
import {
  UserSearch,
  Users,
  Building2,
  History,
  ArrowUpRight,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { CrmPageShell } from "@/components/mui/crm-primitives";
import { campoOportunidadeSx, acaoPrincipalOportunidadeSx, acaoSecundariaOportunidadeSx, acaoOportunidadeSx, superficieOportunidadeSx } from "@/components/crm/estilos-oportunidades";
import { formatarNomeCadastro } from "@/lib/nome-cadastro";
import { useAuth } from "@/context/auth-context";
import { getUserRoles } from "@/lib/user-roles";
import { apiFetch } from "@/services/api";

type Tipo = "LEAD" | "PROSPECT" | "CLIENTE";
type Filtros = {
  consultoraId?: string;
  status?: string;
  criadoDe?: string;
  criadoAte?: string;
  tipo?: string;
};
type Registro = {
  id: string;
  tipo: Tipo;
  nome: string;
  status: string | null;
  createdAt: string;
  prospectedByName: string | null;
  href: string | null;
};
type Resultado = {
  registros: Registro[];
  total: number;
  pagina: number;
  tamanho: number;
  indicadores: { leads: number; prospects: number; clientes: number };
};
type Historico = {
  consultora: string;
  observacoes: string | null;
  eventos: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
    createdBy?: { name: string } | null;
  }>;
  evolucao: Array<{ tipo: Tipo; id: string; data: string }>;
};
const rotulos: Record<string, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospect",
  CLIENTE: "Cliente",
  new: "Novo",
  converted: "Convertido em cliente",
  converted_to_prospect: "Convertido em prospect",
  entrada_leads: "Entrada de leads",
  conversao: "Conversão",
  homologacao: "Homologação",
  cotacao: "Cotação",
  venda_efetivada: "Venda efetivada",
  pos_venda: "Pós-venda",
  qualificacao: "Qualificação",
  proposta: "Proposta",
  negociacao: "Negociação",
  ganho: "Ganho",
  perdido: "Perdido",
  ATIVO: "Ativo",
  PENDENTE: "Pendente",
  INATIVO: "Inativo",
  AGUARDANDO_CADASTRO: "Aguardando cadastro",
  EM_VALIDACAO: "Em validação",
  REPROVADO: "Reprovado",
};
const rotulo = (value: string | null) =>
  value ? (rotulos[value] ?? value.replaceAll("_", " ")) : "Não informado";
const data = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
const vazio: Resultado = {
  registros: [],
  total: 0,
  pagina: 1,
  tamanho: 20,
  indicadores: { leads: 0, prospects: 0, clientes: 0 },
};

const selecaoSx = { inputLabel: { shrink: true }, select: { displayEmpty: true } };
const chipSx = { height: 25, borderRadius: '6px', fontSize: 11.5, fontWeight: 500, bgcolor: '#f1f5f9', color: '#475569' };
function CardProspeccao({ titulo, valor, legenda, icone, cor, fundo }: { titulo: string; valor: number | string; legenda: string; icone: ReactNode; cor: string; fundo: string }) {
  return <Paper elevation={0} sx={{ ...superficieOportunidadeSx, p: 2, transition: 'transform 180ms ease, filter 180ms ease', '@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)': { '&:hover': { transform: 'translateY(-4px)', filter: 'drop-shadow(0 8px 12px rgba(15,23,42,.10))' } }, '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }}>
    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography sx={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>{titulo}</Typography>
      <Box sx={{ width: 32, height: 32, borderRadius: '8px', display: 'grid', placeItems: 'center', flexShrink: 0, bgcolor: fundo, color: cor }}>{icone}</Box>
    </Stack>
    <Typography sx={{ mt: 1, fontSize: 28, fontWeight: 700, color: '#1f2937', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}</Typography>
    <Typography sx={{ mt: 1, color: '#64748b', fontSize: 12 }}>{legenda}</Typography>
  </Paper>;
}

export default function GestaoProspeccoesPage() {
  const { token, user } = useAuth();
  const perfis = getUserRoles(user);
  const autorizado =
    !perfis.includes("CONSULTORA") &&
    perfis.some((p) => ["ADMIN", "GESTAO", "COMERCIAL"].includes(p));
  const [rascunho, setRascunho] = useState<Filtros>({});
  const [filtros, setFiltros] = useState<Filtros>({});
  const [pagina, setPagina] = useState(1);
  const [revisao, setRevisao] = useState(0);
  const [resultado, setResultado] = useState<Resultado>(vazio);
  const [opcoes, setOpcoes] = useState<{
    consultoras: Array<{ id: string; nome: string }>;
    status: string[];
  }>({ consultoras: [], status: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroOpcoes, setErroOpcoes] = useState("");
  const [selecionado, setSelecionado] = useState<Registro | null>(null);
  const [historico, setHistorico] = useState<Historico | null>(null);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState("");
  useEffect(() => {
    if (!token || !autorizado) return;
    let ativo = true;
    apiFetch<typeof opcoes>("/gestao-prospeccoes/opcoes", {}, token)
      .then((r) => {
        if (ativo) {
          setOpcoes(r);
          setErroOpcoes("");
        }
      })
      .catch(() => {
        if (ativo)
          setErroOpcoes(
            "Não foi possível carregar as opções de filtros. Tente atualizar.",
          );
      });
    return () => {
      ativo = false;
    };
  }, [token, autorizado, revisao]);
  useEffect(() => {
    if (!token || !autorizado) return;
    let ativo = true;
    setCarregando(true);
    setErro("");
    const params = new URLSearchParams({
      pagina: String(pagina),
      tamanho: "20",
    });
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    apiFetch<Resultado>(`/gestao-prospeccoes?${params}`, {}, token)
      .then((r) => {
        if (ativo) setResultado(r);
      })
      .catch((e) => {
        if (ativo) {
          setResultado(vazio);
          setErro(
            e instanceof Error ? e.message : "Erro ao carregar as prospecções.",
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [token, autorizado, pagina, filtros, revisao]);
  useEffect(() => {
    if (!token || !selecionado) return;
    let ativo = true;
    setHistorico(null);
    setErroHistorico("");
    setCarregandoHistorico(true);
    apiFetch<Historico>(
      `/gestao-prospeccoes/${selecionado.tipo}/${selecionado.id}/historico`,
      {},
      token,
    )
      .then((r) => {
        if (ativo) setHistorico(r);
      })
      .catch((e) => {
        if (ativo)
          setErroHistorico(
            e instanceof Error ? e.message : "Erro ao carregar o histórico.",
          );
      })
      .finally(() => {
        if (ativo) setCarregandoHistorico(false);
      });
    return () => {
      ativo = false;
    };
  }, [token, selecionado]);
  const mudar = (campo: keyof Filtros, v: string) =>
    setRascunho((old) => ({ ...old, [campo]: v }));
  function aplicar(event: FormEvent) {
    event.preventDefault();
    setPagina(1);
    setFiltros({ ...rascunho });
  }
  return (
    <AppLayout>
      <CrmPageShell sx={{ gap: 2.2, minWidth: 0, color: '#1f2937' }}>
        <PageTopContent title={"Gestão de prospecções"} description={"Acompanhe as consultoras e a evolução dos cadastros."} aside={<Paper elevation={0} sx={{ ...superficieOportunidadeSx, border: 'none !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>

            <Button variant="contained" disabled={carregando || !autorizado} startIcon={<RefreshCw size={16} />} onClick={() => setRevisao(r => r + 1)} sx={{ ...acaoPrincipalOportunidadeSx, alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}>Atualizar</Button>
          </Stack>
        </Paper>} />
        {!autorizado ? <Alert severity="warning">Esta tela está disponível para Admin, Gestão e Comercial.</Alert> : <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(3,minmax(0,1fr))' }, gap: 1.5 }}>
            <CardProspeccao titulo="Total de prospecções" valor={carregando ? '—' : resultado.total} legenda="Cadastros na etapa atual" icone={<UserSearch size={18} />} cor="#ff5805" fundo="#fff0e8" />
            <CardProspeccao titulo="Leads" valor={carregando ? '—' : resultado.indicadores.leads} legenda="Leads prospectados" icone={<Users size={18} />} cor="#2563eb" fundo="#eff6ff" />
            <CardProspeccao titulo="Clientes" valor={carregando ? '—' : resultado.indicadores.clientes} legenda="Clientes da prospecção" icone={<Building2 size={18} />} cor="#15803d" fundo="#ecfdf3" />
          </Box>
          <Paper elevation={0} sx={superficieOportunidadeSx}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2.5 }}><Filter size={17} color="#ff5805" /><Typography component="h2" sx={{ fontSize: 15, fontWeight: 600 }}>Filtros</Typography></Stack>
            {erroOpcoes && <Alert severity="warning" sx={{ mb: 2 }}>{erroOpcoes}</Alert>}
            <Box component="form" onSubmit={aplicar} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'repeat(2,minmax(0,1fr))', lg: 'repeat(3,minmax(0,1fr))' }, gap: 2, alignItems: 'center' }}>
              <TextField select fullWidth size="small" label="Consultora" value={rascunho.consultoraId || ''} onChange={e => mudar('consultoraId', e.target.value)} slotProps={selecaoSx} sx={campoOportunidadeSx}>
                <MenuItem value="">Todas as consultoras</MenuItem>{opcoes.consultoras.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
              </TextField>
              <TextField select fullWidth size="small" label="Tipo de cadastro" value={rascunho.tipo || ''} onChange={e => setRascunho(old => ({ ...old, tipo: e.target.value, status: '' }))} slotProps={selecaoSx} sx={campoOportunidadeSx}>
                <MenuItem value="">Todos os tipos</MenuItem>{(['LEAD','CLIENTE'] as const).map(t => <MenuItem key={t} value={t}>{rotulo(t)}</MenuItem>)}
              </TextField>
              <TextField select fullWidth size="small" label="Status" value={rascunho.status || ''} onChange={e => mudar('status', e.target.value)} slotProps={selecaoSx} sx={campoOportunidadeSx}>
                <MenuItem value="">Todos os status</MenuItem>{opcoes.status.filter(status => status !== 'PROSPECT').map(status => <MenuItem key={status} value={status}>{rotulo(status)}</MenuItem>)}
              </TextField>
              <TextField fullWidth size="small" type="date" label="De" value={rascunho.criadoDe || ''} onChange={e => mudar('criadoDe', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={campoOportunidadeSx} />
              <TextField fullWidth size="small" type="date" label="Até" value={rascunho.criadoAte || ''} onChange={e => mudar('criadoAte', e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: rascunho.criadoDe } }} sx={campoOportunidadeSx} />
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', rowGap: 1, gridColumn: { xs: '1 / -1', lg: 'auto' } }}>
                <Button type="submit" variant="contained" sx={acaoPrincipalOportunidadeSx}>Aplicar filtros</Button>
                <Button onClick={() => { setRascunho({}); setFiltros({}); setPagina(1); }} sx={{ ...acaoOportunidadeSx, color: '#64748b' }}>Limpar</Button>
              </Stack>
            </Box>
          </Paper>
          {erro && <Alert severity="error">{erro}</Alert>}
          <Paper elevation={0} sx={{ ...superficieOportunidadeSx, p: 0, overflow: 'hidden' }}>
            <Stack direction="row" sx={{ p: { xs: 2, md: 2.5 }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box sx={{ minWidth: 0 }}><Typography component="h2" sx={{ fontSize: 17, fontWeight: 600 }}>Prospecções das consultoras</Typography><Typography sx={{ mt: 0.5, fontSize: 12, color: '#64748b' }}>Etapas, responsáveis e histórico dos cadastros.</Typography></Box>
              <Chip label={resultado.total.toLocaleString('pt-BR') + (resultado.total === 1 ? ' cadastro' : ' cadastros')} size="small" sx={{ ...chipSx, flexShrink: 0 }} />
            </Stack>
            {carregando ? <Stack sx={{ p: 5, minHeight: 220, alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={28} sx={{ color: '#ff5805' }} aria-label="Carregando prospecções" /></Stack> : (
              <Box sx={{ minWidth: 0, containerType: 'inline-size' }}>
                <TableContainer sx={{ overflowX: 'visible' }}>
                  <Table aria-label="Prospecções das consultoras" sx={{ width: '100%', tableLayout: 'fixed', '& th': { bgcolor: '#f8fafc', fontSize: 12, color: '#64748b', fontWeight: 600, borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #e2e8f0', px: 2, py: 1.5 }, '& td': { fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9', px: 2, py: 1.75, overflowWrap: 'anywhere', verticalAlign: 'middle' }, '& tbody tr:last-child td': { borderBottom: 0 }, '@container (max-width: 1000px)': { display: 'block', '& thead': { display: 'none' }, '& tbody': { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 1.5, p: 2 }, '& tbody tr': { display: 'block', minWidth: 0, border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }, '& tbody td': { display: 'block', minWidth: 0, borderBottom: '1px solid #f1f5f9 !important', py: 1.25 }, '& tbody td:last-child': { borderBottom: '0 !important' }, '& td::before': { content: 'attr(data-label)', display: 'block', mb: 0.5, color: '#64748b', fontSize: 11, fontWeight: 400 }, '& td[colspan]': { textAlign: 'center' } }, '@container (max-width: 550px)': { '& tbody': { gridTemplateColumns: 'minmax(0,1fr)' } } }}>
                    <TableHead><TableRow>{['Cadastro','Tipo','Consultora','Status','Cadastrado em','Ações'].map((label, index) => <TableCell key={label} sx={{ width: [22,9,17,14,15,23][index] + '%' }}>{label}</TableCell>)}</TableRow></TableHead>
                    <TableBody>
                      {resultado.registros.map(r => <TableRow key={r.tipo + '-' + r.id} hover>
                        <TableCell data-label="Cadastro"><Typography sx={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>{formatarNomeCadastro(r.nome)}</Typography></TableCell>
                        <TableCell data-label="Tipo"><Chip size="small" label={rotulo(r.tipo)} sx={{ ...chipSx, bgcolor: r.tipo === 'CLIENTE' ? '#ecfdf3' : r.tipo === 'PROSPECT' ? '#fff7df' : '#eff6ff', color: r.tipo === 'CLIENTE' ? '#15803d' : r.tipo === 'PROSPECT' ? '#b45309' : '#2563eb' }} /></TableCell>
                        <TableCell data-label="Consultora">{r.prospectedByName || 'Não informada'}</TableCell>
                        <TableCell data-label="Status"><Typography sx={{ fontSize: 12, overflowWrap: 'anywhere' }}>{rotulo(r.status)}</Typography></TableCell>
                        <TableCell data-label="Cadastrado em"><Typography sx={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{data(r.createdAt)}</Typography></TableCell>
                        <TableCell data-label="Ações"><Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}><Button startIcon={<History size={14} />} onClick={() => setSelecionado(r)} sx={{ ...acaoOportunidadeSx, minHeight: 32, px: 1, fontSize: 12, color: '#475569' }}>Histórico</Button>{r.href && <Button component={Link} href={r.href} endIcon={<ArrowUpRight size={14} />} sx={{ ...acaoOportunidadeSx, minHeight: 32, px: 1, fontSize: 12, color: '#c2410c' }}>Detalhes</Button>}</Stack></TableCell>
                      </TableRow>)}
                      {!resultado.registros.length && !erro && <TableRow><TableCell colSpan={6} align="center" sx={{ py: '40px !important', color: '#64748b !important' }}>Nenhuma prospecção encontrada com os filtros selecionados.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2, justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
              <Typography sx={{ fontSize: 12, color: '#64748b' }}>{resultado.total ? 'Página ' + pagina + ' · ' + resultado.total.toLocaleString('pt-BR') + ' cadastros' : 'Nenhum cadastro'}</Typography>
              <Pagination page={pagina} count={Math.max(1, Math.ceil(resultado.total / 20))} onChange={(_, value) => setPagina(value)} disabled={carregando} size="small" shape="rounded" siblingCount={0} sx={{ '& .MuiPaginationItem-root': { borderRadius: '6px', fontSize: 12 }, '& .Mui-selected': { bgcolor: '#ff5805 !important', color: '#fff' } }} />
            </Stack>
          </Paper>
        </>}
        <Dialog open={Boolean(selecionado)} onClose={() => setSelecionado(null)} fullWidth maxWidth="md" aria-labelledby="historico-prospeccao-titulo" slotProps={{ paper: { sx: { borderRadius: '12px', bgcolor: '#fff' } } }}>
          <DialogTitle component="div" sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}><Box sx={{ minWidth: 0 }}><Typography id="historico-prospeccao-titulo" component="h2" sx={{ fontSize: 18, fontWeight: 600 }}>Histórico da prospecção</Typography>{selecionado && <Typography sx={{ mt: 0.5, fontSize: 13, color: '#64748b', overflowWrap: 'anywhere' }}>{formatarNomeCadastro(selecionado.nome)}</Typography>}</Box><IconButton size="small" aria-label="Fechar histórico" onClick={() => setSelecionado(null)}><X size={20} /></IconButton></Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ p: { xs: 2, md: 2.5 }, borderColor: '#f1f5f9' }}>
            {carregandoHistorico ? <CircularProgress size={24} sx={{ color: '#ff5805' }} aria-label="Carregando histórico" /> : erroHistorico ? <Alert severity="error">{erroHistorico}</Alert> : historico && <Stack spacing={2.5}>
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: '8px' }}><Typography sx={{ fontSize: 11.5, color: '#64748b' }}>Consultora prospectora</Typography><Typography sx={{ mt: 0.5, fontSize: 13, fontWeight: 600 }}>{historico.consultora}</Typography></Box>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>{historico.evolucao.map(e => <Chip key={e.tipo + '-' + e.id} variant="outlined" label={rotulo(e.tipo) + ' · ' + data(e.data)} sx={{ ...chipSx, borderColor: '#e2e8f0', maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }} />)}</Stack>
              {historico.observacoes && <Box><Typography sx={{ mb: 0.75, fontSize: 13, fontWeight: 600 }}>Observações do cadastro</Typography><Typography sx={{ fontSize: 13, color: '#64748b', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{historico.observacoes}</Typography></Box>}
              <Box><Typography sx={{ mb: 1.5, fontSize: 14, fontWeight: 600 }}>Histórico de interações</Typography><Stack spacing={2}>{historico.eventos.length ? historico.eventos.map(e => <Box key={e.id} sx={{ borderLeft: '2px solid #ff5805', pl: 2, py: 0.5 }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{e.title}</Typography><Typography sx={{ mt: 0.5, fontSize: 11.5, color: '#94a3b8' }}>{data(e.createdAt)}{e.createdBy?.name ? ' · ' + e.createdBy.name : ''}</Typography><Typography sx={{ mt: 0.75, fontSize: 13, color: '#64748b', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{e.description}</Typography></Box>) : <Typography sx={{ fontSize: 13, color: '#64748b' }}>Nenhuma interação registrada.</Typography>}</Stack></Box>
            </Stack>}
          </DialogContent>
          <DialogActions sx={{ px: 2.5, py: 1.5 }}><Button variant="outlined" onClick={() => setSelecionado(null)} sx={acaoSecundariaOportunidadeSx}>Fechar</Button></DialogActions>
        </Dialog>
      </CrmPageShell>
    </AppLayout>
  );
}
