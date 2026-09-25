'use client';

import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import type {
  AnexoSolicitacaoSite,
} from '@/types/solicitacao-site';

interface AnexosSolicitacaoSiteProps {
  anexos?: AnexoSolicitacaoSite[];
}

function formatarTamanho(
  tamanho?: number | null,
) {
  if (!tamanho) {
    return 'Tamanho não informado';
  }

  if (tamanho < 1024) {
    return `${tamanho} B`;
  }

  if (tamanho < 1024 * 1024) {
    return `${(
      tamanho / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    tamanho /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function obterIcone(
  tipoArquivo?: string | null,
) {
  if (
    tipoArquivo === 'application/pdf'
  ) {
    return (
      <PictureAsPdfOutlinedIcon
        color="error"
      />
    );
  }

  if (
    tipoArquivo?.startsWith('image/')
  ) {
    return (
      <ImageOutlinedIcon
        color="primary"
      />
    );
  }

  return <DescriptionOutlinedIcon />;
}

function obterTipoArquivo(
  tipoArquivo?: string | null,
) {
  switch (tipoArquivo) {
    case 'application/pdf':
      return 'PDF';

    case 'image/jpeg':
      return 'JPG';

    case 'image/png':
      return 'PNG';

    default:
      return 'Arquivo';
  }
}

export function AnexosSolicitacaoSite({
  anexos = [],
}: AnexosSolicitacaoSiteProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'center',
          p: 2.5,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 42,
            height: 42,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <AttachFileRoundedIcon />
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 900,
            }}
          >
            Documentos anexados
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 13,
            }}
          >
            {anexos.length === 0
              ? 'Nenhum arquivo anexado'
              : `${anexos.length} ${
                  anexos.length === 1
                    ? 'arquivo'
                    : 'arquivos'
                }`}
          </Typography>
        </Box>
      </Stack>

      <Divider />

      {anexos.length === 0 ? (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 14,
            }}
          >
            Esta solicitação não possui
            documentos anexados.
          </Typography>
        </Box>
      ) : (
        <Stack divider={<Divider />}>
          {anexos.map((anexo) => (
            <Stack
              key={anexo.id}
              direction="row"
              spacing={2}
              sx={{
                alignItems: 'center',
                p: 2.5,
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                {obterIcone(
                  anexo.tipoArquivo,
                )}
              </Box>

              <Box
                sx={{
                  minWidth: 0,
                  flexGrow: 1,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    overflow: 'hidden',
                    textOverflow:
                      'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {
                    anexo.nomeArquivoOriginal
                  }
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    mt: 0.75,
                    alignItems: 'center',
                  }}
                >
                  <Chip
                    size="small"
                    label={obterTipoArquivo(
                      anexo.tipoArquivo,
                    )}
                  />

                  <Typography
                    sx={{
                      color:
                        'text.secondary',
                      fontSize: 12,
                    }}
                  >
                    {formatarTamanho(
                      anexo.tamanho,
                    )}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}