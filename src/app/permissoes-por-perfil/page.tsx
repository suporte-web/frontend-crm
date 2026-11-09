"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, InputAdornment, MenuItem, Paper, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { LockKeyhole, Save, Search, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CrmPageShell, CrmSection } from '@/components/mui/crm-primitives';
import { acaoPrincipalOportunidadeSx, acaoSecundariaOportunidadeSx, campoOportunidadeSx, superficieOportunidadeSx } from '@/components/crm/estilos-oportunidades';
import { useAuth } from '@/context/auth-context';
import { hasAnyRole } from '@/lib/user-roles';
import { roleMeta } from '@/lib/user-role-presentation';
import { notificarCrm } from '@/lib/feedback-crm';
import {
  agruparPermissoesPerfil, alternarPermissaoPerfil, filtrarGruposPermissoes,
  listarPermissoesPerfil, permissaoObrigatoriaAdmin, permissaoPerfilHabilitada,
  permissoesEfetivasPerfil, type PermissaoPerfil,
} from '@/lib/permissoes-perfil';
import { getScreenPermissions, updateRoleScreenPermissions } from '@/services/users.service';
import type { RoleScreenPermissionsGroup, UserRole } from '@/types/user';

const rotuloPerfil = (perfil: UserRole) => roleMeta[perfil]?.label ?? perfil;
const vazio: PermissaoPerfil[] = [];
const selecaoVazia = { inputLabel: { shrink: true }, select: { displayEmpty: true } };
const switchSx = {
  flexShrink: 0, ml: 1,
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff5805' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#ff5805' },
};

