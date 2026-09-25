'use client';

import Link from 'next/link';

import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { alpha } from '@mui/material/styles';

import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';

import type { SolicitacaoSite } from '@/types/solicitacao-site';

interface SolicitacoesSiteTabelaProps {
  solicitacoes: SolicitacaoSite[];
}

function obterTipoConfig(tipo: string) {
  switch (tipo) {
    case 'COTACAO':
      return {
        label: 'Cotação',
        cor: '#17456B',
        icone: RequestQuoteRoundedIcon,
      };

    case 'AGREGADO':
      return {
        label: 'Agregado',
        cor: '#ff5805',
        icone: LocalShippingRoundedIcon,
      };

    case 'FORNECEDOR':
      return {
        label: 'Fornecedor',
        cor: '#17456B',
        icone: HandshakeRoundedIcon,
      };

    case 'FROTA':
      return {
        label: 'Frota',
        cor: '#ffb71b',
        icone: BuildRoundedIcon,
      };

    case 'MARKETING':
      return {
        label: 'Marketing',
        cor: '#7B61A8',
        icone: CampaignRoundedIcon,
      };

    case 'FINANCEIRO':
      return {
        label: 'Financeiro',
        cor: '#2E7D32',
        icone: AccountBalanceWalletRoundedIcon,
      };

    case 'JURIDICO':
      return {
        label: 'Jurídico',
        cor: '#A35A00',
        icone: GavelRoundedIcon,
      };

    case 'FISCAL':
      return {
        label: 'Fiscal',
        cor: '#D32F2F',
        icone: ReceiptLongRoundedIcon,
      };

    default:
      return {
        label: tipo,
        cor: '#607D8B',
        icone: InboxRoundedIcon,
      };
  }
}

function obterStatusConfig(status: string) {
  switch (status) {
    case 'NOVO':
      return {
        label: 'Novo',
        cor: '#ff5805',
        fundo: alpha('#ff5805', 0.1),
      };

    case 'EM_ATENDIMENTO':
      return {
        label: 'Em atendimento',
        cor: '#17456B',
        fundo: alpha('#17456B', 0.1),
      };

    case 'CONCLUIDO':
      return {
        label: 'Concluído',
        cor: '#2E7D32',
        fundo: alpha('#2E7D32', 0.1),
      };

    case 'CANCELADO':
      return {
        label: 'Cancelado',
        cor: '#D32F2F',
        fundo: alpha('#D32F2F', 0.1),
      };

    default:
      return {
        label: status,
        cor: '#607D8B',
        fundo: alpha('#607D8B', 0.1),
      };
  }
}

function formatarData(data: string) {
  const dataFormatada = new Date(data);

  return {
    data: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(dataFormatada),

    hora: new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dataFormatada),
  };
}

function obterInformacao(
  solicitacao: SolicitacaoSite,
) {
  if (solicitacao.tipo === 'COTACAO') {
    return solicitacao.solucao ?? '-';
  }

  if (solicitacao.tipo === 'AGREGADO') {
    return solicitacao.cidade ?? '-';
  }

  return (
    solicitacao.empresa ??
    solicitacao.cargo ??
    solicitacao.assunto ??
    '-'
  );
}

