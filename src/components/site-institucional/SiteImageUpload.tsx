'use client';

import {
  useRef,
  useState,
} from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  Image as ImageIcon,
  Upload,
} from 'lucide-react';

import {
  crmPalette,
} from '@/components/mui/crm-primitives';

import {
  uploadImagemSite,
} from '@/services/site-institucional.service';

type SiteImageUploadProps = {
  slug: string;

  label: string;

  value: string;

  token: string;

  recommendedSize?: string;

  disabled?: boolean;

  onChange: (
    value: string,
  ) => void;
};

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ACCEPTED_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

const publicSiteBaseUrl =
  process.env.NEXT_PUBLIC_SITE_PUBLIC_URL ??
  'http://localhost:3002';

function getPreviewSrc(
  value: string,
) {
  if (
    !value ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value;
  }

  if (
    value.startsWith('/images/')
  ) {
    return `${publicSiteBaseUrl}${value}`;
  }

  return value;
}

export function SiteImageUpload({
  slug,
  label,
  value,
  token,
  recommendedSize,
  disabled = false,
  onChange,
}: SiteImageUploadProps) {
  const previewSrc =
    getPreviewSrc(value);

  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');

  async function handleFile(
    file?: File,
  ) {
    if (!file) {
      return;
    }

    if (
      !ACCEPTED_TYPES.has(
        file.type,
      )
    ) {
      setError(
        'Use uma imagem JPG, PNG ou WEBP.',
      );

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setError(
        'A imagem deve ter no máximo 5 MB.',
      );

      return;
    }

    if (!token) {
      setError(
        'Sessão não encontrada. Faça login novamente.',
      );

      return;
    }

    try {
      setUploading(true);

      setError('');

      const resultado =
        await uploadImagemSite(
          slug,
          file,
          token,
        );

      onChange(
        resultado.path,
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Erro ao enviar imagem.',
      );
    } finally {
      setUploading(false);

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          '';
      }
    }
  }

  return (
    <Stack spacing={1.5}>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          minHeight: 220,

          display: 'grid',
          placeItems: 'center',

          overflow: 'hidden',

          border: '1px dashed',
          borderColor: 'divider',

          borderRadius: '14px',

          bgcolor: '#f8fafc',
        }}
      >
        {value ? (
          <Box
            component="img"
            src={previewSrc}
            alt={label}
            sx={{
              width: '100%',
              height: 260,

              display: 'block',

              objectFit: 'cover',
            }}
          />
        ) : (
          <Stack
            spacing={1}
            sx={{
              alignItems:
                'center',

              color:
                'text.secondary',
            }}
          >
            <ImageIcon
              size={34}
            />

            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Nenhuma imagem selecionada
            </Typography>
          </Stack>
        )}
      </Paper>

      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) =>
          handleFile(
            event.target
              .files?.[0],
          )
        }
      />

      <Button
        type="button"
        variant="outlined"
        startIcon={
          uploading ? (
            <CircularProgress
              size={17}
            />
          ) : (
            <Upload
              size={17}
            />
          )
        }
        disabled={
          disabled ||
          uploading
        }
        onClick={() =>
          inputRef.current?.click()
        }
        sx={{
          width: 'fit-content',

          borderRadius: '10px',

          textTransform: 'none',

          fontWeight: 800,

          borderColor:
            crmPalette.orange,

          color:
            crmPalette.orangeDark,
        }}
      >
        {uploading
          ? 'Enviando...'
          : value
            ? 'Trocar imagem'
            : 'Selecionar imagem'}
      </Button>

      <Typography
        sx={{
          color:
            'text.secondary',

          fontSize: 12,
        }}
      >
        JPG, PNG ou WEBP • máximo 5 MB
      </Typography>

      {recommendedSize ? (
        <Typography
          sx={{
            color:
              'text.secondary',

            fontSize: 12,
          }}
        >
          Recomendado: {recommendedSize}
        </Typography>
      ) : null}

      {error ? (
        <Alert severity="error">
          {error}
        </Alert>
      ) : null}
    </Stack>
  );
}
