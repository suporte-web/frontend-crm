'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';


import { RefreshCcw } from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import {
  LEAD_FUNNEL_STAGES,
  getLeadFunnelStageLabel,
  normalizeLeadFunnelStage,
} from '@/constants/lead-funnel';
import { useAuth } from '@/context/auth-context';
import { getCrmDashboardSummary } from '@/services/crm.service';
import { getLeads } from '@/services/leads.service';
import type { CrmDashboardSummary } from '@/types/crm';
import type { Lead } from '@/types/leads';

const colors = {
  page: '#ffffff',
  panel: '#ffffff',
  panelAlt: '#fafafa',

  border: '#e5e7eb',

  yellow: '#ffb71b',
  yellowSoft: '#fff7df',

  orange: '#ff5805',
  orangeSoft: '#fff0e8',

  red: '#f23f35',
  redSoft: '#fff0ef',

  green: '#22c55e',
  greenSoft: '#ecfdf3',
  greenText: '#15803d',

  text: '#1f2937',
  muted: '#64748b',

  shadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
};

const visibleLeadSources = new Set(['manual', 'site']);

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return 0;

  const parsed =
    typeof value === 'number'
      ? value
      : Number(value.replace(/[^\d,.-]/g, '').replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatNumber(value: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR').format(toNumber(value));
}

function formatPercent(value: number | string | null | undefined) {
  return `${toNumber(value).toFixed(1).replace('.', ',')}%`;
}

function formatDateOnly(value?: string | null) {
  if (!value) return '-';

  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoDate) {
    return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR').format(parsed);
}

function parseDate(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysSince(value?: string | null) {
  const parsed = parseDate(value);

  if (!parsed) return null;

  return Math.max(
    0,
    Math.floor((Date.now() - parsed.getTime()) / 86_400_000),
  );
}

function average(values: Array<number | null>) {
  const validValues = values.filter(
    (value): value is number => value !== null,
  );

  if (validValues.length === 0) {
    return 0;
  }

  return Math.round(
    validValues.reduce((total, value) => total + value, 0) /
    validValues.length,
  );
}

function metadataValue(lead: Lead, key: string) {
  const metadata = lead.metadata;

  if (
    !metadata ||
    Array.isArray(metadata) ||
    typeof metadata !== 'object'
  ) {
    return '';
  }

  const value = metadata[key];

  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function leadName(lead: Lead) {
  return lead.company || lead.name || 'Lead sem nome';
}

function leadVolume(lead: Lead) {
  return toNumber(metadataValue(lead, 'monthlyEstimatedValue'));
}

function entryDate(lead: Lead) {
  return metadataValue(lead, 'entryDate') || lead.createdAt;
}

function lastInteractionDate(lead: Lead) {
  return (
    metadataValue(lead, 'lastInteractionDate') ||
    lead.lastInteractionAt ||
    lead.updatedAt
  );
}

function SummaryBox({
  label,
  value,
  valueColor = colors.orange,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Box
      sx={{
        p: 2,
        minHeight: 104,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        bgcolor: colors.panel,
        boxShadow: '0 12px 30px rgba(15,23,42,0.04)',
      }}
    >
      <Typography
        sx={{
          color: colors.muted,
          fontSize: 13,
          fontWeight: 900,
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: valueColor,
          fontSize: 28,
          fontWeight: 950,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
function MetricCard({
  title,
  value,
  helper,
  icon,
  accent,
  softAccent,
  progress,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  accent: string;
  softAccent: string;
  progress?: number;
}) {
  const safeProgress =
    progress === undefined
      ? undefined
      : Math.min(100, Math.max(0, progress));

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',

        p: 2,

        minHeight: 145,

        border: `1px solid ${colors.border}`,
        borderRadius: '18px',

        bgcolor: '#ffffff',

        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',

        overflow: 'hidden',

        transition:
          'transform 0.2s ease, box-shadow 0.2s ease',

        /* LINHA COLORIDA NO TOPO */
        '&::before': {
          content: '""',

          position: 'absolute',

          top: 0,
          left: 0,
          right: 0,

          height: '4px',

          bgcolor: accent,
        },

        '&:hover': {
          transform: 'translateY(-3px)',

          boxShadow:
            '0 14px 35px rgba(15, 23, 42, 0.10)',
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
        {/* ÍCONE */}

        <Box
          sx={{
            width: 50,
            height: 50,

            flexShrink: 0,

            display: 'grid',
            placeItems: 'center',

            borderRadius: '14px',

            bgcolor: softAccent,
            color: accent,
          }}
        >
          {icon}
        </Box>

        {/* TÍTULO E VALOR */}

        <Box
          sx={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <Typography
            sx={{
              color: colors.muted,

              fontSize: 13.5,
              fontWeight: 800,

              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 0.45,

              color: colors.text,

              fontSize: 30,
              fontWeight: 950,

              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>

      {/* TEXTO AUXILIAR */}

      <Typography
        sx={{
          mt: 1.5,

          color: accent,

          fontSize: 12.5,
          fontWeight: 800,
        }}
      >
        {helper}
      </Typography>

      {/* BARRA */}

      {safeProgress !== undefined ? (
        <Box
          sx={{
            mt: 1,

            width: '100%',
            height: 5,

            borderRadius: '999px',

            bgcolor: softAccent,

            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${safeProgress}%`,
              height: '100%',

              borderRadius: '999px',

              bgcolor: accent,

              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      ) : null}
    </Paper>
  );
}

export default function BusinessIntelligencePage() {
  const { token, user, loading: authLoading } = useAuth();

  const [summary, setSummary] =
    useState<CrmDashboardSummary | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);

  const canViewPage =
    user?.role &&
    ['ADMIN', 'GESTAO', 'COMERCIAL'].includes(user.role);

  useEffect(() => {
    if (authLoading || !token || !canViewPage) {
      setLoading(false);
      return;
    }

    let active = true;

    const authToken = token;

    async function loadData() {
      setLoading(true);
      setErrorMessage('');

      try {
        const [summaryData, leadData] = await Promise.all([
          getCrmDashboardSummary(authToken),
          getLeads(authToken),
        ]);

        if (!active) return;

        setSummary(summaryData);
        setLeads(leadData);
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar BI comercial.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [authLoading, canViewPage, refreshKey, token]);

  const commercialLeads = useMemo(
    () =>
      leads.filter((lead) =>
        visibleLeadSources.has(String(lead.source)),
      ),
    [leads],
  );

  const funnelRows = useMemo(() => {
    const total = Math.max(commercialLeads.length, 1);

    return LEAD_FUNNEL_STAGES.filter(
      (stage) => stage.value !== 'perdido',
    ).map((stage) => {
      const stageLeads = commercialLeads.filter(
        (lead) =>
          normalizeLeadFunnelStage(lead.status) === stage.value,
      );

      const volume = stageLeads.reduce(
        (sum, lead) => sum + leadVolume(lead),
        0,
      );

      const percent = (stageLeads.length / total) * 100;

      return {
        ...stage,
        count: stageLeads.length,
        volume,
        percent,
        clients: stageLeads.map(leadName).join(', ') || '-',

        averageStageDays: average(
          stageLeads.map((lead) =>
            daysSince(entryDate(lead)),
          ),
        ),

        averageLastContactDays: average(
          stageLeads.map((lead) =>
            daysSince(lastInteractionDate(lead)),
          ),
        ),
      };
    });
  }, [commercialLeads]);

  const detailRows = useMemo(
    () =>
      [...commercialLeads].sort((left, right) => {
        const leftStage = LEAD_FUNNEL_STAGES.findIndex(
          (stage) =>
            stage.value ===
            normalizeLeadFunnelStage(left.status),
        );

        const rightStage = LEAD_FUNNEL_STAGES.findIndex(
          (stage) =>
            stage.value ===
            normalizeLeadFunnelStage(right.status),
        );

        if (leftStage !== rightStage) {
          return leftStage - rightStage;
        }

        return leadName(left).localeCompare(
          leadName(right),
          'pt-BR',
        );
      }),
    [commercialLeads],
  );

  const totalLeads = funnelRows.reduce(
    (total, row) => total + row.count,
    0,
  );

  const totalVolume = funnelRows.reduce(
    (total, row) => total + row.volume,
    0,
  );

  const averageStageDays = average(
    funnelRows.map((row) => row.averageStageDays),
  );

  const averageLastContactDays = average(
    funnelRows.map((row) => row.averageLastContactDays),
  );

  const posVendaCount =
    funnelRows.find((row) => row.value === 'pos_venda')
      ?.count ?? 0;

  const vendaEfetivadaCount =
    funnelRows.find(
      (row) => row.value === 'venda_efetivada',
    )?.count ?? 0;

  // cALCULO DE CARDS

  const vendaEfetivadaRate =
    totalLeads > 0
      ? (vendaEfetivadaCount / totalLeads) * 100
      : 0;

  /* =========================================================
     INDICADORES PRINCIPAIS
     ========================================================= */

  const activeLeadCount = commercialLeads.filter((lead) => {
    const stage = normalizeLeadFunnelStage(lead.status);

    return ![
      'perdido',
      'venda_efetivada',
      'pos_venda',
    ].includes(stage);
  }).length;

  /*
    Procuramos dentro das etapas do funil uma etapa
    que tenha "contato" no nome.
  */
  const contactCount =
    funnelRows.find((row) =>
      row.label
        .toLocaleLowerCase('pt-BR')
        .includes('contato'),
    )?.count ?? 0;

  /*
    O mesmo para homologação.
    Usamos "homologa" porque funciona com
    "Homologação", "Em Homologação" etc.
  */
  const homologationCount =
    funnelRows.find((row) =>
      row.label
        .toLocaleLowerCase('pt-BR')
        .includes('homologa'),
    )?.count ?? 0;

  /*
    Consideramos convertidos quem chegou em
    Venda Efetivada ou Pós-venda.
  */
  const convertedCount =
    vendaEfetivadaCount + posVendaCount;

  /*
    Conta quantos leads possuem uma próxima ação cadastrada.
  */
  const nextActionCount = commercialLeads.filter((lead) => {
    return (
      metadataValue(lead, 'nextAction').trim().length > 0
    );
  }).length;

  /*
    Função auxiliar para calcular porcentagem do funil.
  */
  function percentageOfTotal(value: number) {
    if (totalLeads === 0) {
      return 0;
    }

    return (value / totalLeads) * 100;
  }

  const contactPercent =
    percentageOfTotal(contactCount);

  const homologationPercent =
    percentageOfTotal(homologationCount);

  const convertedPercent =
    percentageOfTotal(convertedCount);

  const nextActionPercent =
    percentageOfTotal(nextActionCount);

  const maxCount = Math.max(


    1,
    ...funnelRows.map((row) => row.count),
  );

  if (!authLoading && !canViewPage) {
    return (
      <AppLayout>
        <Alert severity="warning">
          Você não tem permissão para acessar o BI comercial.
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Paper
        elevation={0}
        sx={{
          minHeight: 'calc(100vh - 96px)',
          p: {
            xs: 2,
            lg: 2.5,
          },
          border: '0',
          borderRadius: '22px',
          bgcolor: colors.page,
          color: colors.text,
        }}
      >
        {/* CABEÇALHO */}

        <Stack
          direction={{
            xs: 'column',
            md: 'row',
          }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: {
              xs: 'flex-start',
              md: 'center',
            },
            mb: 2,
            p: {
              xs: 2,
              md: 2.5,
            },
            border: `1px solid ${colors.border}`,
            borderRadius: '18px',
            bgcolor: colors.panel,
            boxShadow: colors.shadow,
          }}
        >
          <Box>
            <Typography
              sx={{
                display: 'inline-flex',
                px: 1.25,
                py: 0.5,
                borderRadius: '999px',
                bgcolor: colors.orangeSoft,
                color: colors.orange,
                fontSize: 11,
                fontWeight: 950,
                letterSpacing: 1.3,
                textTransform: 'uppercase',
              }}
            >
              BI Comercial
            </Typography>

            <Typography
              component="h1"
              sx={{
                mt: 1.25,
                fontSize: {
                  xs: 28,
                  md: 34,
                },
                fontWeight: 950,
                lineHeight: 1,
              }}
            >
              Resumo do Funil
            </Typography>

            <Typography
              sx={{
                mt: 0.75,
                color: colors.muted,
                fontSize: 15,
              }}
            >
              Atualiza automaticamente conforme os leads manuais
              e do site são preenchidos.
            </Typography>
          </Box>

          <Button
            type="button"
            onClick={() =>
              setRefreshKey((current) => current + 1)
            }
            variant="outlined"
            startIcon={<RefreshCcw size={16} />}
            sx={{
              minHeight: 42,
              borderColor: colors.border,
              color: colors.text,
              borderRadius: '12px',
              fontWeight: 900,
              textTransform: 'none',

              '&:hover': {
                borderColor: colors.orange,
                bgcolor: colors.orangeSoft,
              },
            }}
          >
            Atualizar
          </Button>
        </Stack>

        {errorMessage ? (
          <Alert
            severity="error"
            sx={{
              mb: 2,
            }}
          >
            {errorMessage}
          </Alert>
        ) : null}

        {loading ? (
          <Box
            sx={{
              minHeight: 420,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <CircularProgress
              sx={{
                color: colors.orange,
              }}
            />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {/* =====================================================
        CARDS PRINCIPAIS
       ===================================================== */}

            <Box
              sx={{
                display: 'grid',
                gap: 1.5,

                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                  xl: 'repeat(5, minmax(0, 1fr))',
                },
              }}
            >
              {/* LEADS ATIVOS */}

              <MetricCard
                title="Leads Ativos"
                value={activeLeadCount}
                helper="Oportunidades em andamento"
                icon={
                  <GroupsRoundedIcon
                    sx={{
                      fontSize: 28,
                    }}
                  />
                }
                accent={colors.orange}
                softAccent={colors.orangeSoft}
              />

              {/* EM CONTATO */}

              <MetricCard
                title="Em Contato"
                value={contactCount}
                helper={`${formatPercent(
                  contactPercent,
                )} do funil`}
                progress={contactPercent}
                icon={
                  <TrackChangesRoundedIcon
                    sx={{
                      fontSize: 28,
                    }}
                  />
                }
                accent={colors.yellow}
                softAccent={colors.yellowSoft}
              />

              {/* HOMOLOGAÇÃO */}

              <MetricCard
                title="Em Homologação"
                value={homologationCount}
                helper={`${formatPercent(
                  homologationPercent,
                )} do funil`}
                progress={homologationPercent}
                icon={
                  <FactCheckRoundedIcon
                    sx={{
                      fontSize: 28,
                    }}
                  />
                }
                accent={colors.red}
                softAccent={colors.redSoft}
              />

              {/* CONVERTIDOS */}
              <MetricCard
                title="Convertidos"
                value={convertedCount}
                helper={`${formatPercent(
                  convertedPercent,
                )} do funil`}
                progress={convertedPercent}
                icon={
                  <TaskAltRoundedIcon
                    sx={{
                      fontSize: 28,
                    }}
                  />
                }
                accent={colors.green}
                softAccent={colors.greenSoft}
              />

              {/* PRÓXIMAS AÇÕES */}

              <MetricCard
                title="Próximas Ações"
                value={nextActionCount}
                helper="Leads com ação cadastrada"
                progress={nextActionPercent}
                icon={
                  <ScheduleRoundedIcon
                    sx={{
                      fontSize: 28,
                    }}
                  />
                }
                accent="#f43f5e"
                softAccent="#ffe4e6"
              />
            </Box>

            {/* TABELA DO FUNIL */}

            <Paper
              elevation={0}
              sx={{
                p: {
                  xs: 1.5,
                  md: 2,
                },
                border: `1px solid ${colors.border}`,
                borderRadius: '18px',
                bgcolor: colors.panel,
                boxShadow: colors.shadow,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  overflowX: 'auto',
                }}
              >
                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    minWidth: 1280,
                    borderCollapse: 'collapse',
                  }}
                >
                  <Box component="thead">
                    <Box
                      component="tr"
                      sx={{
                        bgcolor: colors.orange,
                      }}
                    >
                      {[
                        'Etapa',
                        'Nº de Leads/Clientes',
                        'Volume Mensal Estimado (R$)',
                        '% do Total',
                        'Clientes',
                        'Tempo Médio na Etapa (dias)',
                        'Tempo Médio desde Último Contato (dias)',
                      ].map((heading) => (
                        <Box
                          key={heading}
                          component="th"
                          sx={{
                            px: 1.5,
                            py: 1.15,
                            color: '#ffffff',
                            fontSize: 14,
                            fontWeight: 950,
                            textAlign: 'left',
                            borderBottom: `1px solid ${colors.orange}`,
                          }}
                        >
                          {heading}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Box component="tbody">
                    {funnelRows.map((row, index) => (
                      <Box
                        key={row.value}
                        component="tr"
                        sx={{
                          bgcolor:
                            index % 2 === 0
                              ? colors.panel
                              : colors.panelAlt,
                        }}
                      >
                        <Box
                          component="td"
                          sx={{
                            px: 1.5,
                            py: 1.25,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            fontSize: 14,
                            fontWeight: 900,
                          }}
                        >
                          {row.label}
                        </Box>

                        <Box
                          component="td"
                          sx={{
                            px: 1.5,
                            py: 1.25,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            fontSize: 14,
                            fontWeight: 900,
                            textAlign: 'center',
                          }}
                        >
                          {row.count}
                        </Box>

                        <Box
                          component="td"
                          sx={{
                            px: 1.5,
                            py: 1.25,
                            border: `1px solid ${colors.border}`,
                            color: colors.orange,
                            fontSize: 14,
                            fontWeight: 900,
                            textAlign: 'right',
                          }}
                        >
                          {formatCurrency(row.volume)}
                        </Box>

                        <Box
                          component="td"
                          sx={{
                            px: 0,
                            py: 0,
                            border: `1px solid ${colors.border}`,
                            minWidth: 190,
                          }}
                        >
                          <Stack
                            direction="row"
                            sx={{
                              alignItems: 'center',
                              height: 44,
                            }}
                          >
                            <Box
                              sx={{
                                width: `${Math.max(
                                  4,
                                  row.percent,
                                )}%`,
                                height: '100%',
                                bgcolor:
                                  colors.orangeSoft,
                                borderRight: `3px solid ${colors.orange}`,
                              }}
                            />

                            <Typography
                              sx={{
                                ml: 1,
                                color: colors.text,
                                fontSize: 13,
                                fontWeight: 950,
                              }}
                            >
                              {formatPercent(row.percent)}
                            </Typography>
                          </Stack>
                        </Box>

                        <Box
                          component="td"
                          sx={{
                            px: 1.5,
                            py: 1.25,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            fontSize: 13,
                            textAlign: 'center',
                          }}
                        >
                          {row.clients}
                        </Box>

                        <Box
                          component="td"
                          sx={{
                            px: 1.5,
                            py: 1.25,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            fontSize: 14,
                            fontWeight: 900,
                            textAlign: 'center',
                          }}
                        >
                          {row.averageStageDays} dias
                        </Box>

                        <Box
                          component="td"
                          sx={{
                            px: 1.5,
                            py: 1.25,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            fontSize: 14,
                            fontWeight: 900,
                            textAlign: 'center',
                          }}
                        >
                          {row.averageLastContactDays} dias
                        </Box>
                      </Box>
                    ))}

                    {/* TOTAL */}

                    <Box
                      component="tr"
                      sx={{
                        bgcolor: '#dcfce7',
                      }}
                    >
                      <Box
                        component="td"
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          color: colors.greenText,
                          fontSize: 15,
                          fontWeight: 950,
                        }}
                      >
                        Total
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          color: colors.greenText,
                          fontSize: 15,
                          fontWeight: 950,
                          textAlign: 'center',
                        }}
                      >
                        {totalLeads}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          color: colors.greenText,
                          fontSize: 15,
                          fontWeight: 950,
                          textAlign: 'right',
                        }}
                      >
                        {formatCurrency(totalVolume)}
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          color: colors.greenText,
                          fontSize: 15,
                          fontWeight: 950,
                        }}
                      >
                        100,0%
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          px: 1.5,
                          py: 1.25,
                        }}
                      />

                      <Box
                        component="td"
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          color: colors.greenText,
                          fontSize: 15,
                          fontWeight: 950,
                          textAlign: 'center',
                        }}
                      >
                        {averageStageDays} dias
                      </Box>

                      <Box
                        component="td"
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          color: colors.greenText,
                          fontSize: 15,
                          fontWeight: 950,
                          textAlign: 'center',
                        }}
                      >
                        {averageLastContactDays} dias
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* RESUMO + GRÁFICO */}

            <Box
              sx={{
                display: 'grid',
                gap: 3,

                gridTemplateColumns: {
                  xs: '1fr',
                  xl: '0.58fr 0.42fr',
                },
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',

                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '1fr 1fr',
                    },

                    gap: 1.5,
                  }}
                >
                  <SummaryBox
                    label="Total de Leads/Clientes"
                    value={formatNumber(totalLeads)}
                  />

                  <SummaryBox
                    label="Volume Mensal Total (R$)"
                    value={formatCurrency(totalVolume)}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'grid',

                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '1fr 1fr',
                    },

                    gap: 1.5,
                  }}
                >
                  <SummaryBox
                    label="Taxa - Venda Efetivada"
                    value={formatPercent(
                      vendaEfetivadaRate,
                    )}
                    valueColor={colors.greenText}
                  />

                  <SummaryBox
                    label="Clientes em Pós-venda"
                    value={formatNumber(posVendaCount)}
                    valueColor={colors.greenText}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'grid',

                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '1fr 1fr',
                    },

                    gap: 1.5,
                  }}
                >
                  <SummaryBox
                    label="Tempo Médio na Etapa (dias)"
                    value={`${averageStageDays} dias`}
                  />

                  <SummaryBox
                    label="Tempo Médio desde Último Contato (dias)"
                    value={`${averageLastContactDays} dias`}
                    valueColor={colors.greenText}
                  />
                </Box>
              </Box>

              {/* GRÁFICO */}

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '16px',
                  bgcolor: colors.panel,
                  boxShadow: colors.shadow,
                  minHeight: 260,
                }}
              >
                <Typography
                  sx={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: 950,
                    textAlign: 'center',
                  }}
                >
                  Leads e Clientes por Etapa
                </Typography>

                <Box
                  sx={{
                    mt: 2.5,
                    height: 170,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${funnelRows.length}, minmax(72px, 1fr))`,
                    alignItems: 'end',
                    gap: 2,
                    borderLeft: `1px solid ${colors.border}`,
                    borderBottom: `1px solid ${colors.border}`,
                    px: 2,
                    pt: 1,
                    bgcolor: '#fbfdff',
                    borderRadius: '14px',
                  }}
                >
                  {funnelRows.map((row) => (
                    <Stack
                      key={row.value}
                      spacing={0.75}
                      sx={{
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                      }}
                    >
                      <Typography
                        sx={{
                          color: colors.text,
                          fontSize: 12,
                          fontWeight: 950,
                        }}
                      >
                        {row.count}
                      </Typography>

                      <Box
                        sx={{
                          width: '70%',

                          minHeight:
                            row.count > 0 ? 18 : 4,

                          height: `${Math.max(
                            4,
                            (row.count / maxCount) * 132,
                          )}px`,

                          bgcolor: colors.orange,

                          borderRadius:
                            '8px 8px 0 0',
                        }}
                      />
                    </Stack>
                  ))}
                </Box>

                <Box
                  sx={{
                    mt: 1,
                    display: 'grid',

                    gridTemplateColumns: `repeat(${funnelRows.length}, minmax(72px, 1fr))`,

                    gap: 2,
                    px: 2,
                  }}
                >
                  {funnelRows.map((row) => (
                    <Typography
                      key={row.value}
                      sx={{
                        color: colors.muted,
                        fontSize: 12,
                        fontWeight: 800,
                        textAlign: 'center',
                        lineHeight: 1.2,
                      }}
                    >
                      {row.label}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* LISTAGEM DOS LEADS */}

            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: `1px solid ${colors.border}`,
                borderRadius: '18px',
                bgcolor: colors.panel,
                boxShadow: colors.shadow,
              }}
            >
              <Typography
                sx={{
                  mb: 1.5,
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: 950,
                }}
              >
                Leads e Clientes no Funil
              </Typography>

              <Box
                sx={{
                  overflowX: 'auto',
                }}
              >
                <Box
                  component="table"
                  sx={{
                    width: '100%',
                    minWidth: 1320,
                    borderCollapse: 'collapse',
                  }}
                >
                  <Box component="thead">
                    <Box
                      component="tr"
                      sx={{
                        bgcolor: '#f8fafc',
                        borderBottom: `2px solid ${colors.orange}`,
                      }}
                    >
                      {[
                        'Nome',
                        'Logo',
                        'Segmento',
                        'Transporte',
                        'Armazenagem',
                        'Etapa no Funil',
                        'Data de Entrada',
                        'Última Interação',
                        'Volume Mensal Estimado (R$)',
                        'Responsável',
                        'Status atual',
                        'Próxima Ação',
                        'Observações',
                      ].map((heading) => (
                        <Box
                          key={heading}
                          component="th"
                          sx={{
                            px: 1,
                            py: 1,
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 950,
                            textAlign: 'left',
                          }}
                        >
                          {heading}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Box component="tbody">
                    {detailRows.map((lead, index) => {
                      const logoUrl = metadataValue(
                        lead,
                        'logoUrl',
                      );

                      return (
                        <Box
                          key={lead.id}
                          component="tr"
                          sx={{
                            bgcolor:
                              index % 2 === 0
                                ? colors.panelAlt
                                : colors.panel,
                          }}
                        >
                          {/* NOME */}

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                              fontSize: 12.5,
                              fontWeight: 900,
                            }}
                          >
                            {leadName(lead)}
                          </Box>

                          {/* LOGO */}

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {logoUrl ? (
                              <Box
                                component="img"
                                src={logoUrl}
                                alt=""
                                sx={{
                                  width: 30,
                                  height: 30,
                                  objectFit: 'contain',
                                  bgcolor: '#fff',
                                  borderRadius: '3px',
                                }}
                              />
                            ) : (
                              <Typography
                                sx={{
                                  color: colors.muted,
                                  fontSize: 12,
                                }}
                              >
                                -
                              </Typography>
                            )}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                              fontSize: 12.5,
                            }}
                          >
                            {metadataValue(
                              lead,
                              'segment',
                            ) || '-'}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                              fontSize: 12.5,
                            }}
                          >
                            {metadataValue(
                              lead,
                              'transport',
                            ) || '-'}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                              fontSize: 12.5,
                            }}
                          >
                            {metadataValue(
                              lead,
                              'storage',
                            ) || '-'}
                          </Box>

                          {/* ETAPA */}

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-flex',
                                px: 1,
                                py: 0.45,
                                borderRadius: '999px',
                                bgcolor:
                                  colors.orangeSoft,
                                color: colors.orange,
                                fontSize: 11.5,
                                fontWeight: 950,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {getLeadFunnelStageLabel(
                                lead.status,
                              )}
                            </Box>
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                              fontSize: 12.5,
                            }}
                          >
                            {formatDateOnly(
                              entryDate(lead),
                            )}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                              fontSize: 12.5,
                            }}
                          >
                            {formatDateOnly(
                              lastInteractionDate(lead),
                            )}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.orange,
                              fontSize: 12.5,
                              fontWeight: 900,
                            }}
                          >
                            {formatCurrency(
                              leadVolume(lead),
                            )}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                              fontSize: 12.5,
                            }}
                          >
                            {metadataValue(
                              lead,
                              'responsible',
                            ) || '-'}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                              fontSize: 12.5,
                            }}
                          >
                            {metadataValue(
                              lead,
                              'currentStatus',
                            ) || '-'}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.text,
                              fontSize: 12.5,
                            }}
                          >
                            {metadataValue(
                              lead,
                              'nextAction',
                            ) || '-'}
                          </Box>

                          <Box
                            component="td"
                            sx={{
                              px: 1,
                              py: 1,
                              border: `1px solid ${colors.border}`,
                              color: colors.muted,
                              fontSize: 12.5,
                            }}
                          >
                            {lead.notes || '-'}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Stack>
        )}
      </Paper>
    </AppLayout>
  );
}