export function SolicitacoesSiteTabela({
  solicitacoes,
}: SolicitacoesSiteTabelaProps) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        overflowX: 'auto',
        border: '1px solid',
        borderColor: alpha('#17212B', 0.08),
        borderRadius: 3,
        bgcolor: '#fff',
        boxShadow:
          '0 12px 32px rgba(23, 33, 43, 0.04)',
      }}
    >
      <Table
        sx={{
          minWidth: 950,
        }}
      >
        <TableHead>
          <TableRow
            sx={{
              bgcolor: '#F7F8F8',
            }}
          >
            <TableCell
              sx={{
                py: 2,
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Recebido em
            </TableCell>

            <TableCell
              sx={{
                py: 2,
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Solicitante
            </TableCell>

            <TableCell
              sx={{
                py: 2,
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Área
            </TableCell>

            <TableCell
              sx={{
                py: 2,
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Informação
            </TableCell>

            <TableCell
              sx={{
                py: 2,
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Status
            </TableCell>

            <TableCell
              align="right"
              sx={{
                py: 2,
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Ações
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {solicitacoes.map(
            (solicitacao) => {
              const tipo =
                obterTipoConfig(
                  solicitacao.tipo,
                );

              const status =
                obterStatusConfig(
                  solicitacao.status,
                );

              const data =
                formatarData(
                  solicitacao.criadoEm,
                );

              const IconeTipo =
                tipo.icone;

              return (
                <TableRow
                  key={solicitacao.id}
                  sx={{
                    transition:
                      'background-color 0.2s ease',

                    '&:last-child td': {
                      borderBottom: 0,
                    },

                    '&:hover': {
                      bgcolor:
                        alpha(
                          '#17456B',
                          0.025,
                        ),
                    },
                  }}
                >
                  {/* DATA */}
                  <TableCell
                    sx={{
                      py: 2.25,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          'text.primary',
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {data.data}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        color:
                          'text.secondary',
                        fontSize: 12,
                      }}
                    >
                      {data.hora}
                    </Typography>
                  </TableCell>

                  {/* SOLICITANTE */}
                  <TableCell
                    sx={{
                      py: 2.25,
                    }}
                  >
                    <Stack spacing={0.35}>
                      <Typography
                        sx={{
                          color:
                            'text.primary',
                          fontSize: 14,
                          fontWeight: 850,
                        }}
                      >
                        {
                          solicitacao.nome
                        }
                      </Typography>

                      <Typography
                        sx={{
                          color:
                            'text.secondary',
                          fontSize: 12.5,
                        }}
                      >
                        {
                          solicitacao.email
                        }
                      </Typography>

                      {solicitacao.telefone ? (
                        <Typography
                          sx={{
                            color:
                              'text.secondary',
                            fontSize: 12,
                          }}
                        >
                          {
                            solicitacao.telefone
                          }
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>

                  {/* TIPO */}
                  <TableCell
                    sx={{
                      py: 2.25,
                    }}
                  >
                    <Chip
                      icon={
                        <IconeTipo />
                      }
                      label={tipo.label}
                      size="small"
                      sx={{
                        height: 32,

                        bgcolor:
                          alpha(
                            tipo.cor,
                            0.1,
                          ),

                        color:
                          tipo.cor,

                        border:
                          '1px solid',

                        borderColor:
                          alpha(
                            tipo.cor,
                            0.14,
                          ),

                        fontWeight: 850,

                        '& .MuiChip-icon':
                          {
                            color:
                              tipo.cor,
                            fontSize: 17,
                          },

                        '& .MuiChip-label':
                          {
                            px: 1.25,
                          },
                      }}
                    />
                  </TableCell>

                  {/* INFORMAÇÃO */}
                  <TableCell
                    sx={{
                      py: 2.25,
                    }}
                  >
                    <Typography
                      sx={{
                        maxWidth: 220,
                        color:
                          'text.primary',
                        fontSize: 13.5,
                        fontWeight: 650,
                        overflow: 'hidden',
                        textOverflow:
                          'ellipsis',
                        whiteSpace:
                          'nowrap',
                      }}
                    >
                      {obterInformacao(
                        solicitacao,
                      )}
                    </Typography>
                  </TableCell>

                  {/* STATUS */}
                  <TableCell
                    sx={{
                      py: 2.25,
                    }}
                  >
                    <Chip
                      size="small"
                      label={
                        status.label
                      }
                      sx={{
                        height: 30,
                        bgcolor:
                          status.fundo,
                        color:
                          status.cor,
                        fontWeight: 850,

                        '& .MuiChip-label':
                          {
                            px: 1.3,
                          },
                      }}
                    />
                  </TableCell>

                  {/* AÇÃO */}
                  <TableCell
                    align="right"
                    sx={{
                      py: 2.25,
                    }}
                  >
                    <Button
                      component={Link}
                      href={`/solicitacoes-site/${solicitacao.id}`}
                      size="small"
                      variant="outlined"
                      endIcon={
                        <OpenInNewRoundedIcon />
                      }
                      sx={{
                        minHeight: 36,
                        px: 1.75,
                        borderRadius: 2,
                        borderColor:
                          alpha(
                            '#17456B',
                            0.2,
                          ),
                        color:
                          '#17456B',
                        fontWeight: 850,
                        textTransform:
                          'none',

                        '&:hover': {
                          borderColor:
                            '#ff5805',

                          bgcolor:
                            alpha(
                              '#ff5805',
                              0.06,
                            ),

                          color:
                            '#ff5805',
                        },
                      }}
                    >
                      Visualizar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            },
          )}

          {solicitacoes.length ===
          0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                sx={{
                  py: 8,
                  borderBottom: 0,
                }}
              >
                <Stack
                  spacing={1.5}
                  sx={{
                    alignItems:
                      'center',
                    textAlign:
                      'center',
                  }}
                >
                  <Box
                    sx={{
                      display:
                        'grid',
                      placeItems:
                        'center',

                      width: 58,
                      height: 58,

                      borderRadius:
                        '50%',

                      bgcolor:
                        alpha(
                          '#17456B',
                          0.07,
                        ),

                      color:
                        '#17456B',
                    }}
                  >
                    <InboxRoundedIcon />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color:
                          'text.primary',
                        fontSize: 16,
                        fontWeight: 850,
                      }}
                    >
                      Nenhuma solicitação encontrada
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.5,
                        color:
                          'text.secondary',
                        fontSize: 13.5,
                      }}
                    >
                      Não há registros para exibir nesta página.
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </TableContainer>
  );
}