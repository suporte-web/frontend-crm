'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { alpha } from '@mui/material/styles';

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import {
  ArrowLeft,
  Building2,
  Clock,
  Edit3,
  Mail,
  UserRoundCheck,
} from 'lucide-react';

import {
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';

import {
  formatLeadStatus,
} from '@/services/crm.service';

import type {
  LeadDetail,
} from '@/types/crm';

import {
  statusStyles,
} from './detalhes-cliente-compartilhado';

type PropriedadesCabecalhoDetalhesCliente = {
  lead: LeadDetail | null;
  loading: boolean;
  error: string;

  canEditClient?: boolean;
  onEditClient?: () => void;

  canRequestDeletion?: boolean;
  onRequestDeletion?: () => void;
};

function formatDate(
  date?: string | null,
) {
  if (!date) {
    return 'Não informado';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  ).format(new Date(date));
}

function getClientCreatedBy(
  lead: LeadDetail,
) {
  const creationEvent =
    lead.timeline?.find(
      (event) => {
        const title =
          event.title?.toLowerCase() ??
          '';

        return (
          event.type ===
            'LEAD_CREATED' ||
          title.includes(
            'cliente criado',
          ) ||
          title.includes(
            'cliente convertido',
          )
        );
      },
    );

  return (
    creationEvent?.createdBy ||
    'Não informado'
  );
}

/* =====================================================
   CARD RESUMO
===================================================== */

function HeaderSummaryItem({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  color: string;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,

        p: 2,

        borderRadius: 2.5,

        border: '1px solid',

        borderColor: alpha(
          '#17212B',
          0.07,
        ),

        bgcolor: '#F8F9FA',

        transition:
          'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',

        '&:hover': {
          transform:
            'translateY(-1px)',

          bgcolor: '#fff',

          borderColor: alpha(
            color,
            0.2,
          ),
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,

            display: 'grid',
            placeItems: 'center',

            flexShrink: 0,

            borderRadius: 2.25,

            bgcolor: alpha(
              color,
              0.1,
            ),

            color,

            '& svg': {
              width: 20,
              height: 20,
              strokeWidth: 2.2,
            },
          }}
        >
          {icon}
        </Box>

        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              color:
                'text.secondary',

              fontSize: 10.5,

              fontWeight: 900,

              lineHeight: 1.2,

              textTransform:
                'uppercase',

              letterSpacing: 0.45,
            }}
          >
            {label}
          </Typography>

          <Typography
            component="div"
            sx={{
              mt: 0.55,

              color:
                'text.primary',

              fontSize: 14,

              fontWeight: 850,

              lineHeight: 1.4,

              overflowWrap:
                'anywhere',
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

/* =====================================================
   COMPONENTE
===================================================== */

export function CabecalhoDetalhesCliente({
  lead,
  loading,
  error,

  canEditClient = false,
  onEditClient,

  canRequestDeletion = false,
  onRequestDeletion,
}: PropriedadesCabecalhoDetalhesCliente) {
  return (
    <CrmSection
      sx={{
        position: 'relative',

        overflow: 'hidden',

        p: 0,

        borderRadius: 3,

        border: '1px solid',

        borderColor: alpha(
          '#17212B',
          0.08,
        ),

        bgcolor: '#fff',

        boxShadow:
          '0 14px 38px rgba(23, 33, 43, 0.05)',

        '&::before': {
          content: '""',

          position: 'absolute',

          top: 0,
          left: 0,

          width: 5,
          height: '100%',

          bgcolor: '#ff5805',
        },
      }}
    >
      {/* LOADING */}

      {loading ? (
        <Box
          sx={{
            minHeight: 220,

            display: 'grid',

            placeItems: 'center',
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: 'center',
            }}
          >
            <CircularProgress
              size={24}
              sx={{
                color:
                  crmPalette.orange,
              }}
            />

            <Typography
              sx={{
                color:
                  'text.secondary',

                fontSize: 14,

                fontWeight: 700,
              }}
            >
              Carregando cliente...
            </Typography>
          </Stack>
        </Box>
      ) : error ? (
        /* ERRO */

        <Box
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Alert
            severity="error"
            sx={{
              borderRadius: 2.5,
            }}
          >
            {error}
          </Alert>
        </Box>
      ) : lead ? (
        <Box
          sx={{
            p: {
              xs: 2.5,
              md: 3.5,
            },
          }}
        >
          <Stack spacing={3}>
            {/* =================================================
                TOPO
            ================================================= */}

            <Stack
              direction={{
                xs: 'column',
                lg: 'row',
              }}
              spacing={2.5}
              sx={{
                alignItems: {
                  xs: 'stretch',
                  lg: 'center',
                },

                justifyContent:
                  'space-between',
              }}
            >
              {/* EMPRESA */}

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

                  minWidth: 0,
                }}
              >
                {/* AVATAR */}

                <Avatar
                  variant="rounded"
                  sx={{
                    width: {
                      xs: 76,
                      md: 86,
                    },

                    height: {
                      xs: 76,
                      md: 86,
                    },

                    flexShrink: 0,

                    borderRadius: 3,

                    bgcolor:
                      alpha(
                        '#ff5805',
                        0.09,
                      ),

                    color:
                      '#ff5805',

                    border:
                      '1px solid',

                    borderColor:
                      alpha(
                        '#ff5805',
                        0.17,
                      ),

                    fontSize: {
                      xs: 28,
                      md: 32,
                    },

                    fontWeight: 950,
                  }}
                >
                  {(lead.company ||
                    'C')
                    .slice(0, 1)
                    .toUpperCase()}
                </Avatar>

                {/* DADOS */}

                <Box
                  sx={{
                    minWidth: 0,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems:
                        'center',

                      flexWrap:
                        'wrap',

                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display:
                          'inline-flex',

                        alignItems:
                          'center',

                        gap: 0.75,

                        px: 1.25,

                        py: 0.55,

                        borderRadius:
                          999,

                        bgcolor:
                          alpha(
                            '#ff5805',
                            0.08,
                          ),

                        color:
                          '#e94f00',
                      }}
                    >
                      <Building2
                        size={14}
                      />

                      <Typography
                        sx={{
                          fontSize:
                            11,

                          fontWeight:
                            900,

                          textTransform:
                            'uppercase',

                          letterSpacing:
                            0.7,
                        }}
                      >
                        Cliente
                      </Typography>
                    </Box>

                    <Chip
                      size="small"
                      variant="outlined"
                      label={formatLeadStatus(
                        lead.status,
                      )}
                      sx={{
                        ...statusStyles[
                          lead.status
                        ],

                        height: 27,

                        borderRadius:
                          2,

                        fontSize: 11,

                        fontWeight:
                          900,
                      }}
                    />
                  </Stack>

                  <Typography
                    component="h1"
                    sx={{
                      mt: 1,

                      color:
                        'text.primary',

                      fontSize: {
                        xs: 25,
                        md: 30,
                      },

                      fontWeight:
                        950,

                      lineHeight:
                        1.12,

                      letterSpacing:
                        '-0.025em',

                      overflowWrap:
                        'anywhere',
                    }}
                  >
                    {lead.company ||
                      'Cliente'}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.75,

                      color:
                        'text.secondary',

                      fontSize:
                        13.5,

                      lineHeight:
                        1.5,

                      fontWeight:
                        650,
                    }}
                  >
                    CNPJ:{' '}
                    {lead.document ||
                      'Não informado'}
                  </Typography>
                </Box>
              </Stack>

              {/* =================================================
                  AÇÕES
              ================================================= */}

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems:
                    'center',

                  flexWrap:
                    'wrap',

                  gap: 1,
                }}
              >
                {/* VOLTAR */}

                <Tooltip title="Voltar para clientes">
                  <IconButton
                    component={Link}
                    href="/clientes"
                    aria-label="Voltar para clientes"
                    sx={{
                      width: 42,
                      height: 42,

                      borderRadius:
                        2.25,

                      border:
                        '1px solid',

                      borderColor:
                        alpha(
                          '#17212B',
                          0.12,
                        ),

                      bgcolor:
                        '#fff',

                      color:
                        '#334155',

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
                    <ArrowLeft
                      size={18}
                    />
                  </IconButton>
                </Tooltip>

                {/* EDITAR */}

                {canEditClient ? (
                  <Tooltip title="Editar cliente">
                    <IconButton
                      type="button"
                      onClick={
                        onEditClient
                      }
                      aria-label="Editar cliente"
                      sx={{
                        width: 42,
                        height: 42,

                        borderRadius:
                          2.25,

                        bgcolor:
                          '#ff5805',

                        color:
                          '#fff',

                        border:
                          '1px solid #ff5805',

                        '&:hover': {
                          bgcolor:
                            '#e94f00',

                          borderColor:
                            '#e94f00',
                        },
                      }}
                    >
                      <Edit3
                        size={18}
                      />
                    </IconButton>
                  </Tooltip>
                ) : null}

                {/* EXCLUIR */}

                {canRequestDeletion ? (
                  <Tooltip title="Excluir cliente">
                    <IconButton
                      type="button"
                      onClick={
                        onRequestDeletion
                      }
                      aria-label="Excluir cliente"
                      sx={{
                        width: 42,
                        height: 42,

                        borderRadius:
                          2.25,

                        border:
                          '1px solid',

                        borderColor:
                          alpha(
                            '#dc2626',
                            0.25,
                          ),

                        bgcolor:
                          alpha(
                            '#dc2626',
                            0.03,
                          ),

                        color:
                          '#dc2626',

                        '&:hover': {
                          borderColor:
                            '#dc2626',

                          bgcolor:
                            alpha(
                              '#dc2626',
                              0.08,
                            ),
                        },
                      }}
                    >
                      <DeleteOutlineRoundedIcon
                        fontSize="small"
                      />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </Stack>

            {/* =================================================
                RESUMO
            ================================================= */}

            <Box
              sx={{
                display: 'grid',

                gridTemplateColumns:
                  {
                    xs: '1fr',

                    md: 'repeat(3, minmax(0, 1fr))',
                  },

                gap: 1.5,
              }}
            >
              <HeaderSummaryItem
                icon={
                  <Mail size={20} />
                }
                label="Contato"
                value={
                  lead.email ||
                  lead.phone ||
                  'Não informado'
                }
                color="#17456B"
              />

              <HeaderSummaryItem
                icon={
                  <UserRoundCheck
                    size={20}
                  />
                }
                label="Responsável"
                value={getClientCreatedBy(
                  lead,
                )}
                color="#2E7D32"
              />

              <HeaderSummaryItem
                icon={
                  <Clock size={20} />
                }
                label="Última interação"
                value={formatDate(
                  lead.lastContactAt,
                )}
                color="#A35A00"
              />
            </Box>
          </Stack>
        </Box>
      ) : null}
    </CrmSection>
  );
}