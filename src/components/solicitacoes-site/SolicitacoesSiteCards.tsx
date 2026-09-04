'use client';

import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';

import {
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import type { SolicitacaoSite } from '@/types/solicitacao-site';

interface SolicitacoesSiteCardsProps {
  solicitacoes: SolicitacaoSite[];
}

export function SolicitacoesSiteCards({
  solicitacoes,
}: SolicitacoesSiteCardsProps) {
  const novas = solicitacoes.filter(
    (item) => item.status === 'NOVO',
  ).length;

  const agregados = solicitacoes.filter(
    (item) => item.tipo === 'AGREGADO',
  ).length;

  const contatos = solicitacoes.filter(
    (item) => item.tipo === 'FALE_CONOSCO',
  ).length;

  const cards = [
    {
      titulo: 'Novas',
      valor: novas,
      icone: <AssignmentRoundedIcon />,
    },
    {
      titulo: 'Agregados',
      valor: agregados,
      icone: <LocalShippingRoundedIcon />,
    },
    {
      titulo: 'Fale conosco',
      valor: contatos,
      icone: <SupportAgentRoundedIcon />,
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid
          key={card.titulo}
          size={{
            xs: 12,
            sm: 6,
            lg: 4,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: 'center',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  width: 48,
                  height: 48,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 2.5,
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                }}
              >
                {card.icone}
              </Paper>

              <Stack spacing={0.25}>
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {card.titulo}
                </Typography>

                <Typography
                  sx={{
                    color: 'text.primary',
                    fontSize: 28,
                    lineHeight: 1,
                    fontWeight: 900,
                  }}
                >
                  {card.valor}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
