'use client';

import { PageTopContent } from "@/components/layout/page-top";

import { hasAnyRole } from "@/lib/user-roles";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';


import { CircleHelp, Download, RefreshCcw, X } from 'lucide-react';

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



const calculosFunil: Record<string, string> = {
  'Leads ativos': 'Conta os cadastros que não estão nas etapas Perdido, Venda Efetivada ou Pós-venda.',
  'Conversão': 'Conta os cadastros na etapa Conversão, informada em Editar cadastro → Etapa do funil comercial. Cadastros antigos com o status de contato realizado também entram nessa etapa. A participação é essa quantidade dividida pelo total de cadastros do funil, multiplicada por 100. Se o total for zero, exibe 0%.',
  'Homologação': 'Conta os cadastros da etapa de homologação. A participação é essa quantidade dividida pelo total de cadastros, multiplicada por 100.',
  'Convertidos': 'Soma os cadastros em Venda Efetivada e Pós-venda. A participação é essa soma dividida pelo total de cadastros, multiplicada por 100.',
  'Próximas ações': 'Conta os cadastros com o campo Próxima ação preenchido. A barra mostra essa quantidade dividida pelo total de cadastros, multiplicada por 100. Não depende de uma data de agendamento.',
  'Total de cadastros': 'Soma a quantidade de cadastros de todas as etapas, incluindo Perdido, Venda Efetivada e Pós-venda. Cadastros repetidos nas consultas são contados uma única vez pelo identificador.',
  'Volume mensal estimado': 'Soma o volume mensal estimado informado nos cadastros de todas as etapas. Valores ausentes ou inválidos entram como zero. O total é exibido em reais, sem casas decimais.',
  'Participação total': 'Soma a participação de todas as etapas: total de cadastros dividido pelo próprio total, multiplicado por 100. Por isso, exibe 100% quando há cadastros e 0% quando o funil está vazio.',
  'Tempo médio na etapa': 'Em cada etapa, calcula a média dos dias completos desde a data de entrada de cada cadastro; quando não há data de entrada, usa a data de criação. Depois calcula a média dessas médias, dando o mesmo peso a cada etapa. Etapas sem datas válidas entram com zero. As médias são arredondadas para dias inteiros. A conta usa a entrada do cadastro, não a data de mudança de etapa.',
  'Tempo médio sem contato': 'Em cada etapa, calcula a média dos dias completos desde a última interação. Usa primeiro a data de interação informada, depois a última interação registrada e, por último, a atualização do cadastro. Depois calcula a média dessas médias, dando o mesmo peso a cada etapa. Etapas sem datas válidas entram com zero. As médias são arredondadas para dias inteiros.',
  'Taxa de vendas': 'Quantidade de cadastros em Venda Efetivada dividida pelo total de cadastros, multiplicada por 100. Este indicador não inclui Pós-venda no numerador. Se o total for zero, exibe 0%.',
  'Clientes em pós-venda': 'Conta os cadastros classificados na etapa Pós-venda.',
  'Com próxima ação definida': 'Conta os cadastros cujo campo Próxima ação contém texto, desconsiderando espaços em branco.',
};
calculosFunil['Volume mensal total'] = calculosFunil['Volume mensal estimado'];
calculosFunil['Dias na etapa'] = calculosFunil['Tempo médio na etapa'];
calculosFunil['Dias sem contato'] = calculosFunil['Tempo médio sem contato'];
calculosFunil['Cadastros no funil'] = calculosFunil['Total de cadastros'];

