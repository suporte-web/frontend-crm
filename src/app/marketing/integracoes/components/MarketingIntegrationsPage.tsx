'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  BarChart3,
  Building2,
  ExternalLink,
  LineChart,
  Megaphone,
  Plug,
} from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import {
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';
import { useAuth } from '@/context/auth-context';
import { listarIntegracoesMarketing } from '@/services/marketing-integrations.service';
import type {
  MarketingIntegration,
  MarketingIntegrationStatus,
  MarketingProvider,
} from '@/types/marketing-integrations';

const allowedRoles = new Set(['ADMIN', 'MARKETING']);

const providerDetails: Record<
  MarketingProvider,
  {
    name: string;
    description: string;
    icon: ReactNode;
  }
> = {
  GOOGLE_ANALYTICS: {
    name: 'Google Analytics 4',
    description:
      'Medição de acessos, eventos e conversões do site institucional.',
    icon: <LineChart size={22} />,
  },
  GOOGLE_ADS: {
    name: 'Google Ads',
    description:
      'Base para campanhas, conversões e públicos vindos do Google Ads.',
    icon: <BarChart3 size={22} />,
  },
  META: {
    name: 'Meta Ads',
    description:
      'Preparação para pixel, públicos e campanhas de Facebook e Instagram.',
    icon: <Megaphone size={22} />,
  },
  LINKEDIN: {
    name: 'LinkedIn Ads',
    description:
      'Preparação para campanhas B2B e conversões do LinkedIn Ads.',
    icon: <Building2 size={22} />,
  },
};

const statusDetails: Record<
  MarketingIntegrationStatus,
  {
    label: string;
    helper: string;
    color: 'default' | 'primary' | 'success' | 'error' | 'warning';
    accent: string;
    softColor: string;
  }
> = {
  NAO_CONFIGURADO: {
    label: 'Não configurado',
    helper: 'Aguardando configuração das credenciais.',
    color: 'default',
    accent: '#64748b',
    softColor: '#f8fafc',
  },
  CONECTANDO: {
    label: 'Conectando',
    helper: 'Conexão em andamento.',
    color: 'primary',
    accent: crmPalette.blue,
    softColor: '#eff6ff',
  },
  CONECTADO: {
    label: 'Conectado',
    helper: 'Integração conectada.',
    color: 'success',
    accent: crmPalette.green,
    softColor: '#ecfdf5',
  },
  ERRO: {
    label: 'Erro',
    helper: 'Verifique a última mensagem de erro.',
    color: 'error',
    accent: crmPalette.red,
    softColor: '#fef2f2',
  },
  EXPIRADO: {
    label: 'Expirado',
    helper: 'A conexão precisa ser renovada.',
    color: 'warning',
    accent: '#b45309',
    softColor: '#fffbeb',
  },
};

const expectedProviders: MarketingProvider[] = [
  'GOOGLE_ANALYTICS',
  'GOOGLE_ADS',
  'META',
  'LINKEDIN',
];

function formatDate(date?: string | null) {
  if (!date) {
    return 'Nunca sincronizado';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function buildFallbackIntegration(
  provider: MarketingProvider,
): MarketingIntegration {
  return {
    id: null,
    provider,
    status: 'NAO_CONFIGURADO',
    accountId: null,
    accountName: null,
    expiresAt: null,
    metadata: null,
    lastSyncAt: null,
    lastError: null,
    ativo: false,
    createdAt: null,
    updatedAt: null,
  };
}

export default function MarketingIntegrationsPage() {
  const { token, user } = useAuth();
  const [integrations, setIntegrations] = useState<MarketingIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const isAllowed = user?.role ? allowedRoles.has(user.role) : false;

  useEffect(() => {
    let active = true;

    async function loadIntegrations() {
      if (!isAllowed) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setPageError('');

        const data = await listarIntegracoesMarketing(token);

        if (active) {
          setIntegrations(data);
        }
      } catch (error) {
        if (active) {
          setPageError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as integrações.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadIntegrations();

    return () => {
      active = false;
    };
  }, [isAllowed, token]);

  const cards = useMemo(() => {
    const byProvider = new Map(
      integrations.map((integration) => [
        integration.provider,
        integration,
      ]),
    );

    return expectedProviders.map(
      (provider) => byProvider.get(provider) ?? buildFallbackIntegration(provider),
    );
  }, [integrations]);

  if (!isAllowed) {
    return (
      <AppLayout>
        <Alert severity="warning">
          Esta área é restrita aos perfis de Marketing e Administração.
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Marketing"
          title="Integrações de Marketing"
          description="Prepare e acompanhe conexões com plataformas de mídia e mensuração. As credenciais reais ainda não estão configuradas."
          icon={<Plug size={24} />}
        />

        {pageError ? <Alert severity="error">{pageError}</Alert> : null}

        <CrmSection sx={{ p: { xs: 2, md: 3 } }}>
          {loading ? (
            <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  lg: 'repeat(2, minmax(0, 1fr))',
                },
              }}
            >
              {cards.map((integration) => {
                const provider = providerDetails[integration.provider];
                const status = statusDetails[integration.status];

                return (
                  <Paper
                    key={integration.provider}
                    elevation={0}
                    sx={{
                      minHeight: 300,
                      p: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '14px',
                      bgcolor: '#fff',
                    }}
                  >
                    <Stack spacing={2.5} sx={{ height: '100%' }}>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Stack direction="row" spacing={1.5}>
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                              borderRadius: '12px',
                              bgcolor: status.softColor,
                              color: status.accent,
                              border: `1px solid ${status.accent}22`,
                            }}
                          >
                            {provider.icon}
                          </Box>

                          <Box>
                            <Typography
                              component="h2"
                              sx={{ fontSize: 20, fontWeight: 900 }}
                            >
                              {provider.name}
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.75,
                                color: 'text.secondary',
                                fontSize: 14,
                                lineHeight: 1.55,
                              }}
                            >
                              {provider.description}
                            </Typography>
                          </Box>
                        </Stack>

                        <Chip
                          label={status.label}
                          color={status.color}
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />
                      </Stack>

                      <Box
                        sx={{
                          display: 'grid',
                          gap: 1.5,
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, minmax(0, 1fr))',
                          },
                        }}
                      >
                        <InfoBlock
                          label="Conta conectada"
                          value={
                            integration.accountName ||
                            integration.accountId ||
                            'Nenhuma conta conectada'
                          }
                        />
                        <InfoBlock
                          label="Última sincronização"
                          value={formatDate(integration.lastSyncAt)}
                        />
                      </Box>

                      {integration.lastError ? (
                        <Alert severity="error">{integration.lastError}</Alert>
                      ) : (
                        <Alert severity="info">{status.helper}</Alert>
                      )}

                      <Box sx={{ flexGrow: 1 }} />

                      <Button
                        type="button"
                        variant="outlined"
                        disabled
                        startIcon={<ExternalLink size={17} />}
                        sx={{
                          alignSelf: 'flex-start',
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 800,
                        }}
                      >
                        Configurar em breve
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          )}
        </CrmSection>
      </CrmPageShell>
    </AppLayout>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '10px',
        bgcolor: '#f8fafc',
      }}
    >
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: 12,
          fontWeight: 800,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ mt: 0.75, fontSize: 14, fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
  );
}
