'use client';

import {
  AccountBalanceWalletRounded,
  BuildRounded,
  CampaignRounded,
  GavelRounded,
  HandshakeRounded,
  LocalShippingRounded,
  ReceiptLongRounded,
  RequestQuoteRounded,
  ViewListRounded,
} from '@mui/icons-material';

import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import type { SolicitacaoSite } from '@/types/solicitacao-site';

interface SolicitacoesSiteCardsProps {
  solicitacoes: SolicitacaoSite[];
}

const categorias = [
  { tipo: 'COTACAO', titulo: 'Cotações', descricao: 'Leads para triagem de Marketing', cor: '#17456B', icone: RequestQuoteRounded },
  {
    tipo: 'AGREGADO',
    titulo: 'Agregados',
    descricao: 'Cadastros recebidos',
    cor: '#ff5805',
    icone: LocalShippingRounded,
  },
  {
    tipo: 'FORNECEDOR',
    titulo: 'Fornecedores',
    descricao: 'Contatos de fornecedores',
    cor: '#17456B',
    icone: HandshakeRounded,
  },
  {
    tipo: 'FROTA',
    titulo: 'Frota',
    descricao: 'Frota e manutenção',
    cor: '#ffb71b',
    icone: BuildRounded,
  },
  {
    tipo: 'MARKETING',
    titulo: 'Marketing',
    descricao: 'Marketing e comunicação',
    cor: '#7B61A8',
    icone: CampaignRounded,
  },
  {
    tipo: 'FINANCEIRO',
    titulo: 'Financeiro',
    descricao: 'Solicitações financeiras',
    cor: '#2E7D32',
    icone: AccountBalanceWalletRounded,
  },
  {
    tipo: 'JURIDICO',
    titulo: 'Jurídico',
    descricao: 'Assuntos jurídicos',
    cor: '#A35A00',
    icone: GavelRounded,
  },
  {
    tipo: 'FISCAL',
    titulo: 'Fiscal',
    descricao: 'Assuntos fiscais',
    cor: '#D32F2F',
    icone: ReceiptLongRounded,
  },
] as const;

export function SolicitacoesSiteCards({
  solicitacoes,
}: SolicitacoesSiteCardsProps) {
  function contarPorTipo(tipo: string) {
    return solicitacoes.filter(
      (solicitacao) =>
        solicitacao.tipo === tipo,
    ).length;
  }

  return (
    <Box>
      <Grid
        container
        spacing={2}
      >
        {/* TOTAL */}
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor:
                alpha('#17212B', 0.08),
              bgcolor: '#fff',
              transition:
                'transform 0.2s ease, box-shadow 0.2s ease',

              '&:hover': {
                transform:
                  'translateY(-2px)',

                boxShadow:
                  '0 12px 30px rgba(23, 33, 43, 0.08)',
              },
            }} className="crm-kpi-card"
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  borderRadius: 2.5,
                  bgcolor:
                    alpha(
                      '#17212B',
                      0.08,
                    ),
                  color: '#17212B',
                }} data-cartao-icone
              >
                <ViewListRounded />
              </Box>

              <Box
                sx={{
                  minWidth: 0,
                }} data-cartao-grupo
              >
                <Typography
                  sx={{
                    color:
                      'text.secondary',
                    fontSize: 13,
                    fontWeight: 800,
                  }} data-cartao-titulo
                >
                  Total da fila
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color:
                      'text.primary',
                    fontSize: 28,
                    lineHeight: 1,
                    fontWeight: 900,
                  }} data-cartao-valor
                >
                  {
                    solicitacoes.length
                  }
                </Typography>

                <Typography
                  sx={{
                    mt: 0.7,
                    color:
                      'text.secondary',
                    fontSize: 12.5,
                  }} data-cartao-legenda
                >
                  Solicitações recebidas
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* CATEGORIAS */}
        {categorias.map(
          (categoria) => {
            const Icone =
              categoria.icone;

            const quantidade =
              contarPorTipo(
                categoria.tipo,
              );

            return (
              <Grid
                key={
                  categoria.tipo
                }
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                  lg: 3,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    height:
                      '100%',

                    p: 2.5,

                    borderRadius:
                      3,

                    border:
                      '1px solid',

                    borderColor:
                      alpha(
                        categoria.cor,
                        0.15,
                      ),

                    bgcolor:
                      '#fff',

                    transition:
                      'transform 0.2s ease, box-shadow 0.2s ease',

                    '&:hover': {
                      transform:
                        'translateY(-2px)',

                      boxShadow:
                        `0 12px 30px ${alpha(
                          categoria.cor,
                          0.12,
                        )}`,
                    },
                  }} className="crm-kpi-card"
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                      alignItems:
                        'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 50,
                        height: 50,

                        display:
                          'grid',

                        placeItems:
                          'center',

                        flexShrink: 0,

                        borderRadius:
                          2.5,

                        bgcolor:
                          alpha(
                            categoria.cor,
                            0.1,
                          ),

                        color:
                          categoria.cor,

                        '& svg': {
                          fontSize: 26,
                        },
                      }} data-cartao-icone
                    >
                      <Icone />
                    </Box>

                    <Box
                      sx={{
                        minWidth: 0,
                      }} data-cartao-grupo
                    >
                      <Typography
                        sx={{
                          color:
                            'text.secondary',

                          fontSize:
                            13,

                          fontWeight:
                            800,
                        }} data-cartao-titulo
                      >
                        {
                          categoria.titulo
                        }
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.25,

                          color:
                            'text.primary',

                          fontSize:
                            28,

                          lineHeight:
                            1,

                          fontWeight:
                            900,
                        }} data-cartao-valor
                      >
                        {
                          quantidade
                        }
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.7,

                          color:
                            'text.secondary',

                          fontSize:
                            12.5,

                          whiteSpace:
                            'nowrap',

                          overflow:
                            'hidden',

                          textOverflow:
                            'ellipsis',
                        }} data-cartao-legenda
                      >
                        {
                          categoria.descricao
                        }
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            );
          },
        )}
      </Grid>
    </Box>
  );
}