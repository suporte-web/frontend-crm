'use client';

import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { alpha } from '@mui/material/styles';

import {
  Badge,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Tag,
  UserRound,
} from 'lucide-react';

import {
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';

import {
  formatLeadStatus,
} from '@/services/crm.service';

import {
  CabecalhoSecao,
  formatarData,
  statusStyles,
} from './detalhes-cliente-compartilhado';

import type {
  PropriedadesAbaDetalhesCliente,
} from './detalhes-cliente-compartilhado';

function emptyToNotInformed(
  value?: string | null,
) {
  return (
    value?.trim() ||
    'Não informado'
  );
}

/* =====================================================
   CAMPO INDIVIDUAL
===================================================== */

function DetailField({
  icon,
  label,
  value,
  color = '#17456B',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  color?: string;
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
          0.06,
        ),

        bgcolor: '#F8F9FA',

        transition:
          'border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease',

        '&:hover': {
          bgcolor: '#fff',

          borderColor: alpha(
            color,
            0.2,
          ),

          transform:
            'translateY(-1px)',
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: 'flex-start',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,

            flexShrink: 0,

            display: 'grid',

            placeItems: 'center',

            borderRadius: 2,

            bgcolor: alpha(
              color,
              0.09,
            ),

            color,

            '& svg': {
              width: 18,
              height: 18,
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

              lineHeight: 1.2,

              fontWeight: 900,

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

              lineHeight: 1.45,

              fontWeight: 800,

              overflowWrap:
                'anywhere',
            }}
          >
            {value || 'Não informado'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

/* =====================================================
   CARD DE SEÇÃO
===================================================== */

function DetailSection({
  icon,
  title,
  description,
  color,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',

        p: {
          xs: 2.25,
          md: 2.75,
        },

        borderRadius: 3,

        border: '1px solid',

        borderColor: alpha(
          '#17212B',
          0.08,
        ),

        bgcolor: '#fff',

        boxShadow:
          '0 10px 30px rgba(23, 33, 43, 0.035)',
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
            width: 46,
            height: 46,

            flexShrink: 0,

            display: 'grid',

            placeItems: 'center',

            borderRadius: 2.5,

            bgcolor: alpha(
              color,
              0.1,
            ),

            color,

            '& svg': {
              width: 22,
              height: 22,
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
            component="h3"
            sx={{
              color:
                'text.primary',

              fontSize: 17,

              lineHeight: 1.25,

              fontWeight: 900,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 0.25,

              color:
                'text.secondary',

              fontSize: 12.5,

              lineHeight: 1.45,
            }}
          >
            {description}
          </Typography>
        </Box>
      </Stack>

      <Divider
        sx={{
          my: 2.25,
        }}
      />

      {children}
    </Paper>
  );
}

/* =====================================================
   COMPONENTE
===================================================== */

export function AbaVisaoGeralCliente(
  props: PropriedadesAbaDetalhesCliente,
) {
  const {
    currentLead,
  } = props;

  const registrationDate =
    formatarData(
      currentLead.registrationDate ??
        currentLead.createdAt,
    );

  return (
    <CrmSection
      sx={{
        p: {
          xs: 2,
          md: 2.5,
        },

        borderRadius: 3,

        border: `1px solid ${crmPalette.border}`,

        bgcolor: '#F8F9FA',

        boxShadow:
          '0 8px 24px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Stack spacing={3}>
        {/* CABEÇALHO */}

        <CabecalhoSecao
          title="Resumo do cliente"
          description="Informações cadastrais, contato e situação atual do cliente."
        />

        {/* =================================================
            IDENTIFICAÇÃO + CONTATO
        ================================================= */}

        <Box
          sx={{
            display: 'grid',

            gridTemplateColumns: {
              xs: '1fr',
              xl: 'repeat(2, minmax(0, 1fr))',
            },

            gap: 2.5,

            alignItems: 'stretch',
          }}
        >
          {/* IDENTIFICAÇÃO */}

          <DetailSection
            icon={<IdCard />}
            title="Identificação"
            description="Dados cadastrais e empresariais"
            color="#ff5805"
          >
            <Box
              sx={{
                display: 'grid',

                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                },

                gap: 1.5,
              }}
            >
              <DetailField
                icon={<Building2 />}
                label="Empresa"
                value={emptyToNotInformed(
                  currentLead.company,
                )}
                color="#ff5805"
              />

              <DetailField
                icon={<ClipboardList />}
                label="CNPJ"
                value={emptyToNotInformed(
                  currentLead.document,
                )}
                color="#ff5805"
              />

              <DetailField
                icon={<Badge />}
                label="Razão social"
                value={emptyToNotInformed(
                  currentLead.legalName,
                )}
                color="#ff5805"
              />

              <DetailField
                icon={<UserRound />}
                label="Nome fantasia"
                value={emptyToNotInformed(
                  currentLead.tradeName,
                )}
                color="#ff5805"
              />

              <Box
                sx={{
                  gridColumn: {
                    xs: 'auto',
                    sm: '1 / -1',
                  },
                }}
              >
                <DetailField
                  icon={<Tag />}
                  label="Segmento"
                  value={emptyToNotInformed(
                    currentLead.segment,
                  )}
                  color="#ff5805"
                />
              </Box>
            </Box>
          </DetailSection>

          {/* CONTATO */}

          <DetailSection
            icon={<Phone />}
            title="Contato e localização"
            description="Canais de contato e localização do cliente"
            color="#17456B"
          >
            <Box
              sx={{
                display: 'grid',

                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                },

                gap: 1.5,
              }}
            >
              <DetailField
                icon={<Phone />}
                label="Telefone"
                value={emptyToNotInformed(
                  currentLead.phone,
                )}
                color="#17456B"
              />

              <DetailField
                icon={<Mail />}
                label="E-mail"
                value={emptyToNotInformed(
                  currentLead.email,
                )}
                color="#17456B"
              />

              <Box
                sx={{
                  gridColumn: {
                    xs: 'auto',
                    sm: '1 / -1',
                  },
                }}
              >
                <DetailField
                  icon={<MapPin />}
                  label="Cidade"
                  value={emptyToNotInformed(
                    currentLead.city,
                  )}
                  color="#17456B"
                />
              </Box>
            </Box>
          </DetailSection>
        </Box>

        {/* =================================================
            CADASTRO / SITUAÇÃO
        ================================================= */}

        <DetailSection
          icon={<CalendarDays />}
          title="Cadastro e situação"
          description="Informações de registro e estágio atual do cliente"
          color="#2E7D32"
        >
          <Box
            sx={{
              display: 'grid',

              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },

              gap: 1.5,
            }}
          >
            <DetailField
              icon={<CalendarDays />}
              label="Data do cadastro"
              value={registrationDate}
              color="#2E7D32"
            />

            <DetailField
              icon={<CheckCircle2 />}
              label="Status"
              color="#2E7D32"
              value={
                <Chip
                  label={formatLeadStatus(
                    currentLead.status,
                  )}
                  size="small"
                  variant="outlined"
                  sx={{
                    ...statusStyles[
                      currentLead.status
                    ],

                    width: 'fit-content',

                    minWidth: 86,

                    height: 28,

                    borderRadius: 2,

                    fontSize: 11,

                    fontWeight: 900,
                  }}
                />
              }
            />
          </Box>
        </DetailSection>
      </Stack>
    </CrmSection>
  );
}