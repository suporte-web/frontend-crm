'use client';

import { hasAnyRole } from "@/lib/user-roles";
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

  shadow: 'none',
};


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
        minHeight: 88,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        bgcolor: colors.panel,
        boxShadow: 'none',
      }}
    >
      <Typography
        sx={{
          color: colors.muted,
          fontSize: 13,
          fontWeight: 600,
          textTransform: 'none',
          textAlign: 'left',
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: valueColor,
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1,
          textAlign: 'left',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
function MetricCard({ title, value, helper, icon, accent, softAccent, progress }: {
  title: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  accent: string;
  softAccent: string;
  progress?: number;
}) {
  const percentual = progress === undefined ? undefined : Math.min(100, Math.max(0, progress));
  return (
    <Paper elevation={0} sx={{ p: 2, minWidth: 0, border: `1px solid ${colors.border}`, borderRadius: '12px', bgcolor: '#fff', boxShadow: 'none' }}>
      <Stack spacing={1.25}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>{title}</Typography>
          <Box sx={{ display: 'flex', color: '#94a3b8', '& svg': { fontSize: 18 } }}>{icon}</Box>
        </Stack>
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: colors.text, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{typeof value === 'number' ? formatNumber(value) : value}</Typography>
        <Typography sx={{ color: colors.muted, fontSize: 12, lineHeight: 1.4 }}>{helper}</Typography>
        {percentual !== undefined && (
          <Box sx={{ height: 3, borderRadius: 2, bgcolor: softAccent, overflow: 'hidden' }}>
            <Box sx={{ width: `${percentual}%`, height: '100%', bgcolor: accent, borderRadius: 2 }} />
          </Box>
        )}
      </Stack>
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
    hasAnyRole(user, ['ADMIN', 'GESTAO', 'COMERCIAL']);

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
        const [summaryData, dadosLead, convertidos] = await Promise.all([
          getCrmDashboardSummary(authToken),
          getLeads(authToken, { convertidoParaCliente: false }),
          getLeads(authToken, { convertidoParaCliente: true }),
        ]);

        if (!active) return;

        setSummary(summaryData);
        setLeads(Array.from(new Map([...dadosLead, ...convertidos].map(lead => [lead.id, lead])).values()));
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

  const commercialLeads = leads;

  const funnelRows = useMemo(() => {
    const total = Math.max(commercialLeads.length, 1);

    return LEAD_FUNNEL_STAGES.map((stage) => {
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
    "Homologação", "Homologação" etc.
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

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 2.5 }}>
          <Box>
            <Typography component="h1" sx={{ fontSize: { xs: 23, md: 26 }, fontWeight: 700, color: colors.text, lineHeight: 1.3 }}>Resumo do funil</Typography>
            <Typography sx={{ mt: 0.75, color: colors.muted, fontSize: 13 }}>Leads em andamento, conversões e próximos contatos.</Typography>
          </Box>
          <Button type="button" onClick={() => setRefreshKey(atual => atual + 1)} disabled={loading} variant="contained" startIcon={<RefreshCcw size={16} />} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, minHeight: 40, px: 2, borderRadius: '8px', bgcolor: colors.orange, color: '#fff', fontSize: 13, fontWeight: 600, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e94f00', boxShadow: 'none' } }}>Atualizar</Button>
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
                title="Leads ativos"
                value={activeLeadCount}
                helper="Em andamento"
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
                title="Em contato"
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
                title="Homologação"
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
                title="Próximas ações"
                value={nextActionCount}
                helper="Ações agendadas"
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
                borderRadius: '12px',
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
                    minWidth: 1040,
                    '& th, & td': { border: 0, borderBottom: `1px solid ${colors.border}` },
                    '& th': { bgcolor: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 600 },
                    '& td': { fontSize: 13, fontVariantNumeric: 'tabular-nums' },
                    '& tbody tr:hover': { bgcolor: '#f8fafc' },
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
                        'Cadastros',
                        'Volume mensal estimado',
                        'Participação',
                        'Clientes',
                        'Dias na etapa',
                        'Dias sem contato',
                      ].map((heading) => (
                        <Box
                          key={heading}
                          component="th"
                          sx={{
                            px: 1.5,
                            py: 1.15,
                            color: '#ffffff',
                            fontSize: 14,
                            fontWeight: 700,
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
                            fontWeight: 600,
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
                            fontWeight: 600,
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
                            fontWeight: 600,
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
                                fontWeight: 700,
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
                            fontWeight: 600,
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
                            fontWeight: 600,
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
                          fontWeight: 700,
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
                          fontWeight: 700,
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
                          fontWeight: 700,
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
                          fontWeight: 700,
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
                          fontWeight: 700,
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
                          fontWeight: 700,
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
                    label="Total de cadastros"
                    value={formatNumber(totalLeads)}
                  />

                  <SummaryBox
                    label="Volume mensal total"
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
                    label="Taxa de vendas"
                    value={formatPercent(
                      vendaEfetivadaRate,
                    )}
                    valueColor={colors.greenText}
                  />

                  <SummaryBox
                    label="Clientes em pós-venda"
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
                    label="Dias na etapa"
                    value={`${averageStageDays} dias`}
                  />

                  <SummaryBox
                    label="Dias sem contato"
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
                  borderRadius: '12px',
                  bgcolor: colors.panel,
                  boxShadow: colors.shadow,
                  minHeight: 260,
                }}
              >
                <Typography
                  sx={{
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: 700,
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
                          fontWeight: 700,
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
            <Paper elevation={0} sx={{
              border: `1px solid ${colors.border}`, borderRadius: '16px',
              bgcolor: colors.panel, boxShadow: 'none', overflow: 'hidden',
            }}>
              <Stack direction="row" spacing={2} sx={{ p: { xs: 2, md: 2.5 }, alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography component="h2" sx={{ color: colors.text, fontSize: 18, fontWeight: 700 }}>
                    Leads e clientes no funil
                  </Typography>
                  <Typography sx={{ mt: 0.5, color: colors.muted, fontSize: 13 }}>
                    Etapas, responsáveis e próximos passos dos cadastros do período.
                  </Typography>
                </Box>
                <Box component="span" sx={{ px: 1.5, py: 0.75, borderRadius: '8px', bgcolor: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {detailRows.length} {detailRows.length === 1 ? 'cadastro' : 'cadastros'}
                </Box>
              </Stack>
              <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" aria-label="Leads e clientes no funil" sx={{
                  width: '100%', minWidth: 1250, borderCollapse: 'collapse',
                  '& th': {
                    px: 2, py: 1.5, color: '#475569', bgcolor: '#f8fafc',
                    fontSize: 12, fontWeight: 600, textAlign: 'left',
                    borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`,
                  },
                  '& td': { px: 2, py: 2, borderBottom: '1px solid #f1f5f9', verticalAlign: 'top', color: colors.text, fontSize: 13 },
                  '& tbody tr:last-child td': { borderBottom: 0 },
                  '& tbody tr:hover': { bgcolor: '#fafbfc' },
                }}>
                  <Box component="thead">
                    <Box component="tr">
                      {['Empresa', 'Serviços', 'Etapa do funil', 'Datas', 'Volume mensal', 'Responsável', 'Próxima ação', 'Observações'].map(heading => (
                        <Box key={heading} component="th" scope="col">{heading}</Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {detailRows.map(lead => {
                      const logoUrl = metadataValue(lead, 'logoUrl');
                      const segmento = metadataValue(lead, 'segment');
                      const transporte = metadataValue(lead, 'transport');
                      const armazenagem = metadataValue(lead, 'storage');
                      const responsavel = metadataValue(lead, 'responsible');
                      const situacao = metadataValue(lead, 'currentStatus');
                      const proximaAcao = metadataValue(lead, 'nextAction');
                      return (
                        <Box key={lead.id} component="tr">
                          <Box component="td" sx={{ minWidth: 210 }}>
                            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                              <Box sx={{ width: 38, height: 38, flexShrink: 0, borderRadius: '10px', bgcolor: logoUrl ? '#fff' : colors.orangeSoft, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: '#c2410c', fontWeight: 700 }}>
                                {logoUrl ? <Box component="img" src={logoUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : leadName(lead).charAt(0).toUpperCase()}
                              </Box>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: colors.text, overflowWrap: 'anywhere' }}>{leadName(lead)}</Typography>
                                <Typography sx={{ mt: 0.25, fontSize: 12, color: colors.muted }}>{segmento || 'Segmento não informado'}</Typography>
                              </Box>
                            </Stack>
                          </Box>
                          <Box component="td" sx={{ minWidth: 135 }}>
                            <Typography sx={{ fontSize: 12, color: colors.muted }}>Transporte: <Box component="span" sx={{ color: colors.text }}>{transporte || '—'}</Box></Typography>
                            <Typography sx={{ mt: 0.5, fontSize: 12, color: colors.muted }}>Armazenagem: <Box component="span" sx={{ color: colors.text }}>{armazenagem || '—'}</Box></Typography>
                          </Box>
                          <Box component="td">
                            <Box component="span" sx={{ display: 'inline-flex', px: 1.25, py: 0.5, borderRadius: '6px', bgcolor: colors.orangeSoft, color: '#c2410c', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {getLeadFunnelStageLabel(lead.status)}
                            </Box>
                          </Box>
                          <Box component="td" sx={{ whiteSpace: 'nowrap' }}>
                            <Typography sx={{ fontSize: 12, color: colors.muted }}>Entrada <Box component="span" sx={{ ml: 0.5, color: colors.text }}>{formatDateOnly(entryDate(lead))}</Box></Typography>
                            <Typography sx={{ mt: 0.5, fontSize: 12, color: colors.muted }}>Interação <Box component="span" sx={{ ml: 0.5, color: colors.text }}>{formatDateOnly(lastInteractionDate(lead))}</Box></Typography>
                          </Box>
                          <Box component="td" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                            {formatCurrency(leadVolume(lead))}
                          </Box>
                          <Box component="td" sx={{ minWidth: 130 }}>
                            <Typography sx={{ fontSize: 13 }}>{responsavel || 'Não informado'}</Typography>
                            {situacao && <Typography sx={{ mt: 0.5, fontSize: 12, color: colors.muted }}>{situacao}</Typography>}
                          </Box>
                          <Box component="td" sx={{ minWidth: 170, maxWidth: 240, overflowWrap: 'anywhere' }}>
                            <Typography sx={{ fontSize: 13, color: proximaAcao ? colors.text : colors.muted }}>{proximaAcao || 'Não definida'}</Typography>
                          </Box>
                          <Box component="td" sx={{ minWidth: 160, maxWidth: 240, overflowWrap: 'anywhere' }}>
                            {lead.notes ? (
                              <Box component="details" sx={{ color: colors.muted, fontSize: 12, lineHeight: 1.7, '& summary': { cursor: 'pointer', color: '#475569', fontWeight: 500 }, '&[open] summary': { mb: 0.75 } }}>
                                <Box component="summary">Ver observações</Box>
                                <Box sx={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</Box>
                              </Box>
                            ) : <Box component="span" sx={{ color: colors.muted }}>—</Box>}
                          </Box>
                        </Box>
                      );
                    })}
                    {detailRows.length === 0 && (
                      <Box component="tr"><Box component="td" colSpan={8} sx={{ textAlign: 'center', py: '40px !important', color: '#64748b !important' }}>Nenhum cadastro encontrado no período selecionado.</Box></Box>
                    )}
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