function AjudaCalculo({ titulo }: { titulo: string }) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const id = useId();
  const explicacao = calculosFunil[titulo];
  if (!explicacao) return null;
  return (
    <Box component="span" sx={{ display: 'inline-flex', verticalAlign: 'middle', ml: 0.5 }}>
      <IconButton size="small" aria-label={`Como é calculado: ${titulo}`} aria-haspopup="dialog" aria-expanded={Boolean(anchor)} aria-controls={anchor ? id : undefined} onClick={event => setAnchor(event.currentTarget)} sx={{ width: 28, height: 28, color: colors.muted, '&:hover': { color: colors.orange, bgcolor: colors.orangeSoft } }}>
        <CircleHelp size={16} aria-hidden="true" />
      </IconButton>
      <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { role: 'dialog', id, 'aria-labelledby': id + '-titulo', 'aria-describedby': id + '-texto', sx: { boxSizing: 'border-box', width: 340, maxWidth: 'calc(100vw - 32px)', p: 2, mt: 0.75, borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgb(15 23 42 / 12%)' } } }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography id={id + '-titulo'} component="h3" sx={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{titulo}</Typography>
          <IconButton size="small" aria-label="Fechar explicação" onClick={() => setAnchor(null)} sx={{ mt: -0.5, mr: -0.5 }}><X size={16} /></IconButton>
        </Stack>
        <Typography id={id + '-texto'} sx={{ mt: 1, fontSize: 13, lineHeight: 1.7, color: colors.muted }}>{explicacao}</Typography>
      </Popover>
    </Box>
  );
}

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
        {label}<AjudaCalculo titulo={label} />
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
          <Typography sx={{ fontSize: 12, color: colors.muted, fontWeight: 500 }}>{title}<AjudaCalculo titulo={title} /></Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, flexShrink: 0, borderRadius: '8px', bgcolor: softAccent, color: accent, '& svg': { fontSize: 18 } }}>{icon}</Box>
        </Stack>
        <Typography sx={{ fontSize: 28, fontWeight: 700, color: colors.text, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{typeof value === 'number' ? formatNumber(value) : value}</Typography>
        <Typography sx={{ color: colors.muted, fontSize: 12, lineHeight: 1.4 }}>{helper}</Typography>
        {percentual !== undefined && (
          <Box sx={{ height: 5, borderRadius: 2, bgcolor: softAccent, overflow: 'hidden' }}>
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
  const [exportando, setExportando] = useState(false);
  const [erroExportacao, setErroExportacao] = useState('');

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

  const conversionCount = funnelRows.find(row => row.value === 'conversao')?.count ?? 0;

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

  const conversionPercent =
    percentageOfTotal(conversionCount);

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

  async function exportarExcel() {
    if (exportando || loading || detailRows.length === 0) return;
    setExportando(true);
    setErroExportacao('');
    try {
      const { gerarRelatorioFunilExcel } = await import('@/lib/relatorio-funil-excel');
      const arquivo = await gerarRelatorioFunilExcel(detailRows.map(lead => ({
        empresa: leadName(lead),
        segmento: metadataValue(lead, 'segment'),
        transporte: metadataValue(lead, 'transport'),
        armazenagem: metadataValue(lead, 'storage'),
        etapa: getLeadFunnelStageLabel(lead.status),
        entrada: formatDateOnly(entryDate(lead)),
        ultimaInteracao: formatDateOnly(lastInteractionDate(lead)),
        volumeMensal: leadVolume(lead),
        responsavel: metadataValue(lead, 'responsible'),
        situacao: metadataValue(lead, 'currentStatus'),
        proximaAcao: metadataValue(lead, 'nextAction'),
        observacoes: lead.notes || '',
      })));
      const blob = new Blob([new Uint8Array(arquivo)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const hoje = new Date();
      const data = [hoje.getFullYear(), String(hoje.getMonth() + 1).padStart(2, '0'), String(hoje.getDate()).padStart(2, '0')].join('-');
      link.download = `leads-clientes-funil-${data}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setErroExportacao('Não foi possível exportar o relatório. Tente novamente.');
    } finally {
      setExportando(false);
    }
  }

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
          minWidth: 0,
          width: '100%',
          minHeight: 'calc(100vh - 96px)',
          p: {
            xs: 2,
            lg: 2.5,
          },
          border: 'none !important',
          borderRadius: '12px',
          bgcolor: colors.page,
          color: colors.text,
        }}
      >
        {/* CABEÇALHO */}

        <PageTopContent title={"Resumo do funil"} description={"Leads em andamento, conversões e próximos contatos."} aside={<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 2.5 }}>

          <Button type="button" onClick={() => setRefreshKey(atual => atual + 1)} disabled={loading} variant="contained" startIcon={<RefreshCcw size={16} />} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, minHeight: 40, px: 2, borderRadius: '8px', bgcolor: colors.orange, color: '#fff', fontSize: 13, fontWeight: 600, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#e94f00', boxShadow: 'none' } }}>Atualizar</Button>
        </Stack>} />

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

              {/* CONVERSÃO */}

              <MetricCard
                title="Conversão"
                value={conversionCount}
                helper={`${formatPercent(
                  conversionPercent,
                )} do funil`}
                progress={conversionPercent}
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

            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, minWidth: 0, border: `1px solid ${colors.border}`, borderRadius: '12px' }}>
              <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>Etapas do funil</Typography>
              <Typography sx={{ mt: 0.5, mb: 2, fontSize: 13, color: colors.muted }}>Quantidade e participação dos cadastros em cada etapa. Abra os detalhes para consultar volume e acompanhamento.</Typography>
              <Box component="dl" aria-label="Resumo dos indicadores do funil" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 1.5, m: 0, mb: 3 }}>
                {[
                  { label: 'Total de cadastros', value: formatNumber(totalLeads), unit: 'cadastros no funil', color: colors.text, background: '#f8fafc' },
                  { label: 'Volume mensal estimado', value: formatCurrency(totalVolume), unit: 'somatório das etapas', color: '#c2410c', background: colors.orangeSoft },
                  { label: 'Participação total', value: formatPercent(totalLeads > 0 ? 100 : 0), unit: 'dos cadastros do funil', color: colors.text, background: '#f8fafc' },
                  { label: 'Tempo médio na etapa', value: formatNumber(averageStageDays), unit: 'dias', color: colors.text, background: '#f8fafc' },
                  { label: 'Tempo médio sem contato', value: formatNumber(averageLastContactDays), unit: 'dias', color: averageLastContactDays > 0 ? '#b91c1c' : colors.greenText, background: averageLastContactDays > 0 ? colors.redSoft : colors.greenSoft },
                ].map(item => (
                  <Box key={item.label} sx={{ minWidth: 0, p: 2, borderRadius: '10px', bgcolor: item.background, display: 'flex', flexDirection: 'column' }}>
                    <Typography component="dt" sx={{ color: colors.muted, fontSize: 12, fontWeight: 500, lineHeight: 1.5 }}>{item.label}<AjudaCalculo titulo={item.label} /></Typography>
                    <Typography component="dd" sx={{ m: 0, mt: 1, color: item.color, fontSize: { xs: 25, md: 28 }, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>{item.value}</Typography>
                    <Typography component="dd" sx={{ m: 0, mt: 0.75, color: colors.muted, fontSize: 11.5 }}>{item.unit}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" sx={{ mb: 1.5, justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: 12, color: colors.muted }}>Etapa comercial</Typography>
                  <Typography sx={{ fontSize: 12, color: colors.muted }}>Cadastros · participação</Typography>
                </Stack>
                <Stack spacing={2}>
                  {funnelRows.map(row => {
                    const accent = row.value === 'perdido' ? colors.red : ['venda_efetivada', 'pos_venda'].includes(row.value) ? colors.greenText : colors.orange;
                    return (
                      <Box key={row.value} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', sm: '140px minmax(0, 1fr) auto' }, alignItems: 'center', columnGap: 2, rowGap: 0.75, minWidth: 0 }}>
                        <Typography component="h3" sx={{ fontSize: 13, fontWeight: 500, minWidth: 0 }}>{row.label}</Typography>
                        <Box role="img" aria-label={`${row.label}: ${formatNumber(row.count)} cadastros, ${formatPercent(row.percent)} do total`} sx={{ gridColumn: { xs: '1 / -1', sm: '2' }, gridRow: { xs: 2, sm: 1 }, height: 28, minWidth: 0, borderRadius: '6px', bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                          <Box sx={{ width: `${(row.count / maxCount) * 100}%`, height: '100%', bgcolor: accent, borderRadius: '6px' }} />
                        </Box>
                        <Typography sx={{ gridColumn: { xs: 2, sm: 3 }, gridRow: 1, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(row.count)} <Box component="span" sx={{ color: colors.muted, fontWeight: 400 }}>· {formatPercent(row.percent)}</Box></Typography>
                        <Box component="details" sx={{ gridColumn: { xs: '1 / -1', sm: '2 / -1' }, minWidth: 0, fontSize: 12, color: colors.muted, '& summary': { cursor: 'pointer', width: 'fit-content', '&:hover': { color: colors.orange } } }}>
                          <Box component="summary">Ver detalhes da etapa</Box>
                          <Box sx={{ mt: 1, p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc' }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                              <Box>Volume mensal estimado: <strong>{formatCurrency(row.volume)}</strong></Box>
                              <Box>Dias na etapa: <strong>{row.averageStageDays} dias</strong></Box>
                              <Box>Dias sem contato: <strong>{row.averageLastContactDays} dias</strong></Box>
                            </Box>
                            <Typography sx={{ mt: 1, fontSize: 12, overflowWrap: 'anywhere' }}><Box component="span" sx={{ fontWeight: 600 }}>Clientes: </Box>{row.clients}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

            </Paper>

            {/* RESUMO + GRÁFICO */}

            <Box
              sx={{
                display: 'grid',
                gap: 3,

                gridTemplateColumns: {
                  xs: '1fr',
                  xl: 'minmax(0, 1fr) minmax(0, 1fr)',
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
                      sm: 'repeat(2, minmax(0, 1fr))',
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
                      sm: 'repeat(2, minmax(0, 1fr))',
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
                      sm: 'repeat(2, minmax(0, 1fr))',
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

              <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, minWidth: 0, border: `1px solid ${colors.border}`, borderRadius: '12px', bgcolor: colors.panel }}>
                <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>Leads e clientes por etapa</Typography>
                <Typography sx={{ mt: 0.5, mb: 2.5, fontSize: 12, color: colors.muted }}>Quantidade de cadastros em cada etapa comercial.</Typography>
                <Stack spacing={1.75}>
                  {funnelRows.map(row => {
                    const accent = row.value === 'perdido' ? colors.red : ['venda_efetivada', 'pos_venda'].includes(row.value) ? colors.greenText : colors.orange;
                    return <Box key={row.value} sx={{ minWidth: 0 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 0.75 }}>
                        <Typography sx={{ fontSize: 12, color: colors.text }}>{row.label}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(row.count)} <Box component="span" sx={{ color: colors.muted, fontWeight: 400 }}>· {formatPercent(row.percent)}</Box></Typography>
                      </Stack>
                      <Box role="img" aria-label={`${row.label}: ${row.count} cadastros, ${formatPercent(row.percent)} do funil`} sx={{ height: 10, borderRadius: 5, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                        <Box sx={{ width: `${(row.count / maxCount) * 100}%`, height: '100%', borderRadius: 5, bgcolor: accent }} />
                      </Box>
                    </Box>;
                  })}
                </Stack>
              </Paper>
            </Box>

            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, minWidth: 0, border: `1px solid ${colors.border}`, borderRadius: '12px', bgcolor: colors.panel, boxShadow: 'none' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>Leads e clientes no funil</Typography>
                  <Typography sx={{ mt: 0.5, color: colors.muted, fontSize: 13 }}>Os 10 primeiros cadastros do funil. Exporte a relação completa para consultar todos os detalhes.</Typography>
                </Box>
                <Button onClick={exportarExcel} disabled={loading || exportando || detailRows.length === 0} variant="outlined" startIcon={exportando ? <CircularProgress size={16} color="inherit" /> : <Download size={16} />} sx={{ minHeight: 40, flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' }, borderRadius: '8px', px: 2, color: '#475569', borderColor: '#cbd5e1', textTransform: 'none', fontSize: 13, fontWeight: 600, '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
                  {exportando ? 'Exportando...' : 'Exportar Excel'}
                </Button>
              </Stack>
              {erroExportacao && <Alert severity="error" sx={{ mt: 2 }}>{erroExportacao}</Alert>}
              {detailRows.length === 0 ? (
                <Typography sx={{ mt: 2, color: colors.muted, fontSize: 13 }}>Nenhum cadastro encontrado.</Typography>
              ) : (
                <Box sx={{ mt: 2, p: 2, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2, bgcolor: '#f8fafc', borderRadius: '8px' }}>
                  {[['Cadastros no funil', formatNumber(detailRows.length)], ['Volume mensal estimado', formatCurrency(totalVolume)], ['Com próxima ação definida', formatNumber(nextActionCount)]].map(([label, value]) => (
                    <Box key={label} sx={{ minWidth: 0 }}><Typography sx={{ color: colors.muted, fontSize: 12 }}>{label}<AjudaCalculo titulo={label} /></Typography><Typography sx={{ mt: 0.5, fontSize: 20, fontWeight: 600, overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography></Box>
                  ))}
                </Box>
              )}
              {detailRows.length > 0 && (
                <Box sx={{ mt: 2, minWidth: 0, containerType: 'inline-size' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr)', gap: 2, px: 1.5, py: 1, bgcolor: '#f8fafc', borderRadius: '6px', '@container (max-width: 700px)': { display: 'none' } }}>
                    {['Empresa', 'Etapa', 'Responsável', 'Próxima ação'].map(label => <Typography key={label} sx={{ fontSize: 12, fontWeight: 600, color: colors.muted }}>{label}</Typography>)}
                  </Box>
                  <Box component="ul" aria-label="Primeiros cadastros no funil" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                    {detailRows.slice(0, 10).map(lead => (
                      <Box component="li" key={lead.id} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr)', alignItems: 'start', gap: 2, px: 1.5, py: 1.5, borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 0 }, '@container (max-width: 700px)': { gridTemplateColumns: 'minmax(0, 1fr)', gap: 0.75 }, '& .MuiTypography-root': { overflowWrap: 'anywhere', minWidth: 0 } }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{leadName(lead)}</Typography>
                        <Box sx={{ minWidth: 0 }}><Box component="span" sx={{ display: 'inline-block', px: 1, py: 0.4, borderRadius: '6px', bgcolor: colors.orangeSoft, color: '#c2410c', fontSize: 12 }}>{getLeadFunnelStageLabel(lead.status)}</Box></Box>
                        <Typography sx={{ fontSize: 12, color: colors.muted }}><Box component="span" sx={{ display: 'none', '@container (max-width: 700px)': { display: 'inline' } }}>Responsável: </Box>{metadataValue(lead, 'responsible') || 'Não informado'}</Typography>
                        <Typography sx={{ fontSize: 12, color: colors.muted }}><Box component="span" sx={{ display: 'none', '@container (max-width: 700px)': { display: 'inline' } }}>Próxima ação: </Box>{metadataValue(lead, 'nextAction') || 'Não definida'}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography sx={{ mt: 1.5, color: colors.muted, fontSize: 12 }}>Exibindo {Math.min(10, detailRows.length)} de {formatNumber(detailRows.length)} cadastros. O Excel inclui a relação completa.</Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        )}
      </Paper>
    </AppLayout>
  );
}