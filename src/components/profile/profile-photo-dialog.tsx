'use client';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { Camera, Trash2, Upload, X } from 'lucide-react';
import { acaoPrincipalOportunidadeSx, acaoSecundariaOportunidadeSx } from '@/components/crm/estilos-oportunidades';
import { prepareProfilePhoto } from './prepare-profile-photo';
import { notificarCrm } from '@/lib/feedback-crm';

type Props = {
  name: string; photoUrl: string | null; loadError?: string;
  onClose: () => void; onSave: (photo: Blob) => Promise<void>; onRemove: () => Promise<void>;
};
export function ProfilePhotoDialog({ name, photoUrl, loadError, onClose, onSave, onRemove }: Props) {
  const input = useRef<HTMLInputElement>(null), version = useRef(0);
  const [draft, setDraft] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false), [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = preparing || saving;
  useEffect(() => () => { version.current++; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const current = ++version.current; setPreparing(true); setError('');
    try {
      const photo = await prepareProfilePhoto(file);
      if (current !== version.current) return;
      setDraft(photo); setPreview(URL.createObjectURL(photo));
    } catch (err) {
      if (current === version.current) { setDraft(null); setPreview(null); setError(err instanceof Error ? err.message : 'Não foi possível abrir a foto.'); }
    } finally { if (current === version.current) setPreparing(false); }
  }
  async function save() {
    if (!draft || busy) return; const current = ++version.current; setSaving(true); setError('');
    try { await onSave(draft); if (current !== version.current) return; notificarCrm('Foto de perfil atualizada.'); onClose(); }
    catch (err) { if (current === version.current) setError(err instanceof Error ? err.message : 'Não foi possível salvar a foto.'); }
    finally { if (current === version.current) setSaving(false); }
  }
  async function remove() {
    if (busy) return; const current = ++version.current; setSaving(true); setError('');
    try { await onRemove(); if (current !== version.current) return; notificarCrm('Foto de perfil removida.'); onClose(); }
    catch (err) { if (current === version.current) setError(err instanceof Error ? err.message : 'Não foi possível remover a foto.'); }
    finally { if (current === version.current) setSaving(false); }
  }
  return <Dialog open onClose={() => { if (!busy) onClose(); }} fullWidth maxWidth="xs" aria-labelledby="profile-photo-title"
    slotProps={{ paper: { sx: { borderRadius: '12px', m: 1.5, width: 'calc(100% - 24px)', border: '1px solid #e2e8f0', boxShadow: 'none' } } }}>
    <DialogTitle id="profile-photo-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 17, fontWeight: 600, borderBottom: '1px solid #e2e8f0', px: 2.5, py: 1.5 }}>
      Foto de perfil<IconButton aria-label="Fechar edição da foto" disabled={busy} onClick={onClose} size="small"><X size={18}/></IconButton>
    </DialogTitle>
    <DialogContent sx={{ px: 2.5, pt: '24px !important', pb: 2 }}>
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <Box sx={{ p: .75, borderRadius: '50%', border: '1px solid #fed7aa', bgcolor: '#fffaf7' }}>
          <Avatar src={preview || photoUrl || undefined} alt={`Foto de ${name}`} sx={{ width: 128, height: 128, bgcolor: '#ff5805', fontSize: 40 }}>{name.slice(0,1).toUpperCase()}</Avatar>
        </Box>
        <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 14, fontWeight: 600, color: '#343434', overflowWrap: 'anywhere' }}>{name}</Typography>
          <Typography sx={{ fontSize: 12, color: '#64748b', mt: .5 }}>Sua foto será salva na sua conta do CRM.</Typography></Box>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="Selecionar imagem de perfil" onChange={select}/>
        <Button variant="outlined" startIcon={preparing ? <CircularProgress size={16} color="inherit"/> : <Camera size={16}/>} disabled={busy} onClick={() => input.current?.click()} sx={acaoSecundariaOportunidadeSx}>{preparing ? 'Preparando foto...' : 'Escolher foto'}</Button>
        <Typography sx={{ fontSize: 12, color: '#64748b' }}>JPG, PNG ou WebP · até 5 MB<br/>A prévia mostra como a foto ficará no seu avatar.</Typography>
        {(error || (!draft && loadError)) && <Alert severity="error" sx={{ width: '100%', textAlign: 'left', fontSize: 13 }}>{error || loadError}</Alert>}
        {photoUrl && <Button startIcon={<Trash2 size={15}/>} disabled={busy} onClick={() => void remove()} sx={{ ...acaoSecundariaOportunidadeSx, color: '#b91c1c' }}>Remover foto atual</Button>}
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1, gap: 1, flexWrap: 'wrap', '& > button': { ml: '0 !important', flex: { xs: 1, sm: '0 0 auto' } } }}>
      <Button disabled={busy} onClick={onClose} sx={acaoSecundariaOportunidadeSx}>Cancelar</Button>
      <Button variant="contained" disabled={!draft || busy} onClick={() => void save()} startIcon={saving ? <CircularProgress size={16} color="inherit"/> : <Upload size={16}/>} sx={acaoPrincipalOportunidadeSx}>{saving ? 'Salvando...' : 'Salvar foto'}</Button>
    </DialogActions>
  </Dialog>;
}
