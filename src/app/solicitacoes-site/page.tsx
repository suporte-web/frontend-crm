'use client';

import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';

import { AppLayout } from '@/components/layout/app-layout';
import { SolicitacoesSiteCards } from '@/components/solicitacoes-site/SolicitacoesSiteCards';
import { SolicitacoesSiteTabela } from '@/components/solicitacoes-site/SolicitacoesSiteTabela';

import { listarSolicitacoesSite } from '@/services/solicitacoes-site.service';

import type { SolicitacaoSite } from '@/types/solicitacao-site';

export default function SolicitacoesSitePage() {
  const [solicitacoes, setSolicitacoes] = useState<
    SolicitacaoSite[]
  >([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        setErro('');

        const response =
          await listarSolicitacoesSite({
            excluirTipo: 'COTACAO',
          });

        setSolicitacoes(
          response.solicitacoes,
        );
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar solicitações.',
        );
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  return (
    <AppLayout>
      <Box>
        <Stack spacing={3}>
          <Box>
            <Typography
              component="h1"
              sx={{
                color: 'text.primary',
                fontSize: {
                  xs: 26,
                  md: 32,
                },
                fontWeight: 900,
              }}
            >
              Fila do site
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: 'text.secondary',
              }}
            >
              Acompanhe agregados e contatos recebidos
              pelo site da Pizzattolog. Solicitações de
              cotação entram diretamente em Leads.
            </Typography>
          </Box>

          {erro ? (
            <Alert severity="error">
              {erro}
            </Alert>
          ) : null}

          {carregando ? (
            <Box
              sx={{
                minHeight: 300,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <SolicitacoesSiteCards
                solicitacoes={solicitacoes}
              />

              <SolicitacoesSiteTabela
                solicitacoes={solicitacoes}
              />
            </>
          )}
        </Stack>
      </Box>
    </AppLayout>
  );
}
