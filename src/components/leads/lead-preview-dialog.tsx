'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography } from '@mui/material';
import { getLeadById, getLeadObservations } from '@/services/leads.service';
import { getLeadFunnelStageLabel } from '@/constants/lead-funnel';
import { getLeadSourceLabel } from './lead-timeline';
import type { Lead } from '@/types/leads';

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR') : 'Não informado';
}

export function LeadPreviewContent({ lead }: { lead: Lead }) {
  const fields = {
    Contato: lead.name,
    'E-mail': lead.email,
    Telefone: lead.phone,
    Etapa: getLeadFunnelStageLabel(lead.status),
    Origem: getLeadSourceLabel(lead.source),
    'Criado em': formatDate(lead.createdAt),
    'Última interação': formatDate(lead.lastInteractionAt),
  };
  return (
    <Stack spacing={2} sx={{ overflowWrap: 'anywhere' }}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {lead.company?.trim() || lead.name}
      </Typography>
      <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        {Object.entries(fields).map(([label, value]) => (
          <Box key={label}>
            <Typography component="dt" variant="caption" color="text.secondary">{label}</Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0 }}>{value || 'Não informado'}</Typography>
          </Box>
        ))}
      </Box>
      <Divider />
      <Typography variant="subtitle2">Observações</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{lead.notes || 'Nenhuma observação registrada.'}</Typography>
      {lead.observations?.map((observation) => (
        <Box key={observation.id}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{observation.content}</Typography>
          <Typography variant="caption" color="text.secondary">{formatDate(observation.createdAt)}{observation.createdBy ? ' · ' + observation.createdBy.name : ''}</Typography>
        </Box>
      ))}
      <Divider />
      <Typography variant="subtitle2">Histórico</Typography>
      {!lead.timeline?.length && <Typography variant="body2" color="text.secondary">Nenhum evento registrado.</Typography>}
      {lead.timeline?.map((event) => (
        <Box key={event.id}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{event.title}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{event.description}</Typography>
          <Typography variant="caption" color="text.secondary">{formatDate(event.createdAt)}{event.createdBy ? ' · ' + event.createdBy.name : ''}</Typography>
        </Box>
      ))}
    </Stack>
  );
}

export function LeadPreviewDialog({ leadId, token, onClose }: {
  leadId: string | null;
  token: string | null;
  onClose: () => void;
}) {
  const [result, setResult] = useState<{ id: string; token: string; lead?: Lead; error?: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setResult(null);
    if (!leadId || !token) return;
    let active = true;
    Promise.all([getLeadById(leadId, token), getLeadObservations(leadId, token)])
      .then(([lead, observations]) => { if (active) setResult({ id: leadId, token, lead: { ...lead, observations } }); })
      .catch((error: unknown) => {
        if (active) setResult({ id: leadId, token, error: error instanceof Error ? error.message : 'Não foi possível carregar o lead.' });
      });
    return () => { active = false; };
  }, [leadId, token, attempt]);
  const current = result?.id === leadId && result.token === token ? result : null;
  return (
    <Dialog open={!!leadId} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="lead-preview-title" slotProps={{ paper: { sx: { borderRadius: '18px' } } }}>
      <DialogTitle id="lead-preview-title">Pré-visualização do lead</DialogTitle>
      <DialogContent dividers>
        {!token ? <Alert severity="warning">Entre novamente para visualizar o lead.</Alert> : current?.error ? (
          <Alert severity="error" action={<Button onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</Button>}>{current.error}</Alert>
        ) : current?.lead ? <LeadPreviewContent lead={current.lead} /> : (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}><CircularProgress size={24} /><Typography>Carregando lead…</Typography></Stack>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Fechar</Button></DialogActions>
    </Dialog>
  );
}
