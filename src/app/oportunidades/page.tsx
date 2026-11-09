'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { normalizarNomesCadastro } from '@/lib/nome-cadastro';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Handshake, PlusCircle, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CrmPageShell, CrmSection } from '@/components/mui/crm-primitives';
import { acaoPrincipalOportunidadeSx, acaoSecundariaOportunidadeSx, campoOportunidadeSx, formularioOportunidadeSx, superficieOportunidadeSx } from '@/components/crm/estilos-oportunidades';
import { formatarValorOportunidade, origemValorOportunidade } from '@/lib/valor-oportunidade';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/services/api';
import type { Cadastro } from '@/services/cadastros.service';
import { formatarEtapaOportunidade } from '@/services/crm.service';
import type { OpportunityStage, OpportunityStatus } from '@/types/crm';

type Oportunidade = { id: string; clientId: string; title: string; value: string | number | null; valorPropostaComercial?: string | number | null; stage: OpportunityStage; status: OpportunityStatus; client: Cadastro };
const etapas: OpportunityStage[] = ['NOVO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO'];
const situacoes = { OPEN: 'Aberta', WON: 'Ganha', LOST: 'Perdida' };
const filtrarCadastros = createFilterOptions<Cadastro>({
  limit: 50,
  stringify: cadastro => [cadastro.tradeName, cadastro.companyName, cadastro.legalName, cadastro.document].filter(Boolean).join(' '),
});
const selecaoVazia = { inputLabel: { shrink: true }, select: { displayEmpty: true } };
const marcadorSx = { height: 25, borderRadius: '6px', fontSize: 11.5, fontWeight: 500, bgcolor: '#f1f5f9', color: '#475569' };

export default function OportunidadesPage() {
  return <Suspense fallback={<Box role="status" aria-label="Carregando oportunidades" sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={28} /></Box>}><ConteudoOportunidades /></Suspense>;
}

