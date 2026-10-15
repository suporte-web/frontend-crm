'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { CrmSection } from '@/components/mui/crm-primitives';
import { useAuth } from '@/context/auth-context';
import { hasAnyRole } from '@/lib/user-roles';
import { decidirExclusaoLead, getSolicitacoesExclusaoLeads, type SolicitacaoExclusaoLead } from '@/services/leads.service';

export function SolicitacoesExclusaoLeads({ onChanged }: { onChanged: () => Promise<void> }) {
  const { user, token } = useAuth();
  const allowed = hasAnyRole(user, ['ADMIN', 'GESTAO', 'COMERCIAL']);
  const [items, setItems] = useState<SolicitacaoExclusaoLead[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<{ request: SolicitacaoExclusaoLead; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    if (!token || !allowed) { setItems([]); return; }
    try { setItems(await getSolicitacoesExclusaoLeads(token)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar as solicitações.'); }
  }, [token, allowed]);
  useEffect(() => { void load(); }, [load]);
  if (!allowed) return null;
  async function save() {
    if (!token || !decision || busy) return;
    setBusy(true); setError('');
    try {
      await decidirExclusaoLead(decision.request.id, { action: decision.action, message: message.trim() || undefined }, token);
      setDecision(null); setMessage(''); await load(); await onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível analisar a solicitação.'); }
    finally { setBusy(false); }
  }
  return <>
    {error && <Alert severity="error">{error}</Alert>}
    {items.length > 0 && <CrmSection sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>Solicitações de exclusão de leads</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Comercial, Gestão ou Admin podem aprovar ou recusar as solicitações das consultoras.</Typography>
      <Stack spacing={2}>
        {items.map(item => <Stack key={item.id} direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', pt: 2 }}>
          <Stack spacing={0.5}>
            <Typography sx={{ fontWeight: 700 }}>{item.leadNameSnapshot || 'Lead'}</Typography>
            <Typography variant="body2">Solicitado por {item.requestedBy?.name || 'Consultora'} em {new Date(item.createdAt).toLocaleDateString('pt-BR')}</Typography>
            <Typography variant="body2" color="text.secondary">{item.reason || 'Motivo não informado.'}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="outlined" disabled={busy} onClick={() => { setMessage(''); setDecision({ request: item, action: 'REJECT' }); }}>Recusar</Button>
            <Button color="error" variant="contained" disabled={busy} onClick={() => { setMessage(''); setDecision({ request: item, action: 'APPROVE' }); }}>Aprovar exclusão</Button>
          </Stack>
        </Stack>)}
      </Stack>
    </CrmSection>}
    <Dialog open={!!decision} onClose={() => { if (!busy) setDecision(null); }} fullWidth maxWidth="sm">
      <DialogTitle>{decision?.action === 'APPROVE' ? 'Confirmar exclusão do lead' : 'Recusar exclusão'}</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>{decision?.action === 'APPROVE' ? 'Ao aprovar, o lead será excluído. Esta ação não poderá ser desfeita.' : 'O lead será mantido no CRM.'}</Typography>
        <TextField label="Parecer (opcional)" fullWidth multiline minRows={3} value={message} disabled={busy} onChange={e => setMessage(e.target.value)} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setDecision(null)}>Cancelar</Button><Button disabled={busy} color={decision?.action === 'APPROVE' ? 'error' : 'primary'} variant="contained" onClick={() => void save()}>{busy ? 'Salvando...' : 'Confirmar'}</Button></DialogActions>
    </Dialog>
  </>;
}
