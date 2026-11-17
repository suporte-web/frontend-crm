import { useCallback, useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Building2, Pencil, Plus, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CrmPageHeader, CrmPageShell, CrmSection } from '@/components/mui/crm-primitives';
import { useUser } from '@/UserContext';
import { hasAnyRole } from '@/lib/user-roles';
import { listarCadastros, type Cadastro } from '@/stores/cadastros/service';
import { atualizarEmpresaConsultora, criarEmpresaConsultora, listarCarteiraEmpresa, listarConsultoresEmpresas, listarEmpresasConsultoras, transferirCadastroEmpresa, vincularCarteiraEmpresa, vincularConsultorEmpresa, type CadastroCarteira, type ConsultorEmpresa, type EmpresaConsultora } from '@/stores/empresas-consultoras/service';

type Confirmacao = { titulo: string; descricao: string; executar: () => Promise<unknown> };
type Formulario = { id?: string; nome: string; cnpj: string };
const mensagemErro = (erro: unknown) => erro instanceof Error ? erro.message : 'Não foi possível concluir a operação.';

export default function EmpresasConsultoras() {
  const { user, token } = useUser();
  const permitido = hasAnyRole(user, ['ADMIN', 'GESTAO']) && !hasAnyRole(user, ['CONSULTORA']);
  const [empresas, setEmpresas] = useState<EmpresaConsultora[]>([]);
  const [consultores, setConsultores] = useState<ConsultorEmpresa[]>([]);
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [carteira, setCarteira] = useState<CadastroCarteira[]>([]);
  const [consultor, setConsultor] = useState<ConsultorEmpresa | null>(null);
  const [cadastro, setCadastro] = useState<Cadastro | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [previa, setPrevia] = useState<{ empresaId: string; cadastroIds: string[] } | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoCarteira, setCarregandoCarteira] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [revisao, setRevisao] = useState(0);
  const empresa = empresas.find(item => item.id === empresaId);

  const carregar = useCallback(async () => {
    if (!permitido || !token) return;
    setCarregando(true);
    setErro('');
    try {
      const [lista, usuarios, registros] = await Promise.all([
        listarEmpresasConsultoras(), listarConsultoresEmpresas(), listarCadastros(token),
      ]);
      setEmpresas(lista); setConsultores(usuarios); setCadastros(registros);
      setEmpresaId(atual => lista.some(item => item.id === atual) ? atual : lista[0]?.id || '');
      setPrevia(null); setConsultor(null); setCadastro(null);
      setRevisao(atual => atual + 1);
    } catch (error) { setErro(mensagemErro(error)); }
    finally { setCarregando(false); }
  }, [permitido, token]);

  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => {
    setCarteira([]); setPrevia(null); setConsultor(null); setCadastro(null);
    if (!permitido || !empresaId) return;
    let ativo = true;
    setCarregandoCarteira(true);
    listarCarteiraEmpresa(empresaId).then(dados => { if (ativo) setCarteira(dados); })
      .catch(error => { if (ativo) setErro(mensagemErro(error)); })
      .finally(() => { if (ativo) setCarregandoCarteira(false); });
    return () => { ativo = false; };
  }, [empresaId, permitido, revisao]);

  async function executar(acao: () => Promise<unknown>, mensagem: string) {
    setOcupado(true); setErro(''); setSucesso('');
    try {
      await acao();
      setConfirmacao(null); setFormulario(null); setPrevia(null);
      await carregar();
      setSucesso(mensagem);
    } catch (error) { setErro(mensagemErro(error)); }
    finally { setOcupado(false); }
  }

  async function simular() {
    if (!empresa) return;
    setOcupado(true); setErro(''); setPrevia(null);
    try {
      const ids = carteira.filter(item => !item.empresaConsultoraId).map(item => item.id);
      const resultado = await vincularCarteiraEmpresa(empresa.id, ids);
      setPrevia({ empresaId: empresa.id, cadastroIds: resultado.cadastroIds });
    } catch (error) { setErro(mensagemErro(error)); }
    finally { setOcupado(false); }
  }

  if (!permitido) return <AppLayout><Alert severity="error">Seu perfil não pode administrar empresas consultoras.</Alert></AppLayout>;

  return <AppLayout><CrmPageShell>
    <CrmPageHeader eyebrow="Administração" title="Empresas consultoras" description="Organize os colaboradores e a carteira compartilhada de cada empresa." icon={<Building2 size={28} />}
      aside={<Stack direction="row" spacing={1}><Button startIcon={<RefreshCw size={17} />} onClick={() => void carregar()} disabled={carregando || ocupado}>Atualizar</Button><Button variant="contained" startIcon={<Plus size={17} />} disabled={ocupado} onClick={() => setFormulario({ nome: '', cnpj: '' })}>Nova empresa</Button></Stack>} />
    {erro && <Alert severity="error" onClose={() => setErro('')}>{erro}</Alert>}
    {sucesso && <Alert severity="success" onClose={() => setSucesso('')}>{sucesso}</Alert>}
    {carregando && <CircularProgress size={24} />}
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Stack spacing={2}>
        <TextField select label="Empresa consultora" value={empresaId} onChange={e => setEmpresaId(e.target.value)} disabled={carregando || ocupado} fullWidth>
          {!empresas.length && <MenuItem value="">Nenhuma empresa cadastrada</MenuItem>}
          {empresas.map(item => <MenuItem key={item.id} value={item.id}>{item.nome}{item.ativa ? '' : ' — Inativa'}</MenuItem>)}
        </TextField>
        {empresa && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
          <Chip label={empresa.ativa ? 'Ativa' : 'Inativa'} color={empresa.ativa ? 'success' : 'default'} />
          <Typography variant="body2">{empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : 'CNPJ não informado'} · {empresa.usuarios.length} colaboradores · {empresa._count.cadastros} cadastros</Typography>
          <Button startIcon={<Pencil size={15} />} disabled={ocupado} onClick={() => setFormulario({ id: empresa.id, nome: empresa.nome, cnpj: empresa.cnpj || '' })}>Editar</Button>
          <Button color={empresa.ativa ? 'warning' : 'primary'} disabled={ocupado} onClick={() => setConfirmacao({ titulo: empresa.ativa ? 'Inativar empresa' : 'Reativar empresa', descricao: empresa.ativa ? 'Os consultores vinculados perderão o acesso à carteira enquanto a empresa estiver inativa. Os dados serão preservados.' : 'Os consultores vinculados voltarão a acessar a carteira desta empresa.', executar: () => atualizarEmpresaConsultora(empresa.id, { ativa: !empresa.ativa }) })}>{empresa.ativa ? 'Inativar' : 'Reativar'}</Button>
        </Stack>}
      </Stack>
    </Paper>

    {empresa && <>
      {!empresa.ativa && <Alert severity="warning">Esta empresa está inativa. Reative-a para adicionar colaboradores ou cadastros.</Alert>}
      <CrmSection><Typography component="h2" variant="h6">Colaboradores</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>As contas desta empresa compartilham a visualização e edição da carteira. Alterar o vínculo de uma conta não transfere seus cadastros.</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <Autocomplete sx={{ flex: 1 }} options={consultores.filter(item => item.isActive && item.empresaConsultoraId !== empresa.id)} value={consultor} onChange={(_, valor) => setConsultor(valor)} disabled={ocupado || !empresa.ativa}
            getOptionLabel={item => `${item.name} — ${item.email}${item.empresaConsultoraId ? ` (${empresas.find(e => e.id === item.empresaConsultoraId)?.nome || 'outra empresa'})` : ''}`} isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={params => <TextField {...params} label="Adicionar consultor existente" />} />
          <Button variant="outlined" disabled={!consultor || ocupado || !empresa.ativa} onClick={() => {
            if (!consultor) return;
            setConfirmacao({ titulo: 'Vincular colaborador', descricao: `${consultor.name} passará a acessar a carteira de ${empresa.nome}.${consultor.empresaConsultoraId ? ' O acesso à empresa anterior será removido, sem transferir a carteira.' : ''}`, executar: () => vincularConsultorEmpresa(empresa.id, consultor.id, true) });
          }}>Vincular</Button>
        </Stack>
        {!empresa.usuarios.length && <Typography color="text.secondary">Nenhum colaborador vinculado. Cadastre as contas em Usuários com o perfil CONSULTORA e vincule-as aqui.</Typography>}
        {empresa.usuarios.map(item => <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box><Typography sx={{ fontWeight: 600 }}>{item.name}{!item.isActive ? ' (inativo)' : ''}</Typography><Typography variant="body2" color="text.secondary">{item.email}</Typography></Box>
          <Button color="warning" disabled={ocupado} onClick={() => setConfirmacao({ titulo: 'Remover vínculo', descricao: `${item.name} perderá o acesso à carteira desta empresa. Os cadastros continuarão vinculados à empresa.`, executar: () => vincularConsultorEmpresa(empresa.id, item.id, false) })}>Desvincular</Button>
        </Stack>)}
      </CrmSection>

      <CrmSection><Typography component="h2" variant="h6">Carteira da empresa</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Cadastros existentes precisam de vínculo explícito com a empresa. Confira a prévia antes de aplicar.</Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <Autocomplete sx={{ flex: 1 }} options={cadastros.filter(item => item.empresaConsultoraId !== empresa.id)} value={cadastro} onChange={(_, valor) => setCadastro(valor)} disabled={ocupado || !empresa.ativa}
              getOptionLabel={item => `${item.companyName || item.legalName || item.id}${item.empresaConsultoraId ? ` (${empresas.find(e => e.id === item.empresaConsultoraId)?.nome || 'outra empresa'})` : ' (sem empresa)'}`} isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={params => <TextField {...params} label="Vincular ou transferir um cadastro" />} />
            <Button variant="outlined" disabled={!cadastro || ocupado || !empresa.ativa} onClick={() => {
              if (!cadastro) return;
              setConfirmacao({ titulo: 'Alterar empresa do cadastro', descricao: `${cadastro.companyName || cadastro.id} será vinculado a ${empresa.nome}. A empresa anterior perderá o acesso. O responsável individual será removido se pertencer a outra empresa; o histórico será preservado.`, executar: () => transferirCadastroEmpresa(cadastro.id, empresa.id) });
            }}>Vincular cadastro</Button>
          </Stack>
          {carregandoCarteira ? <CircularProgress size={24} /> : <>
            <Typography variant="body2">{carteira.filter(item => !item.empresaConsultoraId).length} cadastros sem empresa atribuídos aos consultores vinculados.</Typography>
            <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} disabled={ocupado || !empresa.ativa || !carteira.some(item => !item.empresaConsultoraId)} onClick={() => void simular()}>Conferir vínculos pendentes</Button>
            {previa?.empresaId === empresa.id && <Alert severity="info" action={<Button disabled={ocupado} onClick={() => setConfirmacao({ titulo: 'Aplicar vínculos da carteira', descricao: `Vincular ${previa.cadastroIds.length} cadastros a ${empresa.nome}? O responsável individual será preservado e cada alteração será auditada.`, executar: () => vincularCarteiraEmpresa(empresa.id, previa.cadastroIds, true) })}>Aplicar vínculos</Button>}>Prévia validada: {previa.cadastroIds.length} cadastros disponíveis para vínculo. Confira os registros marcados como pendentes na tabela.</Alert>}
            <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}><Table size="small" sx={{ minWidth: 580 }}>
              <TableHead><TableRow><TableCell>Cadastro</TableCell><TableCell>Responsável</TableCell><TableCell>Vínculo</TableCell><TableCell /></TableRow></TableHead>
              <TableBody>{carteira.map(item => <TableRow key={item.id}>
                <TableCell>{item.companyName || item.id}<Typography variant="caption" sx={{ display: 'block' }}>{item.modalidadeCadastro}</Typography></TableCell>
                <TableCell>{item.responsavel?.name || 'Sem responsável'}</TableCell>
                <TableCell><Chip size="small" color={item.empresaConsultoraId ? 'success' : 'warning'} label={item.empresaConsultoraId ? 'Vinculado' : 'Pendente'} /></TableCell>
                <TableCell>{item.empresaConsultoraId && <Button size="small" color="warning" disabled={ocupado} onClick={() => setConfirmacao({ titulo: 'Desvincular cadastro da empresa', descricao: `${item.companyName || item.id} deixará de ser acessível pelos consultores desta empresa. O responsável será removido se estiver vinculado a uma empresa consultora.`, executar: () => transferirCadastroEmpresa(item.id, null) })}>Desvincular</Button>}</TableCell>
              </TableRow>)}{!carteira.length && <TableRow><TableCell colSpan={4}>Nenhum cadastro vinculado ou pendente.</TableCell></TableRow>}</TableBody>
            </Table></TableContainer>
          </>}
        </Stack>
      </CrmSection>
    </>}

    <Dialog open={Boolean(formulario)} onClose={() => { if (!ocupado) setFormulario(null); }} fullWidth maxWidth="sm">
      <DialogTitle>{formulario?.id ? 'Editar empresa consultora' : 'Nova empresa consultora'}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {erro && <Alert severity="error">{erro}</Alert>}
        <TextField autoFocus label="Nome da empresa" required value={formulario?.nome || ''} disabled={ocupado} onChange={e => setFormulario(atual => atual && ({ ...atual, nome: e.target.value }))} />
        <TextField label="CNPJ (opcional)" value={formulario?.cnpj || ''} disabled={ocupado} onChange={e => setFormulario(atual => atual && ({ ...atual, cnpj: e.target.value }))} />
      </Stack></DialogContent>
      <DialogActions><Button disabled={ocupado} onClick={() => setFormulario(null)}>Cancelar</Button><Button variant="contained" disabled={ocupado || !formulario || formulario.nome.trim().length < 2} onClick={() => {
        if (!formulario) return;
        const dados = { nome: formulario.nome.trim(), cnpj: formulario.cnpj.trim() || null };
        void executar(() => formulario.id ? atualizarEmpresaConsultora(formulario.id, dados) : criarEmpresaConsultora(dados), 'Empresa salva.');
      }}>Salvar</Button></DialogActions>
    </Dialog>
    <Dialog open={Boolean(confirmacao)} onClose={() => { if (!ocupado) setConfirmacao(null); }} fullWidth maxWidth="sm">
      <DialogTitle>{confirmacao?.titulo}</DialogTitle><DialogContent><Typography>{confirmacao?.descricao}</Typography>{erro && <Alert severity="error" sx={{ mt: 2 }}>{erro}</Alert>}</DialogContent>
      <DialogActions><Button disabled={ocupado} onClick={() => setConfirmacao(null)}>Cancelar</Button><Button variant="contained" disabled={ocupado} onClick={() => { if (confirmacao) void executar(confirmacao.executar, 'Alteração concluída.'); }}>{ocupado ? 'Salvando…' : 'Confirmar'}</Button></DialogActions>
    </Dialog>
  </CrmPageShell></AppLayout>;
}
