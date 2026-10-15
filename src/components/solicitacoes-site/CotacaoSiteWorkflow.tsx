"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '@/context/auth-context';
import { hasAnyRole } from '@/lib/user-roles';
import { LeadAttachments } from '@/components/attachments/LeadAttachments';
import { atualizarCotacaoSite, converterCotacaoSiteCliente, direcionarCotacaoSite, listarComerciaisCotacaoSite } from '@/services/solicitacoes-site.service';
import type { AtualizarCotacaoSitePayload, BuscarSolicitacaoSiteResponse, CotacaoSiteHistorico, SolicitacaoSite } from '@/types/solicitacao-site';

const labels = { LEAD: 'Novo Lead', PROSPECT: 'Prospect', CLIENTE: 'Cliente' };
const editableFields = [
  ['nome', 'Nome do contato'], ['empresa', 'Empresa'], ['email', 'E-mail'], ['telefone', 'Telefone'],
  ['cnpj', 'CPF/CNPJ'], ['cidade', 'Cidade'], ['solucao', 'Solução'], ['observacaoInterna', 'Observação interna'],
] as const;

function draftFrom(request: SolicitacaoSite): AtualizarCotacaoSitePayload {
  return Object.fromEntries(editableFields.map(([field]) => [field, request[field] ?? '']));
}

function details(event: CotacaoSiteHistorico) {
  const metadata = event.metadata;
  if (metadata?.responsavelNome && typeof metadata.responsavelNome === 'string') return `Responsável: ${metadata.responsavelNome}`;
  const changes = metadata?.alteracoes;
  if (!changes || typeof changes !== 'object') return event.description;
  return Object.entries(changes).map(([field, value]) => {
    const label = editableFields.find(([key]) => key === field)?.[1] ?? field;
    if (!value || typeof value !== 'object' || !('de' in value) || !('para' in value)) return label;
    return `${label}: ${String(value.de ?? '—')} → ${String(value.para ?? '—')}`;
  }).join('; ');
}