export default function PermissionsPage() {
  const { user: currentUser, refreshUser } = useAuth();
  const [perfis, setPerfis] = useState<RoleScreenPermissionsGroup[]>([]);
  const [perfilSelecionado, setPerfilSelecionado] = useState<UserRole>('ADMIN');
  const [rascunhos, setRascunhos] = useState<Partial<Record<UserRole, PermissaoPerfil[]>>>({});
  const [busca, setBusca] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const emGravacao = useRef(false);
  const requisicao = useRef(0);

  const carregar = useCallback(async () => {
    const atual = ++requisicao.current;
    setCarregando(true);
    setErroCarregamento('');
    try {
      const dados = await getScreenPermissions();
      if (atual !== requisicao.current) return;
      setPerfis(dados);
      setPerfilSelecionado(anterior => dados.some(item => item.role === anterior) ? anterior : dados[0]?.role ?? 'ADMIN');
    } catch (erro) {
      if (atual === requisicao.current) setErroCarregamento(erro instanceof Error ? erro.message : 'Não foi possível carregar as permissões.');
    } finally {
      if (atual === requisicao.current) setCarregando(false);
    }
  }, []);
  useEffect(() => { void carregar(); return () => { requisicao.current++; }; }, [carregar]);

  const catalogo = useMemo(() => listarPermissoesPerfil(perfis), [perfis]);
  const grupos = useMemo(() => agruparPermissoesPerfil(catalogo), [catalogo]);
  const gruposVisiveis = useMemo(() => filtrarGruposPermissoes(grupos, busca, grupoFiltro), [grupos, busca, grupoFiltro]);
  const base = perfis.find(item => item.role === perfilSelecionado)?.screens ?? vazio;
  const rascunho = rascunhos[perfilSelecionado] ?? vazio;
  const efetivas = useMemo(() => permissoesEfetivasPerfil(base, rascunho), [base, rascunho]);
  const habilitada = (item: { key: string; label: string }) => permissaoPerfilHabilitada(item, perfilSelecionado, efetivas);
  const totalHabilitadas = catalogo.filter(habilitada).length;
  const perfisPendentes = Object.values(rascunhos).filter(itens => itens?.length).length;
  const cadastroHabilitado = catalogo.some(item => item.key === 'cadastros' && habilitada(item));
  const temPerfil = perfis.some(item => item.role === perfilSelecionado);

  useEffect(() => {
    if (!perfisPendentes) return;
    const avisar = (evento: BeforeUnloadEvent) => { evento.preventDefault(); evento.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [perfisPendentes]);

  function alternar(chave: string) {
    if (emGravacao.current || carregando || !temPerfil) return;
    setRascunhos(anteriores => ({ ...anteriores, [perfilSelecionado]: alternarPermissaoPerfil(perfilSelecionado, base, anteriores[perfilSelecionado] ?? vazio, chave, catalogo) }));
  }

  async function salvar() {
    if (emGravacao.current || !rascunho.length || !temPerfil) return;
    emGravacao.current = true;
    setSalvando(true);
    const perfil = perfilSelecionado;
    try {
      const atualizado = await updateRoleScreenPermissions(perfil, { screens: rascunho.map(item => ({ ...item, screenLabel: item.screenLabel ?? undefined })) });
      setPerfis(anteriores => anteriores.map(item => item.role === perfil ? atualizado : item));
      setRascunhos(anteriores => ({ ...anteriores, [perfil]: [] }));
      notificarCrm(`Permissões de ${rotuloPerfil(perfil)} salvas com sucesso.`);
      if (hasAnyRole(currentUser, [perfil])) {
        try { await refreshUser(); }
        catch { notificarCrm('Permissões salvas. Não foi possível atualizar sua sessão; atualize a página para sincronizar o acesso.', 'warning'); }
      }
    } catch (erro) {
      notificarCrm(erro instanceof Error ? erro.message : 'Não foi possível salvar as permissões. Suas alterações foram mantidas.', 'error');
    } finally {
      emGravacao.current = false;
      setSalvando(false);
    }
  }

  return <AppLayout><CrmPageShell sx={{ gap: 2, minWidth: 0, containerType: 'inline-size', containerName: 'permissoes' }}>
    <CrmSection sx={superficieOportunidadeSx}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ width: 42, height: 42, flexShrink: 0, display: 'grid', placeItems: 'center', bgcolor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px' }}><ShieldCheck size={22} /></Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" sx={{ fontSize: { xs: 22, md: 25 }, fontWeight: 600, color: '#1f2937', lineHeight: 1.3 }}>Permissões por perfil</Typography>
          <Typography sx={{ mt: .75, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>Gerencie o acesso aos módulos e funcionalidades do CRM.</Typography>
        </Box>
      </Stack>
    </CrmSection>

    {carregando ? <Box role="status" aria-label="Carregando permissões" sx={{ py: 5, textAlign: 'center' }}><CircularProgress size={28} sx={{ color: '#ff5805' }} /></Box>
      : erroCarregamento ? <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void carregar()}>Tentar novamente</Button>}>{erroCarregamento}</Alert>
      : !perfis.length ? <Alert severity="info">Nenhum perfil disponível para configurar.</Alert>
      : <>
        <Paper variant="outlined" sx={superficieOportunidadeSx}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,1fr)', gap: 1.5, '@container permissoes (max-width: 760px)': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))', '& > :first-child': { gridColumn: '1 / -1' } }, '@container permissoes (max-width: 440px)': { gridTemplateColumns: 'minmax(0,1fr)' } }}>
            <TextField select fullWidth size="small" label="Perfil" value={perfilSelecionado} onChange={evento => setPerfilSelecionado(evento.target.value as UserRole)} disabled={salvando} sx={campoOportunidadeSx}>
              {perfis.map(perfil => <MenuItem key={perfil.role} value={perfil.role}>{rotuloPerfil(perfil.role)}{rascunhos[perfil.role]?.length ? ' • alterações pendentes' : ''}</MenuItem>)}
            </TextField>
            <TextField fullWidth size="small" label="Buscar funcionalidade" value={busca} onChange={evento => setBusca(evento.target.value)} sx={campoOportunidadeSx} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} color="#64748b" /></InputAdornment> } }} />
            <TextField select fullWidth size="small" label="Grupo" value={grupoFiltro} onChange={evento => setGrupoFiltro(evento.target.value)} sx={campoOportunidadeSx} slotProps={selecaoVazia}>
              <MenuItem value="">Todos os grupos</MenuItem>{grupos.map(grupo => <MenuItem key={grupo.id} value={grupo.id}>{grupo.nome}</MenuItem>)}
            </TextField>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} useFlexGap spacing={1} sx={{ mt: 1.75, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip size="small" label={`${totalHabilitadas}/${catalogo.length} telas habilitadas`} sx={{ height: 25, borderRadius: '6px', bgcolor: '#fff4eb', color: '#c94600', fontWeight: 500, fontSize: 12 }} />
              <Typography role="status" aria-live="polite" sx={{ fontSize: 12, color: rascunho.length ? '#a16207' : '#64748b' }}>{rascunho.length ? `${rascunho.length} alteração(ões) não salva(s) neste perfil` : 'Nenhuma alteração pendente neste perfil'}</Typography>
            </Stack>
            {(busca || grupoFiltro) && <Button size="small" onClick={() => { setBusca(''); setGrupoFiltro(''); }} sx={{ color: '#64748b', fontSize: 12, textTransform: 'none', flexShrink: 0 }}>Limpar filtros</Button>}
          </Stack>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', alignItems: 'start', gap: 1.5, '@container permissoes (max-width: 1000px)': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }, '@container permissoes (max-width: 680px)': { gridTemplateColumns: 'minmax(0,1fr)' } }}>
          {gruposVisiveis.map(grupo => {
            const todosItens = grupos.find(item => item.id === grupo.id)!.itens;
            return <Paper component="section" aria-label={grupo.nome} key={grupo.id} variant="outlined" sx={{ ...superficieOportunidadeSx, p: '0 !important', overflow: 'hidden' }}>
              <Stack direction="row" sx={{ px: 1.75, py: 1.4, borderBottom: '1px solid #edf2f7', bgcolor: '#fafbfc', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography component="h2" sx={{ fontWeight: 600, fontSize: 14, color: '#334155' }}>{grupo.nome}</Typography>
                <Typography sx={{ fontSize: 11.5, whiteSpace: 'nowrap', color: '#64748b' }}>{todosItens.filter(habilitada).length}/{todosItens.length} habilitadas</Typography>
              </Stack>
              <Box sx={{ px: 1.75 }}>
                {grupo.itens.map(item => {
                  const obrigatoria = permissaoObrigatoriaAdmin(perfilSelecionado, item.key);
                  const modalidade = ['clients', 'leads'].includes(item.key);
                  const bloqueada = obrigatoria || (modalidade && !cadastroHabilitado);
                  const ajuda = obrigatoria ? 'Obrigatória para Admin' : modalidade ? (cadastroHabilitado ? 'Vinculada a Cadastros' : 'Ative Cadastros para alterar') : perfilSelecionado === 'CONSULTORA' && item.key === 'opportunities' ? 'Somente cadastros sob sua responsabilidade' : '';
                  return <Box component="label" key={item.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 49, gap: .5, py: .75, borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 0 }, cursor: bloqueada || salvando ? 'default' : 'pointer', ...(modalidade ? { pl: 1.25, borderLeft: '2px solid #e2e8f0' } : {}) }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12.5, color: '#334155', fontWeight: item.key === 'cadastros' ? 600 : 400, overflowWrap: 'anywhere' }}>{item.label}</Typography>
                      {ajuda && <Typography sx={{ fontSize: 10.5, color: '#64748b', mt: .2, lineHeight: 1.4 }}>{obrigatoria && <LockKeyhole size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />}{ajuda}</Typography>}
                    </Box>
                    <Switch size="small" checked={habilitada(item)} disabled={salvando || bloqueada} onChange={() => alternar(item.key)} slotProps={{ input: { 'aria-label': `${item.label} — perfil ${rotuloPerfil(perfilSelecionado)}` } }} sx={switchSx} />
                  </Box>;
                })}
              </Box>
            </Paper>;
          })}
        </Box>
        {!gruposVisiveis.length && <Alert severity="info">Nenhuma funcionalidade encontrada. Ajuste a busca ou o grupo selecionado.</Alert>}

        <Paper variant="outlined" sx={{ ...superficieOportunidadeSx, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
            <Typography sx={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>As alterações são salvas por perfil.</Typography>
            <Typography sx={{ fontSize: 12, color: '#64748b', mt: .5 }}>{perfisPendentes ? `Rascunhos mantidos em ${perfisPendentes} perfil(is) ao trocar a seleção. Salve antes de sair da tela.` : 'Ative ou desative as funcionalidades e salve para aplicar.'}</Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, '@container permissoes (max-width: 440px)': { width: '100%', flexDirection: 'column', alignItems: 'stretch', '& > button': { ml: '0 !important', width: '100%' } } }}>
            <Button variant="outlined" disabled={salvando || !rascunho.length} onClick={() => setConfirmarDescarte(true)} sx={acaoSecundariaOportunidadeSx}>Descartar</Button>
            <Button variant="contained" disabled={salvando || !rascunho.length} onClick={() => void salvar()} startIcon={salvando ? <CircularProgress size={15} color="inherit" /> : <Save size={16} />} sx={acaoPrincipalOportunidadeSx}>{salvando ? 'Salvando...' : 'Salvar alterações'}</Button>
          </Stack>
        </Paper>
      </>}
    <Dialog open={confirmarDescarte} onClose={() => setConfirmarDescarte(false)} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontSize: 18 }}>Descartar alterações?</DialogTitle>
      <DialogContent><DialogContentText sx={{ fontSize: 14 }}>As alterações não salvas de {rotuloPerfil(perfilSelecionado)} serão descartadas. Os outros perfis serão preservados.</DialogContentText></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1, '& > button': { width: { xs: '100%', sm: 'auto' }, ml: '0 !important' } }}>
        <Button onClick={() => setConfirmarDescarte(false)} sx={acaoSecundariaOportunidadeSx}>Cancelar</Button>
        <Button onClick={() => { setRascunhos(anteriores => ({ ...anteriores, [perfilSelecionado]: [] })); setConfirmarDescarte(false); }} sx={acaoPrincipalOportunidadeSx}>Descartar alterações</Button>
      </DialogActions>
    </Dialog>
  </CrmPageShell></AppLayout>;
}
