'use client';

import Link from 'next/link';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Handshake, PlusCircle, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CrmPageHeader, CrmPageShell } from '@/components/mui/crm-primitives';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/services/api';
import { listarCadastros, type Cadastro } from '@/services/cadastros.service';
import { formatarEtapaOportunidade } from '@/services/crm.service';
import type { OpportunityStage, OpportunityStatus } from '@/types/crm';
import { hasAnyRole } from '@/lib/user-roles';

type Oportunidade = { id: string; clientId: string; title: string; value: string | number | null; stage: OpportunityStage; status: OpportunityStatus; client: Cadastro };
const etapas: OpportunityStage[] = ['NOVO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO'];
const situacoes = { OPEN: 'Aberta', WON: 'Ganha', LOST: 'Perdida' };
const filtrarCadastros = createFilterOptions<Cadastro>({
  limit: 50,
  stringify: cadastro => [cadastro.tradeName, cadastro.companyName, cadastro.legalName, cadastro.document].filter(Boolean).join(' '),
});
const estiloFiltro = {
  minWidth: 0,
  '& .MuiOutlinedInput-root': {
    height: 44,
    borderRadius: '10px',
    bgcolor: '#fff',
    fontSize: 14,
    '& fieldset': { borderColor: '#cbd5e1' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused fieldset': { borderColor: '#ff5805' },
  },
  '& .MuiInputLabel-root': { fontSize: 14 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#ea580c' },
  '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};

export default function OportunidadesPage() {
  const { token, user } = useAuth();
  const [lista, setLista] = useState<Oportunidade[]>([]);
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [cadastroFiltro, setCadastroFiltro] = useState('');
  const [etapa, setEtapa] = useState('');
  const [situacao, setSituacao] = useState('');
  const [novo, setNovo] = useState(false);
  const [selecionado, setSelecionado] = useState('');
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    Promise.all([apiFetch<Oportunidade[]>('/oportunidades', {}, token), listarCadastros(token)])
      .then(([oportunidades, registros]) => { if (ativo) { setLista(oportunidades); setCadastros(registros.filter(item => hasAnyRole(user, ['ADMIN', 'GESTAO']) || item.internalOwnerId === user?.id)); } })
      .catch(e => { if (ativo) setErro(e instanceof Error ? e.message : 'Erro ao carregar oportunidades.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [token, user]);
  const visiveis = useMemo(() => lista.filter(item => {
    const nome = item.client.tradeName || item.client.legalName || item.client.companyName || '';
    return (!modalidade || item.client.modalidadeCadastro === modalidade) && (!cadastroFiltro || item.clientId === cadastroFiltro) && (!etapa || item.stage === etapa) && (!situacao || item.status === situacao) && (!busca || `${item.title} ${nome}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')));
  }), [lista, modalidade, cadastroFiltro, etapa, situacao, busca]);
  return <AppLayout><CrmPageShell>
   
<CrmPageHeader
  title="Oportunidades/Propostas"
  description="Acompanhe as oportunidades e propostas vinculadas aos seus Clientes e Leads."
  icon={<Handshake size={30} />}
  aside={
    <Button
      variant="contained"
      size="small"
      startIcon={<PlusCircle size={18} />}
      onClick={() => setNovo(true)}
      sx={{
        bgcolor: "#ff5805",
        color: "#ffffff",
        minHeight: 36,
        px: 2,
        borderRadius: "9px",
        fontSize: 12,
        fontWeight: 700,
        textTransform: "none",
        boxShadow: "none",

        "&:hover": {
          bgcolor: "#f23f35",
          boxShadow: "none",
        },
      }}
    >
      Nova oportunidade
    </Button>
  }
/>

    {erro && <Alert severity="error">{erro}</Alert>}
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, borderColor: '#e2e8f0' }}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'minmax(220px, 1.5fr) repeat(4, minmax(0, 1fr))' },
        gap: 2,
        alignItems: 'start',
      }}>
        <TextField
          label="Buscar oportunidade ou empresa"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          size="small"
          fullWidth
          sx={{ ...estiloFiltro, gridColumn: { sm: '1 / -1', lg: 'auto' } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="#64748b" /></InputAdornment> } }}
        />
        <TextField select label="Modalidade" value={modalidade} onChange={e => setModalidade(e.target.value)} size="small" fullWidth sx={estiloFiltro}><MenuItem value="">Todas</MenuItem><MenuItem value="CLIENTE">Cliente</MenuItem><MenuItem value="LEAD">Lead</MenuItem></TextField>
        <TextField select label="Cadastro" value={cadastroFiltro} onChange={e => setCadastroFiltro(e.target.value)} size="small" fullWidth sx={estiloFiltro}><MenuItem value="">Todos</MenuItem>{cadastros.map(item => <MenuItem key={item.id} value={item.id}>{item.tradeName || item.companyName || item.legalName || 'Sem nome'}</MenuItem>)}</TextField>
        <TextField select label="Etapa" value={etapa} onChange={e => setEtapa(e.target.value)} size="small" fullWidth sx={estiloFiltro}><MenuItem value="">Todas</MenuItem>{etapas.map(item => <MenuItem key={item} value={item}>{formatarEtapaOportunidade(item)}</MenuItem>)}</TextField>
        <TextField select label="Situação" value={situacao} onChange={e => setSituacao(e.target.value)} size="small" fullWidth sx={estiloFiltro}><MenuItem value="">Todas</MenuItem>{Object.entries(situacoes).map(([valor, rotulo]) => <MenuItem key={valor} value={valor}>{rotulo}</MenuItem>)}</TextField>
      </Box>
    </Paper>
    {carregando ? <CircularProgress /> : <Stack spacing={2}>
      <Typography color="text.secondary">{visiveis.length} oportunidade(s) encontrada(s)</Typography>
      {!visiveis.length && <Alert severity="info">Nenhuma oportunidade encontrada para os filtros selecionados.</Alert>}
      {visiveis.map(item => <Paper key={item.id} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}><Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
        <Stack spacing={0.75} sx={{ flex: 1 }}><Typography sx={{ fontWeight: 800 }}>{item.title}</Typography><Typography component={Link} href={`/cadastros/${item.clientId}`} color="text.secondary">{item.client.tradeName || item.client.companyName || item.client.legalName || 'Cadastro'}</Typography></Stack>
        <Chip label={item.client.modalidadeCadastro === 'LEAD' ? 'Lead' : 'Cliente'} size="small" />
        <Chip label={formatarEtapaOportunidade(item.stage)} size="small" /><Chip label={situacoes[item.status]} size="small" />
        <Typography sx={{ fontWeight: 700 }}>{Number(item.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Typography>
        <Button component={Link} href={`/oportunidades/cadastro/${item.clientId}`} variant="outlined">Abrir propostas</Button>
      </Stack></Paper>)}
    </Stack>}
    <Dialog open={novo} onClose={() => setNovo(false)} fullWidth maxWidth="sm"><DialogTitle>Nova oportunidade/proposta</DialogTitle><DialogContent><Stack spacing={3} sx={{ pt: 1 }}>
      <Autocomplete
        fullWidth
        options={cadastros}
        value={cadastros.find(item => item.id === selecionado) ?? null}
        onChange={(_, cadastro) => setSelecionado(cadastro?.id ?? '')}
        getOptionKey={cadastro => cadastro.id}
        getOptionLabel={cadastro => `${cadastro.tradeName || cadastro.companyName || cadastro.legalName || 'Sem nome'} · ${cadastro.modalidadeCadastro === 'CLIENTE' ? 'Cliente' : 'Lead'}`}
        isOptionEqualToValue={(opcao, valor) => opcao.id === valor.id}
        filterOptions={filtrarCadastros}
        loading={carregando}
        loadingText="Carregando cadastros..."
        noOptionsText="Nenhum cliente ou lead encontrado."
        clearText="Limpar seleção"
        openText="Abrir opções"
        closeText="Fechar opções"
        slotProps={{ listbox: { sx: { maxHeight: 240 } } }}
        renderInput={parametros => (
          <TextField
            {...parametros}
            label="Cliente ou Lead"
            placeholder="Digite o nome ou documento para buscar"
            helperText="Pesquise e selecione um cliente ou lead para continuar."
            sx={estiloFiltro}
          />
        )}
      />
      <Stack direction="row" sx={{ justifyContent: "flex-end" }} spacing={1}><Button onClick={() => setNovo(false)}>Cancelar</Button><Button component={Link} href={selecionado ? `/oportunidades/cadastro/${selecionado}?nova=1` : '#'} disabled={!selecionado} variant="contained">Continuar</Button></Stack>
    </Stack></DialogContent></Dialog>
  </CrmPageShell></AppLayout>;
}