export function CotacaoSiteWorkflow({ solicitacao, onChange }: {
  solicitacao: SolicitacaoSite;
  onChange: (solicitacao: SolicitacaoSite) => void;
}) {
  const { user, token } = useAuth();
  const triage = hasAnyRole(user, ['ADMIN', 'GESTAO', 'MARKETING']);
  const management = hasAnyRole(user, ['ADMIN', 'GESTAO']);
  const own = hasAnyRole(user, ['COMERCIAL']) && solicitacao.responsavelId === user?.id;
  const canEdit = solicitacao.etapaCotacao === 'LEAD' ? triage : solicitacao.etapaCotacao === 'PROSPECT' && (management || own);
  const canConvert = solicitacao.etapaCotacao === 'PROSPECT' && (management || own);
  const [comerciais, setComerciais] = useState<Array<{ id: string; name: string }>>([]);
  const [responsavelId, setResponsavelId] = useState(solicitacao.responsavelId ?? '');
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [busy, setBusy] = useState(false);
  const processing = useRef(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AtualizarCotacaoSitePayload>(() => draftFrom(solicitacao));
  const [converting, setConverting] = useState(false);
  const [document, setDocument] = useState(solicitacao.cnpj ?? '');

  useEffect(() => {
    setResponsavelId(solicitacao.responsavelId ?? '');
    setDocument(solicitacao.cnpj ?? '');
  }, [solicitacao.id, solicitacao.responsavelId, solicitacao.cnpj]);

  useEffect(() => {
    if (!triage || solicitacao.etapaCotacao === 'CLIENTE') return;
    let active = true;
    setLoadingOwners(true);
    listarComerciaisCotacaoSite().then((result) => { if (active) setComerciais(result); })
      .catch((error: unknown) => { if (active) setError(error instanceof Error ? error.message : 'Erro ao carregar usuários do Comercial.'); })
      .finally(() => { if (active) setLoadingOwners(false); });
    return () => { active = false; };
  }, [triage, solicitacao.id, solicitacao.etapaCotacao]);

  async function action(work: () => Promise<BuscarSolicitacaoSiteResponse>, done?: () => void) {
    if (processing.current) return;
    processing.current = true;
    setBusy(true); setError('');
    try {
      const response = await work();
      onChange(response.solicitacao);
      done?.();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Não foi possível atualizar a cotação.');
    } finally {
      processing.current = false; setBusy(false);
    }
  }

  if (solicitacao.tipo !== 'COTACAO') return null;
  const company = solicitacao.empresa?.trim() || solicitacao.nome;
  const stage = solicitacao.etapaCotacao ?? 'LEAD';
  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Captação e qualificação</Typography>
            <Chip label={labels[stage]} color={stage === 'CLIENTE' ? 'success' : 'primary'} size="small" />
          </Stack>
          <Typography color="text.secondary">Responsável Comercial: {solicitacao.responsavel?.name ?? 'Aguardando direcionamento pelo Marketing'}</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {triage && stage !== 'CLIENTE' ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="Comercial responsável" value={responsavelId} onChange={(event) => setResponsavelId(event.target.value)}
                disabled={busy || loadingOwners} fullWidth size="small">
                <MenuItem value="">Selecione um usuário</MenuItem>
                {comerciais.map((owner) => <MenuItem key={owner.id} value={owner.id}>{owner.name}</MenuItem>)}
              </TextField>
              <Button variant="contained" disabled={busy || loadingOwners || !responsavelId}
                onClick={() => action(() => direcionarCotacaoSite(solicitacao.id, responsavelId))}>Direcionar</Button>
            </Stack>
          ) : null}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {canEdit ? <Button variant="outlined" disabled={busy} onClick={() => {
              setDraft(draftFrom(solicitacao)); setError(''); setEditing(true);
            }}>Editar dados</Button> : null}
            {canConvert ? <Button variant="contained" disabled={busy} onClick={() => { setError(''); setConverting(true); }}>Converter em Cliente</Button> : null}
            {solicitacao.clientId ? <Button component={Link} href={`/clientes/${solicitacao.clientId}`} variant="outlined">Ver Cliente</Button> : null}
          </Stack>
          {solicitacao.observacaoInterna ? <Typography sx={{ whiteSpace: 'pre-wrap' }}>{solicitacao.observacaoInterna}</Typography> : null}
        </Stack>
      </Paper>

      {token && solicitacao.leadId ? <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <LeadAttachments token={token} leadId={solicitacao.leadId} />
      </Paper> : null}

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Histórico de movimentações</Typography>
        <Stack spacing={2}>
          {solicitacao.lead?.timeline?.map((event) => <Box key={event.id}>
            <Typography sx={{ fontWeight: 700 }}>{event.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(event.createdAt))}
              {' · '}{event.createdBy?.name ?? 'Site'}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 0.5 }}>{details(event)}</Typography>
            <Divider sx={{ mt: 2 }} />
          </Box>)}
          {!solicitacao.lead?.timeline?.length ? <Typography color="text.secondary">Nenhuma movimentação registrada.</Typography> : null}
        </Stack>
      </Paper>

      <Dialog open={editing} onClose={() => { if (!busy) setEditing(false); }} fullWidth maxWidth="sm" aria-labelledby="cotacao-edit-title">
        <DialogTitle id="cotacao-edit-title">Qualificar {company}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {editableFields.map(([field, label]) => <TextField key={field} label={label} value={draft[field] ?? ''}
              onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))}
              required={field === 'nome' || field === 'email'} type={field === 'email' ? 'email' : 'text'}
              multiline={field === 'observacaoInterna'} minRows={field === 'observacaoInterna' ? 3 : undefined} disabled={busy} />)}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setEditing(false)}>Cancelar</Button>
          <Button variant="contained" disabled={busy || !draft.nome?.trim() || !draft.email?.trim()}
            onClick={() => action(() => atualizarCotacaoSite(solicitacao.id, draft), () => setEditing(false))}>Salvar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={converting} onClose={() => { if (!busy) setConverting(false); }} fullWidth maxWidth="sm" aria-labelledby="cotacao-convert-title">
        <DialogTitle id="cotacao-convert-title">Converter {company} em Cliente?</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography>O histórico e os documentos serão preservados. Se já existir um Cliente com este documento, a solicitação será vinculada ao cadastro existente.</Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField label="CPF/CNPJ do Cliente" required value={document} disabled={busy} onChange={(event) => setDocument(event.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setConverting(false)}>Cancelar</Button>
          <Button variant="contained" disabled={busy || ![11, 14].includes(document.replace(/\D/g, '').length)}
            onClick={() => action(() => converterCotacaoSiteCliente(solicitacao.id, document), () => setConverting(false))}>Confirmar conversão</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
