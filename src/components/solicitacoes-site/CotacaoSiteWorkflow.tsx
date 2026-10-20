"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/context/auth-context';
import { hasAnyRole } from '@/lib/user-roles';
import { direcionarCotacaoSite, listarComerciaisCotacaoSite, reprovarCotacaoSite } from '@/services/solicitacoes-site.service';
import type { BuscarSolicitacaoSiteResponse, SolicitacaoSite } from '@/types/solicitacao-site';

export function CotacaoSiteWorkflow({ solicitacao, onChange }: {
  solicitacao: SolicitacaoSite;
  onChange: (solicitacao: SolicitacaoSite) => void;
}) {
  const { user } = useAuth();
  const triagem = hasAnyRole(user, ['ADMIN', 'GESTAO', 'MARKETING']);
  const pendente = (solicitacao.etapaCotacao ?? 'LEAD') === 'LEAD';
  const reprovada = solicitacao.status === 'REPROVADO';
  const [comerciais, setComerciais] = useState<Array<{ id: string; name: string }>>([]);
  const [responsavelId, setResponsavelId] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const processando = useRef(false);
  const [erro, setErro] = useState('');
  const [reprovando, setReprovando] = useState(false);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (!triagem || !pendente || solicitacao.tipo !== 'COTACAO') return;
    let ativo = true;
    setCarregando(true);
    listarComerciaisCotacaoSite()
      .then(result => { if (ativo) setComerciais(result); })
      .catch((error: unknown) => { if (ativo) setErro(error instanceof Error ? error.message : 'Erro ao carregar responsáveis.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [triagem, pendente, solicitacao.id, solicitacao.tipo]);

  async function decidir(work: () => Promise<BuscarSolicitacaoSiteResponse>) {
    if (processando.current) return;
    processando.current = true;
    setOcupado(true);
    setErro('');
    try {
      const response = await work();
      onChange(response.solicitacao);
      setReprovando(false);
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir a triagem.');
    } finally {
      processando.current = false;
      setOcupado(false);
    }
  }

  if (solicitacao.tipo !== 'COTACAO') return null;
  return <Stack spacing={3}>
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Triagem de Marketing</Typography>
          <Chip label={reprovada ? 'Reprovada' : solicitacao.oportunidadeId ? 'Enviada ao Comercial' : 'Lead aguardando análise'}
            color={reprovada ? 'error' : solicitacao.oportunidadeId ? 'success' : 'warning'} size="small" />
        </Stack>
        <Typography color="text.secondary">{pendente
          ? 'Cotação recebida como lead do site. Analise os dados e reprove ou envie ao Comercial para criar uma oportunidade.'
          : reprovada ? 'A cotação foi reprovada na triagem e não gerou oportunidade comercial.'
          : `Responsável Comercial: ${solicitacao.responsavel?.name ?? 'Designado'}`}</Typography>
        {erro && !reprovando ? <Alert severity="error">{erro}</Alert> : null}
        {solicitacao.motivoReprovacao ? <Typography sx={{ whiteSpace: 'pre-wrap' }}>Motivo: {solicitacao.motivoReprovacao}</Typography> : null}
        {triagem && pendente ? <>
          <TextField select label="Comercial responsável" value={responsavelId} onChange={event => setResponsavelId(event.target.value)}
            disabled={ocupado || carregando} fullWidth size="small" helperText="A oportunidade será atribuída ao responsável selecionado.">
            <MenuItem value="">Selecione um responsável</MenuItem>
            {comerciais.map(owner => <MenuItem key={owner.id} value={owner.id}>{owner.name}</MenuItem>)}
          </TextField>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" disabled={ocupado || carregando || !responsavelId}
              onClick={() => decidir(() => direcionarCotacaoSite(solicitacao.id, responsavelId))}>Enviar ao Comercial</Button>
            <Button variant="outlined" color="error" disabled={ocupado} onClick={() => { setErro(''); setMotivo(''); setReprovando(true); }}>Reprovar</Button>
          </Stack>
        </> : null}
        {solicitacao.oportunidadeId && solicitacao.cadastroId ? <Button component={Link}
          href={`/oportunidades/cadastro/${solicitacao.cadastroId}`} variant="outlined" sx={{ alignSelf: 'flex-start' }}>Abrir oportunidade</Button> : null}
      </Stack>
    </Paper>
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Histórico da cotação</Typography>
      <Stack spacing={2}>
        {solicitacao.lead?.timeline?.map(event => <Stack key={event.id} spacing={0.5}>
          <Typography sx={{ fontWeight: 700 }}>{event.title}</Typography>
          <Typography variant="body2" color="text.secondary">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(event.createdAt))} · {event.createdBy?.name ?? 'Site'}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{event.description}</Typography>
        </Stack>)}
      </Stack>
    </Paper>
    <Dialog open={reprovando} onClose={() => { if (!ocupado) setReprovando(false); }} fullWidth maxWidth="sm" aria-labelledby="reprovar-cotacao-title">
      <DialogTitle id="reprovar-cotacao-title">Reprovar cotação</DialogTitle>
      <DialogContent dividers><Stack spacing={2}>
        <Typography>O lead e o histórico serão preservados. Esta ação não envia a cotação ao Comercial.</Typography>
        {erro ? <Alert severity="error">{erro}</Alert> : null}
        <TextField label="Motivo da reprovação" required multiline minRows={3} value={motivo} disabled={ocupado}
          onChange={event => setMotivo(event.target.value)} slotProps={{ htmlInput: { maxLength: 2000 } }} />
      </Stack></DialogContent>
      <DialogActions>
        <Button disabled={ocupado} onClick={() => setReprovando(false)}>Cancelar</Button>
        <Button variant="contained" color="error" disabled={ocupado || !motivo.trim()}
          onClick={() => decidir(() => reprovarCotacaoSite(solicitacao.id, motivo.trim()))}>Confirmar reprovação</Button>
      </DialogActions>
    </Dialog>
  </Stack>;
}
