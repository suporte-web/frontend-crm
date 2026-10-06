'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { CrmSection, crmPalette } from '@/components/mui/crm-primitives';
import { getImagePlacement } from '@/config/site-institucional/site-media-guide';
import type { SiteSectionConfig } from '@/types/site-institucional';
import { SiteImageUpload } from './SiteImageUpload';

type SiteSectionEditorProps = {
  slug: string;
  token: string;
  section: SiteSectionConfig;
  getValue: (path: string) => unknown;
  onChange: (path: string, value: string) => void;
  onUploadStateChange?: (path: string, uploading: boolean) => void;
  disabled?: boolean;
};

export function SiteSectionEditor({ slug, token, section, getValue, onChange, onUploadStateChange, disabled = false }: SiteSectionEditorProps) {
  const imagesOnly = section.fields.every(field => field.type === 'image');
  return (
    <CrmSection>
      <Stack direction="row" spacing={1.5} sx={{ p: { xs: 2, md: 3 }, alignItems: 'center' }}>
        <Box sx={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: '#fff7ed', color: crmPalette.orangeDark, flexShrink: 0 }}>
          {imagesOnly ? <ImageIcon size={20} /> : <FileText size={20} />}
        </Box>
        <Box>
          <Typography component="h2" sx={{ fontSize: 20, fontWeight: 900 }}>
            {slug === 'solucoes' && section.key === 'solucoes' ? 'Cards da página Soluções' : section.title}
          </Typography>
          <Typography sx={{ mt: 0.35, color: 'text.secondary', fontSize: 13 }}>
            {imagesOnly
              ? `${section.fields.length} ${section.fields.length === 1 ? 'foto nesta seção' : 'fotos nesta seção'}. Veja abaixo onde cada imagem aparece.`
              : section.description}
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: { xs: 2, md: 3 } }}>
        <Box sx={imagesOnly ? { display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 } : { display: 'grid', gap: 2 }}>
          {section.fields.map(field => {
            const value = getValue(field.path);
            const stringValue = typeof value === 'string' ? value : '';
            if (field.type === 'image') return (
              <SiteImageUpload key={field.path} slug={slug} token={token} label={field.label}
                value={stringValue} recommendedSize={field.recommendedSize} placement={getImagePlacement(slug, field.path)}
                disabled={disabled} onChange={image => onChange(field.path, image)}
                onUploadingChange={uploading => onUploadStateChange?.(field.path, uploading)} />
            );
            return (
              <TextField key={field.path} label={field.label} value={stringValue}
                onChange={event => onChange(field.path, event.target.value)} placeholder={field.placeholder}
                helperText={field.helperText} multiline={field.type === 'textarea'}
                minRows={field.type === 'textarea' ? field.rows ?? 4 : undefined}
                disabled={disabled} fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#fff' } }} />
            );
          })}
        </Box>
      </Box>
    </CrmSection>
  );
}
