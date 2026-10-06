'use client';

import { useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Image as ImageIcon, Trash2, Undo2, Upload } from 'lucide-react';
import { crmPalette } from '@/components/mui/crm-primitives';
import { API_BASE_URL } from '@/services/api';
import { uploadImagemSite } from '@/services/site-institucional.service';

type SiteImageUploadProps = {
  slug: string;
  label: string;
  value: string;
  token: string;
  recommendedSize?: string;
  placement?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const publicSiteBaseUrl = process.env.NEXT_PUBLIC_SITE_PUBLIC_URL ?? 'http://localhost:3002';

function getPreviewSrc(value: string) {
  if (!value || /^https?:\/\//.test(value)) return value;
  if (value.startsWith('/api/public/site/assets/')) {
    return /^https?:\/\//.test(API_BASE_URL) ? new URL(value, API_BASE_URL).href : value;
  }
  if (value.startsWith('/images/')) return `${publicSiteBaseUrl}${value}`;
  return value;
}

export function SiteImageUpload({
  slug, label, value, token, recommendedSize, placement,
  disabled = false, onChange, onUploadingChange,
}: SiteImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInProgress = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [removedValue, setRemovedValue] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [previewValue, setPreviewValue] = useState(value);
  if (previewValue !== value) {
    setPreviewValue(value);
    setPreviewError(false);
  }

  async function handleFile(file?: File) {
    if (!file || disabled || uploadInProgress.current) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError('Use uma imagem JPG, PNG ou WEBP.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('A imagem deve ter no máximo 5 MB.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (!token) {
      setError('Sessão não encontrada. Faça login novamente.');
      return;
    }
    uploadInProgress.current = true;
    setUploading(true);
    onUploadingChange?.(true);
    setError('');
    try {
      const result = await uploadImagemSite(slug, file, token);
      onChange(result.path);
      setRemovedValue('');
      setPreviewError(false);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Erro ao enviar imagem.');
    } finally {
      uploadInProgress.current = false;
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeImage() {
    if (disabled || uploadInProgress.current || !value) return;
    setRemovedValue(value);
    setError('');
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: '100%', bgcolor: '#fff' }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography component="h3" sx={{ fontSize: 15, fontWeight: 850 }}>{label}</Typography>
            {placement ? <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>{placement}</Typography> : null}
          </Box>
          <Chip size="small" label={value ? 'Selecionada' : 'Sem seleção'} sx={{ flexShrink: 0 }} />
        </Stack>

        <Box sx={{ minHeight: 230, height: 260, display: 'grid', placeItems: 'center', overflow: 'hidden', border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: '#f8fafc' }}>
          {value && !previewError ? (
            <Box key={value} component="img" src={getPreviewSrc(value)} alt={label} onError={() => setPreviewError(true)}
              sx={{ width: '100%', height: '100%', maxHeight: 260, display: 'block', objectFit: 'contain' }} />
          ) : (
            <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', color: 'text.secondary', p: 2 }}>
              <ImageIcon size={34} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {previewError ? 'Não foi possível carregar a prévia.' : 'Nenhuma imagem selecionada'}
              </Typography>
              {previewError ? <Typography sx={{ fontSize: 12 }}>Você pode trocar ou excluir esta imagem.</Typography> : null}
            </Stack>
          )}
        </Box>

        <input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp"
          disabled={disabled || uploading} onChange={event => handleFile(event.target.files?.[0])} />
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button type="button" variant="outlined" startIcon={uploading ? <CircularProgress size={17} /> : <Upload size={17} />}
            disabled={disabled || uploading} onClick={() => inputRef.current?.click()}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, color: crmPalette.orangeDark, borderColor: crmPalette.orange }}>
            {uploading ? 'Enviando...' : value ? 'Trocar imagem' : 'Selecionar imagem'}
          </Button>
          {value ? (
            <Button type="button" variant="text" color="error" startIcon={<Trash2 size={17} />}
              disabled={disabled || uploading} onClick={removeImage} aria-label={`Excluir imagem: ${label}`}
              sx={{ textTransform: 'none', fontWeight: 750 }}>Excluir imagem</Button>
          ) : null}
        </Stack>

        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>JPG, PNG ou WEBP · até 5 MB</Typography>
        {recommendedSize ? <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Tamanho recomendado: {recommendedSize}</Typography> : null}
        {removedValue && !value ? (
          <Alert severity="info" action={
            <Button color="inherit" size="small" startIcon={<Undo2 size={14} />} disabled={disabled || uploading}
              onClick={() => { if (disabled || uploadInProgress.current) return; onChange(removedValue); setRemovedValue(''); }}>
              Desfazer
            </Button>
          }>Imagem removida da edição. Salve ou publique para aplicar.</Alert>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Stack>
    </Paper>
  );
}
