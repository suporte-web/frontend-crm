'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Box,
  CircularProgress,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';

import { AppLayout } from '@/components/layout/app-layout';

import { SolicitacoesSiteCards } from '@/components/solicitacoes-site/SolicitacoesSiteCards';

import { SolicitacoesSiteTabela } from '@/components/solicitacoes-site/SolicitacoesSiteTabela';

import { listarSolicitacoesSite } from '@/services/solicitacoes-site.service';

import type { SolicitacaoSite } from '@/types/solicitacao-site';

const ITENS_POR_PAGINA = 10;

export default function SolicitacoesSitePage() {
  const [solicitacoes, setSolicitacoes] = useState<
    SolicitacaoSite[]
  >([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState('');

  const [pagina, setPagina] =
    useState(1);

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

        setPagina(1);
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

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      solicitacoes.length /
        ITENS_POR_PAGINA,
    ),
  );

  const solicitacoesPaginadas =
    useMemo(() => {
      const inicio =
        (pagina - 1) *
        ITENS_POR_PAGINA;

      const fim =
        inicio +
        ITENS_POR_PAGINA;

      return solicitacoes.slice(
        inicio,
        fim,
      );
    }, [
      pagina,
      solicitacoes,
    ]);

  const primeiroItem =
    solicitacoes.length > 0
      ? (pagina - 1) *
          ITENS_POR_PAGINA +
        1
      : 0;

  const ultimoItem = Math.min(
    pagina * ITENS_POR_PAGINA,
    solicitacoes.length,
  );

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
                solicitacoes={
                  solicitacoes
                }
              />

              <SolicitacoesSiteTabela
                solicitacoes={
                  solicitacoesPaginadas
                }
              />

              {solicitacoes.length >
              0 ? (
                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row',
                  }}
                  spacing={2}
                  sx={{
                    alignItems: {
                      xs: 'flex-start',
                      sm: 'center',
                    },

                    justifyContent:
                      'space-between',

                    pt: 1,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        'text.secondary',

                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Mostrando{' '}
                    {primeiroItem}–
                    {ultimoItem} de{' '}
                    {
                      solicitacoes.length
                    }{' '}
                    solicitações
                  </Typography>

                  {totalPaginas > 1 ? (
                    <Pagination
                      page={pagina}
                      count={
                        totalPaginas
                      }
                      onChange={(
                        _event,
                        novaPagina,
                      ) => {
                        setPagina(
                          novaPagina,
                        );
                      }}
                      color="primary"
                      shape="rounded"
                      siblingCount={1}
                      boundaryCount={1}
                      sx={{
                        '& .MuiPaginationItem-root':
                          {
                            fontWeight:
                              700,
                          },

                        '& .Mui-selected':
                          {
                            bgcolor:
                              '#ff5805 !important',

                            color:
                              '#fff',
                          },
                      }}
                    />
                  ) : null}
                </Stack>
              ) : null}
            </>
          )}
        </Stack>
      </Box>
    </AppLayout>
  );
}