function ConteudoOportunidades() {
  const parametros = useSearchParams();
  const situacaoInformada = parametros.get('situacao') ?? '';
  const situacaoUrl = ['OPEN', 'WON', 'LOST'].includes(situacaoInformada) ? situacaoInformada : '';
  const { token, user } = useAuth();
  const [lista, setLista] = useState<Oportunidade[]>([]);
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [cadastroFiltro, setCadastroFiltro] = useState('');
  const [etapa, setEtapa] = useState('');
  const [situacao, setSituacao] = useState(situacaoUrl);
  useEffect(() => { setSituacao(situacaoUrl); }, [situacaoUrl]);
  const [novo, setNovo] = useState(false);
  const [selecionado, setSelecionado] = useState('');
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    Promise.all([apiFetch<Oportunidade[]>('/opportunities', {}, token), apiFetch<Cadastro[]>('/opportunities/clients', {}, token)])
      .then(([oportunidades, registros]) => { if (ativo) { setLista(oportunidades.map(item => ({ ...item, client: normalizarNomesCadastro(item.client) }))); setCadastros(registros.map(registro => normalizarNomesCadastro(registro))); } })
      .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : 'Erro ao carregar oportunidades.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [token, user]);
  const visiveis = useMemo(() => lista.filter(item => {
    const nome = item.client.tradeName || item.client.legalName || item.client.companyName || '';
    return (!modalidade || item.client.modalidadeCadastro === modalidade) && (!cadastroFiltro || item.clientId === cadastroFiltro) && (!etapa || item.stage === etapa) && (!situacao || item.status === situacao) && (!busca || `${item.title} ${nome}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')));
  }), [lista, modalidade, cadastroFiltro, etapa, situacao, busca]);
  return <AppLayout><CrmPageShell sx={{ minWidth: 0, gap: 2, containerType: 'inline-size', containerName: 'oportunidades' }}>
    <CrmSection sx={superficieOportunidadeSx}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, '@container oportunidades (max-width: 800px)': { flexDirection: 'column', alignItems: 'stretch' } }}>
        <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, alignItems: 'flex-start' }}>
          <Box sx={{ width: 42, height: 42, flexShrink: 0, display: 'grid', placeItems: 'center', border: '1px solid #e2e8f0', borderRadius: '10px', bgcolor: '#f8fafc', color: '#64748b' }}><Handshake size={22} /></Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 11, color: '#64748b', letterSpacing: '.06em', mb: .25 }}>CRM</Typography>
            <Typography component="h1" sx={{ fontSize: { xs: 22, md: 25 }, fontWeight: 600, color: '#1f2937', lineHeight: 1.3, overflowWrap: 'anywhere' }}>Oportunidades/Propostas</Typography>
            <Typography sx={{ fontSize: 13, color: '#64748b', mt: .75, lineHeight: 1.6 }}>Acompanhe as oportunidades e propostas vinculadas aos seus Clientes e Leads.</Typography>
          </Box>
        </Stack>
        <Button variant="contained" size="small" startIcon={<PlusCircle size={16} />} onClick={() => setNovo(true)} sx={{ ...acaoPrincipalOportunidadeSx, flexShrink: 0 }}>Nova oportunidade</Button>
      </Box>
    </CrmSection>
    {erro && <Alert severity="error">{erro}</Alert>}
    <Paper variant="outlined" sx={superficieOportunidadeSx}>
      <Box sx={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) repeat(4, minmax(0, 1fr))', gap: 1.5, alignItems: 'start',
        '@container oportunidades (max-width: 1100px)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', '& > :first-child': { gridColumn: '1 / -1' } },
        '@container oportunidades (max-width: 760px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
        '@container oportunidades (max-width: 420px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
      }}>
        <TextField label="Buscar oportunidade ou empresa" value={busca} onChange={e => setBusca(e.target.value)} size="small" fullWidth sx={campoOportunidadeSx}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} color="#64748b" /></InputAdornment> } }} />
        <TextField select label="Modalidade" value={modalidade} onChange={e => setModalidade(e.target.value)} size="small" fullWidth sx={campoOportunidadeSx} slotProps={selecaoVazia}><MenuItem value="">Todas</MenuItem><MenuItem value="CLIENTE">Cliente</MenuItem><MenuItem value="LEAD">Lead</MenuItem></TextField>
        <TextField select label="Cadastro" value={cadastroFiltro} onChange={e => setCadastroFiltro(e.target.value)} size="small" fullWidth sx={campoOportunidadeSx} slotProps={selecaoVazia}><MenuItem value="">Todos</MenuItem>{cadastros.map(item => <MenuItem key={item.id} value={item.id}>{item.tradeName || item.companyName || item.legalName || 'Sem nome'}</MenuItem>)}</TextField>
        <TextField select label="Etapa" value={etapa} onChange={e => setEtapa(e.target.value)} size="small" fullWidth sx={campoOportunidadeSx} slotProps={selecaoVazia}><MenuItem value="">Todas</MenuItem>{etapas.map(item => <MenuItem key={item} value={item}>{formatarEtapaOportunidade(item)}</MenuItem>)}</TextField>
        <TextField select label="Situação" value={situacao} onChange={e => setSituacao(e.target.value)} size="small" fullWidth sx={campoOportunidadeSx} slotProps={selecaoVazia}><MenuItem value="">Todas</MenuItem>{Object.entries(situacoes).map(([valor, rotulo]) => <MenuItem key={valor} value={valor}>{rotulo}</MenuItem>)}</TextField>
      </Box>
    </Paper>
    {carregando ? <Box role="status" aria-label="Carregando oportunidades" sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: '#ff5805' }} /></Box> : <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 13, color: '#64748b' }}>{visiveis.length} oportunidade(s) encontrada(s)</Typography>
      {!visiveis.length && <Alert severity="info">Nenhuma oportunidade encontrada para os filtros selecionados.</Alert>}
      {visiveis.map(item => <Paper key={item.id} variant="outlined" sx={{ ...superficieOportunidadeSx, p: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 2, alignItems: 'center', '@container oportunidades (max-width: 1050px)': { gridTemplateColumns: 'minmax(0,1fr) auto', '& > :first-child': { gridColumn: '1 / -1' } }, '@container oportunidades (max-width: 480px)': { gridTemplateColumns: 'minmax(0,1fr)', '& > :last-child': { width: '100%' } } }}>
          <Stack spacing={.75} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#1f2937', overflowWrap: 'anywhere' }}>{item.title}</Typography>
            <Typography component={Link} href={`/cadastros/${item.clientId}`} sx={{ fontSize: 13, color: '#64748b', textDecoration: 'none', overflowWrap: 'anywhere', '&:hover': { textDecoration: 'underline' } }}>{item.client.tradeName || item.client.companyName || item.client.legalName || 'Cadastro'}</Typography>
          </Stack>
          <Stack direction="row" useFlexGap spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
            <Chip label={item.client.modalidadeCadastro === 'LEAD' ? 'Lead' : 'Cliente'} size="small" sx={marcadorSx} />
            <Box sx={{ minWidth: 115, pl: .5 }}>
              <Typography sx={{ fontSize: 11, color: '#64748b', mb: .25 }}>{origemValorOportunidade(item)}</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: 13.5, color: '#334155' }}>{formatarValorOportunidade(item)}</Typography>
            </Box>
          </Stack>
          <Button component={Link} href={`/oportunidades/cadastro/${item.clientId}`} variant="outlined" sx={acaoSecundariaOportunidadeSx}>Abrir propostas</Button>
        </Box>
      </Paper>)}
    </Stack>}
    <Dialog open={novo} onClose={() => setNovo(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: '12px', m: { xs: 1.5, sm: 4 }, width: { xs: 'calc(100% - 24px)', sm: '100%' } } } }}>
      <DialogTitle sx={{ px: 2.5, py: 2, fontSize: 17, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Nova oportunidade/proposta</DialogTitle>
      <DialogContent sx={{ ...formularioOportunidadeSx, px: 2.5, pb: 2.5, pt: '24px !important' }}>
        <Autocomplete fullWidth size="small" options={cadastros} value={cadastros.find(item => item.id === selecionado) ?? null}
          onChange={(_, cadastro) => setSelecionado(cadastro?.id ?? '')}
          getOptionKey={cadastro => cadastro.id}
          getOptionLabel={cadastro => `${cadastro.tradeName || cadastro.companyName || cadastro.legalName || 'Sem nome'} · ${cadastro.modalidadeCadastro === 'CLIENTE' ? 'Cliente' : 'Lead'}`}
          isOptionEqualToValue={(opcao, valor) => opcao.id === valor.id} filterOptions={filtrarCadastros}
          loading={carregando} loadingText="Carregando cadastros..." noOptionsText="Nenhum cliente ou lead encontrado."
          clearText="Limpar seleção" openText="Abrir opções" closeText="Fechar opções"
          slotProps={{ listbox: { sx: { maxHeight: 240, fontSize: 13.5 } } }}
          renderInput={parametros => <TextField {...parametros} size="small" label="Cliente ou Lead" placeholder="Digite o nome ou documento para buscar" helperText="Pesquise e selecione um cliente ou lead para continuar." sx={campoOportunidadeSx} />} />
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 2, gap: 1, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <Button onClick={() => setNovo(false)} sx={acaoSecundariaOportunidadeSx}>Cancelar</Button>
        <Button component={Link} href={selecionado ? `/oportunidades/cadastro/${selecionado}?nova=1` : '#'} disabled={!selecionado} variant="contained" sx={acaoPrincipalOportunidadeSx}>Continuar</Button>
      </DialogActions>
    </Dialog>
  </CrmPageShell></AppLayout>;
}
