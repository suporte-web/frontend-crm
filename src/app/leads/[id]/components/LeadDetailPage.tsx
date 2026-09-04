'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

// ICONS

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';



import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Edit3,
  Mail,
  UserRoundCheck,
} from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import { LeadForm } from '@/components/leads/lead-form';
import { getLeadSourceLabel } from '@/components/leads/lead-timeline';
import {
  LEAD_FUNNEL_STAGES,
  getLeadFunnelStageInfo,
  getLeadFunnelStageLabel,
  normalizeLeadFunnelStage,
} from '@/constants/lead-funnel';
import {
  CrmKpiCard,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { useAuth } from '@/context/auth-context';
import {
  convertLeadToClient,
  createLeadObservation,
  excluirLead,
  getLeadById,
  getLeadObservations,
  updateLead,
  updateLeadStatus,
} from '@/services/leads.service';

import type {
  CreateLeadPayload,
  Lead,
  LeadObservation,
  LeadTimelineEvent,
} from '@/types/leads';

const internalRoles = new Set(['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING']);
const converterRoles = new Set(['ADMIN', 'GESTAO', 'COMERCIAL']);


const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: '#fff',
  },
};

function formatDate(date?: string | null) {
  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function getLeadStatusLabel(status?: string | null) {
  return status ? getLeadFunnelStageLabel(status) : '-';
}

function getLeadSourceChipSx(source?: string | null) {
  if (source === 'site') {
    return {
      bgcolor: '#fff7d6',
      color: '#8a5a00',
      borderColor: '#f6d36b',
    };
  }

  return {
    bgcolor: '#e8f2ff',
    color: '#175a9e',
    borderColor: '#a9cff5',
  };
}

function getConversionTarget(lead?: Lead | null) {
  const metadata = lead?.metadata;

  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
    return {
      clientId: '',
      prospectId: '',
    };
  }

  return {
    clientId:
      typeof metadata.clientId === 'string'
        ? metadata.clientId
        : '',

    prospectId:
      typeof metadata.prospectId === 'string'
        ? metadata.prospectId
        : '',
  };
}

function getMetadataString(lead: Lead | null, key: string) {
  const metadata = lead?.metadata;

  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
    return '';
  }

  const value = metadata[key];
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function formatDateOnly(value?: string | null) {
  if (!value) {
    return '';
  }

  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  }

  return formatDate(value);
}

function formatMoneyValue(value?: string | null) {
  if (!value) {
    return '';
  }

  const normalized = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return value;
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parsed);
}

function getLeadCommercialInfo(lead: Lead | null) {
  return {
    logoUrl: getMetadataString(lead, 'logoUrl'),
    segment: getMetadataString(lead, 'segment'),
    transport: getMetadataString(lead, 'transport'),
    storage: getMetadataString(lead, 'storage'),
    entryDate: formatDateOnly(getMetadataString(lead, 'entryDate')),
    lastInteractionDate: formatDateOnly(
      getMetadataString(lead, 'lastInteractionDate') || lead?.lastInteractionAt,
    ),
    monthlyEstimatedValue: formatMoneyValue(
      getMetadataString(lead, 'monthlyEstimatedValue'),
    ),
    responsible: getMetadataString(lead, 'responsible'),
    currentStatus: getMetadataString(lead, 'currentStatus'),
    nextAction: getMetadataString(lead, 'nextAction'),
  };
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,

        py: 1.5,

        borderBottom: '1px solid rgba(15,23,42,0.08)',
      }}
    >
      <Typography
        sx={{
          color: '#64748b',

          fontSize: 11,

          fontWeight: 800,

          letterSpacing: '.08em',

          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.6,

          color: '#1f2937',

          fontSize: 14,

          fontWeight: 700,

          lineHeight: 1.5,

          overflowWrap: 'anywhere',
        }}
      >
        {value || '-'}
      </Typography>
    </Box>
  );
}

function LeadHeaderSummaryItem({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  withDivider = false,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  iconBg: string;
  iconColor: string;
  withDivider?: boolean;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: {
          xs: 2,
          md: 2.5,
        },
        borderRight: {
          md: withDivider ? '1px solid rgba(15,23,42,0.08)' : 'none',
        },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 50,
            height: 50,
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
            borderRadius: '16px',
            bgcolor: iconBg,
            color: iconColor,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: '#94a3b8',
              fontSize: 14,
              fontWeight: 800,
              lineHeight: 1.35,
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              mt: 0.35,
              color: '#1e293b',
              fontSize: 17,
              fontWeight: 900,
              lineHeight: 1.35,
              overflowWrap: 'anywhere',
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function LeadTimelineList({
  events,
}: {
  events: LeadTimelineEvent[];
}) {
  if (events.length === 0) {
    return (
      <Alert
        severity="info"
        sx={{
          borderRadius: '10px',
        }}
      >
        Nenhum evento registrado para este lead.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
      }}
    >
      {events.map((event, index) => {
        const isLast = index === events.length - 1;

        return (
          <Box
            key={event.id}
            sx={{
              position: 'relative',

              display: 'grid',

              gridTemplateColumns: '24px minmax(0, 1fr)',

              gap: 1.5,

              pb: isLast ? 0 : 2.5,
            }}
          >
            {/* LINHA + BOLINHA */}
            <Box
              sx={{
                position: 'relative',

                display: 'flex',

                justifyContent: 'center',
              }}
            >
              {!isLast ? (
                <Box
                  sx={{
                    position: 'absolute',

                    top: 14,
                    bottom: -10,

                    width: 2,

                    bgcolor: 'rgba(255,88,5,0.14)',
                  }}
                />
              ) : null}

              <Box
                sx={{
                  position: 'relative',

                  zIndex: 1,

                  width: 10,
                  height: 10,

                  mt: 0.7,

                  borderRadius: '50%',

                  bgcolor: crmPalette.orange,

                  boxShadow:
                    '0 0 0 4px rgba(255,88,5,0.10)',
                }}
              />
            </Box>

            {/* CONTEÚDO */}
            <Box
              sx={{
                minWidth: 0,

                pb: 2,

                borderBottom: isLast
                  ? 'none'
                  : '1px solid rgba(15,23,42,0.07)',
              }}
            >
              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row',
                }}
                spacing={1}
                sx={{
                  justifyContent: 'space-between',

                  alignItems: {
                    xs: 'flex-start',
                    sm: 'flex-start',
                  },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: '#1e293b',

                      fontSize: 14,

                      fontWeight: 900,

                      lineHeight: 1.4,
                    }}
                  >
                    {event.title}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.6,

                      color: '#64748b',

                      fontSize: 13,

                      lineHeight: 1.6,

                      overflowWrap: 'anywhere',
                    }}
                  >
                    {event.description}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    flexShrink: 0,

                    color: '#64748b',

                    fontSize: 12,

                    fontWeight: 800,

                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(event.createdAt)}
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: 0.7,

                  color: '#94a3b8',

                  fontSize: 11.5,
                }}
              >
                {event.createdBy?.name
                  ? `por ${event.createdBy.name}`
                  : 'Automação'}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

const leadStageColors = [
  {
    background: '#f1f5f9',
    border: '#cbd5e1',
    text: '#475569',
    active: '#475569',
  },
  {
    background: '#fff7e6',
    border: '#f2c66d',
    text: '#9a6700',
    active: '#b7791f',
  },
  {
    background: '#fffbea',
    border: '#dbc96f',
    text: '#7a6815',
    active: '#8a7415',
  },
  {
    background: '#f1f5fb',
    border: '#b8c4d8',
    text: '#4f5d75',
    active: '#52627a',
  },
  {
    background: '#f1f7ed',
    border: '#b8c9aa',
    text: '#4f6b3a',
    active: '#587544',
  },
  {
    background: '#f5f2f8',
    border: '#c8bfd3',
    text: '#665c7a',
    active: '#6d617f',
  },
  {
    background: '#faf1f1',
    border: '#d5b6b6',
    text: '#7a4a4a',
    active: '#865050',
  },
];

type LeadStagePipelineProps = {
  currentStatus?: string | null;
  canEdit: boolean;
  loading: boolean;
  onChange: (nextStatus: string) => void | Promise<void>;
};

function LeadStagePipeline({
  currentStatus,
  canEdit,
  loading,
  onChange,
}: LeadStagePipelineProps) {
  const normalizedStatus = normalizeLeadFunnelStage(currentStatus);

  const currentIndex = LEAD_FUNNEL_STAGES.findIndex(
    (stage) => stage.value === normalizedStatus,
  );

  return (
    <CrmSection
      sx={{
        p: {
          xs: 6,
          md: 5,
        },

        bgcolor: '#ffffff',

        border: '1px solid rgba(15,23,42,0.08)',

        boxShadow: 'none',

        overflow: 'hidden',
      }}
    >
      {/* CABEÇALHO DO FUNIL */}
      <Stack
        direction={{
          xs: 'column',
          sm: 'row',
        }}
        spacing={1.5}
        sx={{
          alignItems: {
            xs: 'flex-start',
            sm: 'center',
          },

          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            sx={{
              color: crmPalette.orangeDark,

              fontSize: 11,

              fontWeight: 900,

              letterSpacing: '.14em',

              textTransform: 'uppercase',
            }}
          >
            Funil comercial
          </Typography>

          <Typography
            component="h2"
            sx={{
              mt: 0.5,

              color: '#1f2937',

              fontSize: {
                xs: 20,
                md: 23,
              },

              fontWeight: 900,
            }}
          >
            Etapa atual do lead
          </Typography>

          <Typography
            sx={{
              mt: 0.5,

              color: '#64748b',

              fontSize: 14,
            }}
          >
            Clique em uma etapa para movimentar o lead no processo comercial.
          </Typography>
        </Box>

        <Chip
          label={
            loading
              ? 'Atualizando etapa...'
              : `Atual: ${getLeadStatusLabel(currentStatus)}`
          }
          variant="outlined"
          sx={{
            height: 38,

            bgcolor: '#fff7ed',

            color: crmPalette.orangeDark,

            borderColor: '#fed7aa',

            fontWeight: 900,
          }}
        />
      </Stack>

      {/* ETAPAS */}
      <Box
        sx={{
          mt: 2.5,

          display: 'flex',

          gap: 1,

          overflowX: 'auto',

          // ADICIONE ISSO
          pt: 1,

          pb: 1,

          scrollbarWidth: 'thin',
        }}
      >
        {LEAD_FUNNEL_STAGES.map((stage, index) => {
          const isActive = stage.value === normalizedStatus;

          const isPrevious =
            currentIndex >= 0 && index < currentIndex;

          const stageColor =
            leadStageColors[index] ?? leadStageColors[0];

          return (
            <Button
              key={stage.value}
              type="button"
              aria-current={isActive ? 'step' : undefined}
              disabled={!canEdit || loading}
              onClick={() => {
                if (!isActive) {
                  void onChange(stage.value);
                }
              }}
              sx={{
                flex: '1 0 185px',

                minWidth: 185,
                minHeight: 90,

                px: 2,

                border: '1px solid',

                borderColor: isActive
                  ? stageColor.active
                  : stageColor.border,

                borderRadius: '12px',

                bgcolor: isActive
                  ? stageColor.active
                  : stageColor.background,

                color: isActive
                  ? '#ffffff'
                  : stageColor.text,

                display: 'flex',

                justifyContent: 'flex-start',

                gap: 1.25,

                textTransform: 'none',

                boxShadow: isActive
                  ? `0 8px 20px ${stageColor.active}30`
                  : 'none',

                transition: 'all 0.2s ease',

                '&:hover': {
                  bgcolor: isActive
                    ? stageColor.active
                    : stageColor.background,

                  borderColor: stageColor.active,

                  transform: 'translateY(-2px)',

                  boxShadow: `0 6px 16px ${stageColor.active}20`,
                },
              }}
            >
              {/* NÚMERO DA ETAPA */}
              <Box
                sx={{
                  width: 36,
                  height: 36,

                  flex: '0 0 auto',

                  display: 'grid',
                  placeItems: 'center',

                  borderRadius: '50%',

                  bgcolor: isActive
                    ? 'rgba(255,255,255,0.18)'
                    : '#ffffff',

                  border: '1px solid',

                  borderColor: isActive
                    ? 'rgba(255,255,255,0.35)'
                    : stageColor.border,

                  color: isActive
                    ? '#ffffff'
                    : stageColor.text,

                  fontSize: 13,

                  fontWeight: 900,
                }}
              >
                {index + 1}
              </Box>

              {/* TEXTO DA ETAPA */}
              <Box
                sx={{
                  minWidth: 0,

                  textAlign: 'left',
                }}
              >
                <Typography
                  sx={{
                    color: 'inherit',

                    fontSize: 13,

                    fontWeight: 900,

                    lineHeight: 1.25,

                    whiteSpace: 'nowrap',

                    overflow: 'hidden',

                    textOverflow: 'ellipsis',
                  }}
                >
                  {stage.label}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,

                    color: isActive
                      ? 'rgba(255,255,255,0.80)'
                      : '#94a3b8',

                    fontSize: 10.5,

                    fontWeight: 700,
                  }}
                >
                  {isActive
                    ? 'Etapa atual'
                    : isPrevious
                      ? 'Etapa anterior'
                      : 'Próxima etapa'}
                </Typography>
              </Box>
            </Button>
          );
        })}
      </Box>

      {!canEdit ? (
        <Typography
          sx={{
            mt: 1,

            color: '#94a3b8',

            fontSize: 12,
          }}
        >
          Seu perfil pode visualizar o funil, mas não pode alterar a etapa.
        </Typography>
      ) : null}
    </CrmSection>
  );
}
function LeadObservationsList({
  observations,
}: {
  observations: LeadObservation[];
}) {
  if (observations.length === 0) {
    return (
      <Box
        sx={{
          py: 5,
          px: 2,
          textAlign: 'center',
          borderRadius: '12px',
          bgcolor: '#f8fafc',
          border: '1px dashed #cbd5e1',
        }}
      >
        <Typography
          sx={{
            color: '#475569',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Nenhuma observação registrada
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            color: '#94a3b8',
            fontSize: 13,
          }}
        >
          As observações comerciais deste lead aparecerão aqui.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxHeight: 440,
        overflowY: 'auto',
        pr: 1,

        scrollbarWidth: 'thin',

        '&::-webkit-scrollbar': {
          width: 6,
        },

        '&::-webkit-scrollbar-track': {
          bgcolor: 'transparent',
        },

        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'rgba(100,116,139,0.25)',
          borderRadius: 999,
        },

        '&::-webkit-scrollbar-thumb:hover': {
          bgcolor: 'rgba(100,116,139,0.40)',
        },
      }}
    >
      {observations.map((observation, index) => {
        const isLast = index === observations.length - 1;

        return (
          <Box
            key={observation.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '24px minmax(0, 1fr)',
              gap: 1.5,
              position: 'relative',
            }}
          >
            {/* Linha vertical */}
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {!isLast && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 15,
                    bottom: 0,
                    width: 2,
                    bgcolor: 'rgba(255,88,5,0.14)',
                  }}
                />
              )}

              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  mt: 0.8,

                  width: 10,
                  height: 10,

                  borderRadius: '50%',

                  bgcolor: '#ff5805',

                  boxShadow:
                    '0 0 0 4px rgba(255,88,5,0.10)',
                }}
              />
            </Box>

            {/* Observação */}
            <Box
              sx={{
                pb: 2.5,

                borderBottom: isLast
                  ? 'none'
                  : '1px solid #f1f5f9',
              }}
            >
              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row',
                }}
                spacing={1}
                sx={{
                  justifyContent: 'space-between',

                  alignItems: {
                    xs: 'flex-start',
                    sm: 'center',
                  },
                }}
              >
                <Chip
                  size="small"
                  label={getLeadFunnelStageLabel(
                    observation.stage,
                  )}
                  sx={{
                    height: 25,

                    bgcolor: '#fff7ed',

                    color: '#c2410c',

                    border: '1px solid #fed7aa',

                    fontSize: 11,
                    fontWeight: 900,
                  }}
                />

                <Typography
                  sx={{
                    color: '#94a3b8',
                    fontSize: 11.5,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(observation.createdAt)}
                </Typography>
              </Stack>

              <Typography
                sx={{
                  mt: 1.25,

                  color: '#334155',

                  fontSize: 14,
                  lineHeight: 1.65,

                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {observation.content}
              </Typography>

              <Typography
                sx={{
                  mt: 1,

                  color: '#94a3b8',

                  fontSize: 11.5,

                  fontWeight: 700,
                }}
              >
                {observation.createdBy?.name
                  ? `por ${observation.createdBy.name}`
                  : 'Usuário não identificado'}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [observations, setObservations] = useState<LeadObservation[]>([]);
  const [observationText, setObservationText] = useState('');
  const [savingObservation, setSavingObservation] = useState(false);
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [error, setError] = useState('');
  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [convertForm, setConvertForm] = useState({
    document: '',
    name: '',
    email: '',
    phone: '',
    companyName: '',
    segment: '',
    status: 'PENDENTE',
  });
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const isAllowed = user?.role ? internalRoles.has(user.role) : false;
  const canConvert = user?.role ? converterRoles.has(user.role) : false;
  const conversionTarget = getConversionTarget(lead);
  const currentStageInfo = getLeadFunnelStageInfo(lead?.status);
  const commercialInfo = getLeadCommercialInfo(lead);
  const editInitialValues = useMemo<Partial<CreateLeadPayload> | undefined>(() => {
    if (!lead) {
      return undefined;
    }

    return {
      name: lead.name ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      company: lead.company ?? '',
      source: lead.source ?? 'manual',
      status: normalizeLeadFunnelStage(lead.status),
      notes: lead.notes ?? '',
      logoUrl: getMetadataString(lead, 'logoUrl'),
      segment: getMetadataString(lead, 'segment'),
      transport: getMetadataString(lead, 'transport'),
      storage: getMetadataString(lead, 'storage'),
      entryDate: getMetadataString(lead, 'entryDate'),
      lastInteractionDate: getMetadataString(lead, 'lastInteractionDate'),
      monthlyEstimatedValue: getMetadataString(lead, 'monthlyEstimatedValue'),
      responsible: getMetadataString(lead, 'responsible'),
      currentStatus: getMetadataString(lead, 'currentStatus'),
      nextAction: getMetadataString(lead, 'nextAction'),
    };
  }, [lead]);

  const isConvertedToClient =
  lead?.convertidoParaCliente ?? false;

  useEffect(() => {
    async function loadLead() {
      if (!token || !id) {
        return;
      }

      try {
        setLoading(true);
        setError('');
        const [leadData, observationsData] = await Promise.all([
          getLeadById(id, token),
          getLeadObservations(id, token),
        ]);

        setLead(leadData);
        setObservations(observationsData);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Erro ao carregar lead.',
        );
      } finally {
        setLoading(false);
      }
    }

    if (isAllowed && token && id) {
      loadLead();
    } else {
      setLoading(false);
    }
  }, [id, isAllowed, token]);

  function openConvertModal() {
    if (!lead) {
      return;
    }

    setConvertForm({
      document: '',
      name: lead.name ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      companyName: lead.company ?? lead.name ?? '',
      segment: '',
      status: 'PENDENTE',
    });
    setConvertOpen(true);
  }

  async function handleConvertLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    if (!convertForm.document.trim()) {
      setToast({
        title: 'CNPJ obrigatório',
        message: 'Informe o CNPJ/documento para converter em cliente.',
        variant: 'error',
      });
      return;
    }

    if (!convertForm.email.trim()) {
      setToast({
        title: 'E-mail obrigatório',
        message: 'Informe o e-mail para criar o acesso do cliente.',
        variant: 'error',
      });
      return;
    }

    try {
      setConverting(true);
      const response = await convertLeadToClient(
        lead.id,
        {
          document: convertForm.document.trim(),
          name: convertForm.name.trim() || lead.name,
          email: convertForm.email.trim(),
          phone: convertForm.phone.trim() || undefined,
          companyName:
            convertForm.companyName.trim() ||
            convertForm.name.trim() ||
            lead.name,
          segment: convertForm.segment.trim() || undefined,
          status: convertForm.status,
        },
        token,
      );
      setLead(response.lead);
      setConvertOpen(false);
      setToast({
        title: 'Lead convertido',
        message: 'Cliente criado com acesso ao portal.',
        variant: 'success',
      });
    } catch (convertError) {
      setToast({
        title: 'Falha ao converter',
        message:
          convertError instanceof Error
            ? convertError.message
            : 'Erro ao converter lead em cliente.',
        variant: 'error',
      });
    } finally {
      setConverting(false);
    }
  }

  async function handleUpdateLeadStage(nextStatus: string) {
    if (!token || !lead) {
      return;
    }

    const normalized = normalizeLeadFunnelStage(nextStatus);

    try {
      setUpdatingStage(true);
      const updatedLead = await updateLeadStatus(lead.id, normalized, token);
      setLead(updatedLead);
      setToast({
        title: 'Etapa atualizada',
        message: `Lead movido para ${getLeadFunnelStageLabel(updatedLead.status)}.`,
        variant: 'success',
      });
    } catch (stageError) {
      setToast({
        title: 'Falha ao atualizar etapa',
        message:
          stageError instanceof Error
            ? stageError.message
            : 'Erro ao atualizar etapa do lead.',
        variant: 'error',
      });
    } finally {
      setUpdatingStage(false);
    }
  }

  async function handleEditLead(payload: CreateLeadPayload): Promise<boolean> {
    if (!token || !lead) {
      return false;
    }

    try {
      setEditing(true);
      const updatedLead = await updateLead(lead.id, payload, token);
      setLead(updatedLead);
      setEditOpen(false);
      setToast({
        title: 'Lead atualizado',
        message: 'As informações do lead foram salvas.',
        variant: 'success',
      });
      return true;
    } catch (editError) {
      setToast({
        title: 'Falha ao editar',
        message:
          editError instanceof Error
            ? editError.message
            : 'Erro ao editar lead.',
        variant: 'error',
      });
      return false;
    } finally {
      setEditing(false);
    }
  }

  async function handleAddObservation() {
    if (!token || !lead) {
      return;
    }

    const content = observationText.trim();

    if (!content) {
      setToast({
        title: 'Observação obrigatória',
        message: 'Digite uma observação antes de adicionar.',
        variant: 'error',
      });

      return;
    }

    try {
      setSavingObservation(true);

      const createdObservation = await createLeadObservation(
        lead.id,
        {
          content,
        },
        token,
      );

      setObservations((current) => [
        createdObservation,
        ...current,
      ]);

      setObservationText('');

      setLead((current) =>
        current
          ? {
            ...current,
            lastInteractionAt: createdObservation.createdAt,
          }
          : current,
      );

      setToast({
        title: 'Observação adicionada',
        message: 'A observação comercial foi registrada.',
        variant: 'success',
      });
    } catch (observationError) {
      setToast({
        title: 'Erro ao adicionar observação',
        message:
          observationError instanceof Error
            ? observationError.message
            : 'Não foi possível adicionar a observação.',
        variant: 'error',
      });
    } finally {
      setSavingObservation(false);
    }
  }

  // Excluir lead

  async function handleExcluirLead() {
    if (!token || !lead) {
      return;
    }

    const confirmou = window.confirm(
      `Tem certeza que deseja excluir o lead "${lead.company || lead.name}"?\n\nEssa ação não poderá ser desfeita.`,
    );

    if (!confirmou) {
      return;
    }

    try {
      await excluirLead(lead.id, token);

      router.push('/leads');
      router.refresh();
    } catch (deleteError) {
      setToast({
        title: 'Falha ao excluir',
        message:
          deleteError instanceof Error
            ? deleteError.message
            : 'Não foi possível excluir o lead.',
        variant: 'error',
      });
    }
  }

  if (!isAllowed) {
    return (
      <AppLayout>
        <Alert severity="warning">
          Esta área é restrita aos perfis internos do CRM.
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CrmPageShell sx={{ maxWidth: 1440 }}>


        {loading ? (
          <CrmSection sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </CrmSection>
        ) : null}

        {!loading && error ? <Alert severity="error">{error}</Alert> : null}

        {!loading && !error && !lead ? (
          <Alert severity="warning">Lead não encontrado.</Alert>
        ) : null}

        {!loading && lead ? (
          <>
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                overflow: 'hidden',

                border: '1px solid rgba(15,23,42,0.08)',

                borderRadius: '20px',

                bgcolor: '#ffffff',

                boxShadow: '0 14px 40px rgba(15,23,42,0.06)',
              }}
            >
              <Stack
                sx={{
                  gap: 4,

                  p: {
                    xs: 2,
                    md: 3,
                  },
                }}
              >
                {/* CABEÇALHO PRINCIPAL */}
                <Stack
                  direction={{
                    xs: 'column',
                    xl: 'row',
                  }}
                  sx={{
                    gap: 2.5,

                    alignItems: {
                      xs: 'stretch',
                      xl: 'center',
                    },

                    justifyContent: 'space-between',
                  }}
                >
                  {/* LOGO + INFORMAÇÕES DO LEAD */}
                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    sx={{
                      gap: 2,

                      alignItems: {
                        xs: 'flex-start',
                        sm: 'center',
                      },

                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Avatar
                      src={commercialInfo.logoUrl}
                      variant="rounded"
                      sx={{
                        width: {
                          xs: 104,
                          md: 140,
                        },

                        height: {
                          xs: 104,
                          md: 140,
                        },

                        flex: '0 0 auto',

                        borderRadius: '16px',

                        bgcolor: '#fff7ed',

                        color: crmPalette.orange,

                        border: '1px solid #fed7aa',

                        fontSize: 42,

                        fontWeight: 950,

                        /*
                         * Impede que a logo seja cortada.
                         * O Avatar usa object-fit: cover por padrão.
                         */
                        '& .MuiAvatar-img': {
                          objectFit: 'contain',
                          padding: '10px',
                          boxSizing: 'border-box',
                        },
                      }}
                    >
                      {(lead.company || lead.name || 'L')
                        .slice(0, 1)
                        .toUpperCase()}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: crmPalette.orangeDark,

                          fontSize: 14,

                          fontWeight: 900,

                          letterSpacing: '.16em',

                          textTransform: 'uppercase',
                        }}
                      >
                        Comercial · Lead
                      </Typography>

                      <Typography
                        component="h1"
                        sx={{
                          mt: 0.5,

                          color: '#0f172a',

                          fontSize: {
                            xs: 34,
                            md: 46,
                          },

                          fontWeight: 950,

                          lineHeight: 1.08,

                          overflowWrap: 'break-word',
                          wordBreak: 'normal',
                        }}
                      >
                        {lead.company || lead.name}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 1,

                          color: '#64748b',

                          fontSize: {
                            xs: 16,
                            md: 20,
                          },

                          lineHeight: 1.5,

                          overflowWrap: 'anywhere',
                        }}
                      >
                        {lead.company && lead.company !== lead.name
                          ? `${lead.name}${lead.email
                            ? ` · ${lead.email}`
                            : lead.phone
                              ? ` · ${lead.phone}`
                              : ''
                          }`
                          : lead.email ||
                          lead.phone ||
                          'Sem contato principal cadastrado'}
                      </Typography>

                      {/* CHIPS DO LEAD */}
                      <Box
                        sx={{
                          mt: 1.5,

                          display: 'flex',

                          flexWrap: 'wrap',

                          gap: 1,
                        }}
                      >
                        <Chip
                          size="small"
                          variant="outlined"
                          label={getLeadSourceLabel(lead.source)}
                          sx={{
                            fontWeight: 800,

                            ...getLeadSourceChipSx(lead.source),
                          }}
                        />

                        <Chip
                          size="small"
                          label={getLeadStatusLabel(lead.status)}
                          sx={{
                            bgcolor: '#fff7ed',

                            color: crmPalette.orangeDark,

                            border: '1px solid #fed7aa',

                            fontWeight: 900,
                          }}
                        />

                        {commercialInfo.segment ? (
                          <Chip
                            size="small"
                            label={commercialInfo.segment}
                            sx={{
                              bgcolor: '#f1f5f9',

                              color: '#334155',

                              fontWeight: 800,
                            }}
                          />
                        ) : null}
                      </Box>
                    </Box>
                  </Stack>

                  {/* BOTÕES */}
                  {/* BOTÕES */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      justifyContent: {
                        xs: 'flex-start',
                        xl: 'flex-end',
                      },
                    }}
                  >
                    <Tooltip title="Voltar para leads">
                      <IconButton
                        component={Link}
                        href="/leads"
                        aria-label="Voltar para leads"
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          bgcolor: '#ffffff',
                          color: '#334155',
                          boxShadow: 'none',
                          '&:hover': {
                            borderColor: '#ff5805',
                            bgcolor: '#fff7ed',
                            color: '#e94f00',
                          },
                        }}
                      >
                        <ArrowLeft size={18} />
                      </IconButton>
                    </Tooltip>

                    {canConvert ? (
                      <Tooltip title="Editar lead">
                        <IconButton
                          type="button"
                          onClick={() => setEditOpen(true)}
                          aria-label="Editar lead"
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: '10px',
                            border: '1px solid #ff5805',
                            bgcolor: '#ff5805',
                            color: '#ffffff',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#e94f00',
                              bgcolor: '#e94f00',
                              color: '#ffffff',
                            },
                          }}
                        >
                          <Edit3 size={18} />
                        </IconButton>
                      </Tooltip>
                    ) : null}

                    <Tooltip title="Excluir lead">
                      <IconButton
                        type="button"
                        onClick={handleExcluirLead}
                        aria-label="Excluir lead"
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '10px',
                          border: '1px solid #ef4444',
                          bgcolor: '#ffffff',
                          color: '#dc2626',
                          boxShadow: 'none',
                          '&:hover': {
                            borderColor: '#dc2626',
                            bgcolor: '#fef2f2',
                            color: '#b91c1c',
                          },
                        }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {canConvert && !isConvertedToClient ? (
                      <Tooltip title="Converter para cliente">
                        <IconButton
                          type="button"
                          onClick={openConvertModal}
                          aria-label="Converter para cliente"
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: '10px',
                            border: '1px solid #ff5805',
                            bgcolor: '#ffffff',
                            color: '#e94f00',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#e94f00',
                              bgcolor: '#fff7ed',
                              color: '#c2410c',
                            },
                          }}
                        >
                          <UserRoundCheck size={18} />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Box>





                </Stack>
                <Divider />


                {/* RESUMO COMERCIAL */}
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,

                    gridTemplateColumns: {
                      xs: '1fr',
                      xl: 'minmax(0, 2.05fr) minmax(360px, 1fr)',
                    },

                    alignItems: 'stretch',
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(3, minmax(0, 1fr))',
                      },
                      overflow: 'hidden',
                      border: '1px solid rgba(15,23,42,0.08)',
                      borderRadius: '12px',
                      bgcolor: '#ffffff',
                    }}
                  >
                    <LeadHeaderSummaryItem
                      icon={<Mail size={22} />}
                      label="Contato"
                      value={lead.email || lead.phone || 'Não informado'}
                      iconBg="#eff6ff"
                      iconColor="#2563eb"
                      withDivider
                    />

                    <LeadHeaderSummaryItem
                      icon={<UserRoundCheck size={22} />}
                      label="Responsável"
                      value={commercialInfo.responsible || 'Não definido'}
                      iconBg="#ecfdf5"
                      iconColor="#059669"
                      withDivider
                    />

                    <LeadHeaderSummaryItem
                      icon={<Clock size={22} />}
                      label="Última interação"
                      value={formatDate(lead.lastInteractionAt || lead.updatedAt)}
                      iconBg="#fff7d6"
                      iconColor="#9a6700"
                    />
                  </Box>

                  {/* PRÓXIMA AÇÃO */}
                  <Box
                    sx={{
                      p: {
                        xs: 2,
                        md: 2.5,
                      },

                      borderLeft: `4px solid ${crmPalette.orange}`,

                      borderRadius: '0 12px 12px 0',

                      bgcolor: '#fff7ed',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          display: 'grid',
                          placeItems: 'center',
                          flex: '0 0 auto',
                          borderRadius: '16px',
                          bgcolor: '#ffedd5',
                          color: crmPalette.orange,
                        }}
                      >
                        <CalendarDays size={22} />
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: crmPalette.orangeDark,

                            fontSize: 18,

                            fontWeight: 900,
                          }}
                        >
                          Próxima ação
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.8,

                            color: '#1e293b',

                            fontSize: 16,

                            fontWeight: 900,

                            lineHeight: 1.55,
                          }}
                        >
                          {commercialInfo.nextAction ||
                            'Sem próxima ação cadastrada.'}
                        </Typography>

                        <Box
                          sx={{
                            mt: 1.5,
                            width: 'fit-content',
                            px: 1.5,
                            py: 0.75,
                            borderRadius: '10px',
                            bgcolor: '#ffedd5',
                            color: '#9a3412',
                            fontSize: 14,
                            fontWeight: 800,
                          }}
                        >
                          Volume mensal:{' '}
                          <Box
                            component="strong"
                            sx={{
                              color: crmPalette.orange,
                            }}
                          >
                            {commercialInfo.monthlyEstimatedValue ||
                              '-'}
                          </Box>
                        </Box>
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </Paper>


            <LeadStagePipeline
              currentStatus={lead.status}
              canEdit={canConvert}
              loading={updatingStage}
              onChange={handleUpdateLeadStage}
            />


            <Box
              sx={{
                display: 'grid',

                gap: 3,

                gridTemplateColumns: {
                  xs: '1fr',
                  xl: '1.35fr 0.65fr',
                },

                alignItems: 'stretch',
              }}
            >
              <CrmSection
                sx={{
                  p: { xs: 2, md: 3 },
                  height: '100%',
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: '12px',
                      bgcolor: '#fff0e8',
                      color: crmPalette.orange,
                    }}
                  >
                    <UserRoundCheck size={22} />
                  </Avatar>
                  <Box>
                    <Typography component="h2" sx={{ fontSize: 22, fontWeight: 900 }}>
                      Dados do lead
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                      Informações principais para atendimento comercial.
                    </Typography>
                  </Box>
                </Stack>

                <Box
                  sx={{
                    mt: 3,

                    p: {
                      xs: 2,
                      md: 2.5,
                    },

                    bgcolor: '#fff7ed',

                    borderLeft: `4px solid ${crmPalette.orange}`,

                    borderRadius: '0 12px 12px 0',
                  }}
                >
                  <Typography
                    sx={{
                      color: crmPalette.orangeDark,

                      fontSize: 11,

                      fontWeight: 900,

                      letterSpacing: '.12em',

                      textTransform: 'uppercase',
                    }}
                  >
                    Orientação da etapa atual
                  </Typography>

                  <Box
                    sx={{
                      mt: 1.5,

                      display: 'grid',

                      gap: 2,

                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, minmax(0, 1fr))',
                      },
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color: '#64748b',

                          fontSize: 12,

                          fontWeight: 900,
                        }}
                      >
                        Critério
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,

                          color: '#1f2937',

                          fontSize: 13,

                          lineHeight: 1.6,
                        }}
                      >
                        {currentStageInfo.criterion}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        sx={{
                          color: '#64748b',

                          fontSize: 12,

                          fontWeight: 900,
                        }}
                      >
                        Ação recomendada
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,

                          color: '#1f2937',

                          fontSize: 13,

                          lineHeight: 1.6,
                        }}
                      >
                        {currentStageInfo.action}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, minmax(0, 1fr))',
                    },
                  }}
                >
                  <DetailField label="E-mail" value={lead.email} />
                  <DetailField label="Telefone" value={lead.phone} />
                  {/* <DetailField label="Canal" value={lead.channel} /> */}
                  <DetailField label="Criado em" value={formatDate(lead.createdAt)} />
                </Box>

                <Divider sx={{ my: 2.5 }} />

                <Typography component="h3" sx={{ mb: 2, fontSize: 16, fontWeight: 900 }}>
                  Informações comerciais
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'repeat(2, minmax(0, 1fr))',
                    },
                  }}
                >
                  <DetailField label="Segmento" value={commercialInfo.segment} />
                  <DetailField label="Transporte" value={commercialInfo.transport} />
                  <DetailField label="Armazenagem" value={commercialInfo.storage} />
                  <DetailField label="Data de entrada" value={commercialInfo.entryDate} />
                  <DetailField
                    label="Última interação"
                    value={commercialInfo.lastInteractionDate}
                  />
                  <DetailField
                    label="Volume mensal estimado"
                    value={commercialInfo.monthlyEstimatedValue}
                  />
                  <DetailField label="Responsável" value={commercialInfo.responsible} />
                  <DetailField label="Status atual" value={commercialInfo.currentStatus} />
                  <DetailField label="Próxima ação" value={commercialInfo.nextAction} />
                </Box>

                {lead.externalContactId || lead.externalMessageId || lead.sourcePhone ? (
                  <>
                    <Divider sx={{ my: 2.5 }} />
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: {
                          xs: '1fr',
                          md: 'repeat(3, minmax(0, 1fr))',
                        },
                      }}
                    >
                      <DetailField label="Contato externo" value={lead.externalContactId} />
                      <DetailField label="Mensagem externa" value={lead.externalMessageId} />
                      <DetailField label="Número de origem" value={lead.sourcePhone} />
                    </Box>
                  </>
                ) : null}
              </CrmSection>

              <CrmSection
                sx={{
                  p: { xs: 2, md: 3 },
                  height: '100%',
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: '12px',
                      bgcolor: '#fff7d6',
                      color: '#8a5a00',
                    }}
                  >
                    <Clock size={22} />
                  </Avatar>
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        component="h2"
                        sx={{
                          fontSize: 22,
                          fontWeight: 900,
                        }}
                      >
                        Timeline
                      </Typography>

                      <Chip
                        size="small"
                        label={`${lead.timeline?.length ?? 0} eventos`}
                        sx={{
                          height: 24,

                          bgcolor: '#f1f5f9',

                          color: '#64748b',

                          fontSize: 11,

                          fontWeight: 800,
                        }}
                      />
                    </Stack>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                      Histórico de criação e atualizações do lead.
                    </Typography>
                  </Box>
                </Stack>

                <Box
                  sx={{
                    mt: 3,

                    maxHeight: {
                      xs: 500,
                      xl: 620,
                    },

                    overflowY: 'auto',

                    pr: 1,

                    scrollbarWidth: 'thin',

                    scrollbarColor:
                      'rgba(100,116,139,0.30) transparent',

                    '&::-webkit-scrollbar': {
                      width: 6,
                    },

                    '&::-webkit-scrollbar-track': {
                      bgcolor: 'transparent',
                    },

                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'rgba(100,116,139,0.25)',

                      borderRadius: 999,
                    },

                    '&::-webkit-scrollbar-thumb:hover': {
                      bgcolor: 'rgba(100,116,139,0.40)',
                    },
                  }}
                >
                  <LeadTimelineList
                    events={lead.timeline ?? []}
                  />
                </Box>
              </CrmSection>

              <CrmSection
                sx={{
                  p: { xs: 2, md: 3 },
                  gridColumn: {
                    xs: 'auto',
                    xl: '1 / -1',
                  },
                }}
              >
                {/* CABEÇALHO */}
                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row',
                  }}
                  spacing={1.5}
                  sx={{
                    mb: 2.5,

                    justifyContent: 'space-between',

                    alignItems: {
                      xs: 'flex-start',
                      sm: 'center',
                    },
                  }}
                >
                  <Box>
                    <Typography
                      component="h3"
                      sx={{
                        color: '#1e293b',
                        fontSize: 18,
                        fontWeight: 900,
                      }}
                    >
                      Observações comerciais
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.4,

                        color: '#64748b',

                        fontSize: 13,

                        lineHeight: 1.5,
                      }}
                    >
                      Registre informações importantes sobre negociações,
                      retornos e decisões tomadas nesta etapa.
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={getLeadFunnelStageLabel(lead.status)}
                    sx={{
                      height: 28,

                      bgcolor: '#fff7ed',

                      color: '#c2410c',

                      border: '1px solid #fed7aa',

                      fontWeight: 900,
                    }}
                  />
                </Stack>

                {/* OBSERVAÇÃO ANTIGA */}
                {lead.notes ? (
                  <Box
                    sx={{
                      mb: 2.5,

                      px: 2,
                      py: 1.5,

                      bgcolor: '#f8fafc',

                      borderRadius: '10px',

                      borderLeft: '3px solid #94a3b8',
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#64748b',

                        fontSize: 10.5,

                        fontWeight: 900,

                        textTransform: 'uppercase',

                        letterSpacing: '.08em',
                      }}
                    >
                      Observação inicial
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.7,

                        color: '#475569',

                        fontSize: 13,

                        lineHeight: 1.6,
                      }}
                    >
                      {lead.notes}
                    </Typography>
                  </Box>
                ) : null}

                {/* NOVA OBSERVAÇÃO */}
                <Box
                  sx={{
                    p: 2,

                    borderRadius: '12px',

                    bgcolor: '#fafafa',

                    border: '1px solid #e2e8f0',
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    maxRows={6}
                    value={observationText}
                    disabled={savingObservation}
                    onChange={(event) =>
                      setObservationText(event.target.value)
                    }
                    placeholder={`Registrar uma observação em ${getLeadFunnelStageLabel(
                      lead.status,
                    )}...`}
                    slotProps={{
                      htmlInput: {
                        maxLength: 3000,
                      },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#ffffff',

                        borderRadius: '10px',

                        '&.Mui-focused fieldset': {
                          borderColor: '#ff5805',
                        },
                      },
                    }}
                  />

                  <Stack
                    direction={{
                      xs: 'column',
                      sm: 'row',
                    }}
                    spacing={1.5}
                    sx={{
                      mt: 1.5,

                      justifyContent: 'space-between',

                      alignItems: {
                        xs: 'stretch',
                        sm: 'center',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#94a3b8',

                        fontSize: 11.5,
                      }}
                    >
                      {observationText.length}/3000 caracteres
                    </Typography>

                    <Button
                      type="button"
                      variant="contained"
                      onClick={handleAddObservation}
                      disabled={
                        savingObservation ||
                        !observationText.trim()
                      }
                      sx={{
                        minHeight: 40,

                        px: 2.25,

                        borderRadius: '10px',

                        bgcolor: '#ff5805',

                        fontSize: 13,

                        fontWeight: 900,

                        textTransform: 'none',

                        boxShadow: 'none',

                        '&:hover': {
                          bgcolor: '#e94f00',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      {savingObservation
                        ? 'Adicionando...'
                        : 'Adicionar observação'}
                    </Button>
                  </Stack>
                </Box>

                {/* HISTÓRICO */}
                <Divider sx={{ my: 3 }} />

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    mb: 2,

                    alignItems: 'center',

                    justifyContent: 'space-between',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#334155',

                      fontSize: 13,

                      fontWeight: 900,
                    }}
                  >
                    Histórico de observações
                  </Typography>

                  <Chip
                    size="small"
                    label={`${observations.length} ${observations.length === 1
                      ? 'observação'
                      : 'observações'
                      }`}
                    sx={{
                      height: 24,

                      bgcolor: '#f1f5f9',

                      color: '#64748b',

                      fontSize: 11,

                      fontWeight: 800,
                    }}
                  />
                </Stack>

                {loadingObservations ? (
                  <Box
                    sx={{
                      py: 5,

                      display: 'flex',

                      justifyContent: 'center',
                    }}
                  >
                    <CircularProgress
                      size={24}
                      sx={{
                        color: '#ff5805',
                      }}
                    />
                  </Box>
                ) : (
                  <LeadObservationsList
                    observations={observations}
                  />
                )}
              </CrmSection>
            </Box>
          </>
        ) : null
        }
      </CrmPageShell >

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 26px 80px rgba(15,23,42,0.22)',
            },
          },
        }}
      >
        <Box
          sx={{
            px: { xs: 2.25, md: 3 },
            py: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fff7ed',
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Avatar
              src={commercialInfo.logoUrl}
              variant="rounded"
              sx={{
                width: 54,
                height: 54,
                borderRadius: '16px',
                bgcolor: '#ffedd5',
                color: crmPalette.orange,
                border: '1px solid #fed7aa',
              }}
            >
              <Edit3 size={24} />
            </Avatar>
            <Box>
              <Typography component="h2" sx={{ color: '#1f2937', fontSize: 26, fontWeight: 950, lineHeight: 1.1 }}>
                Editar lead
              </Typography>
              <Typography sx={{ mt: 0.75, color: '#64748b', fontSize: 15 }}>
                Atualize os dados, a logo/foto e a etapa do funil.
              </Typography>
            </Box>
          </Stack>
        </Box>
        <DialogContent sx={{ p: { xs: 2.25, md: 3 }, bgcolor: '#ffffff' }}>
          <LeadForm
            key={lead?.id ?? 'edit-lead'}
            loading={editing}
            initialValues={editInitialValues}
            submitLabel="Salvar alterações"
            onSubmit={handleEditLead}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: '14px',
            },
          },
        }}
      >
        <Box component="form" onSubmit={handleConvertLead}>
          <DialogTitle sx={{ fontWeight: 900 }}>Converter lead em cliente</DialogTitle>
          <DialogContent dividers>
            <Typography sx={{ mb: 2.5, color: 'text.secondary' }}>
              Confirme os dados cadastrais e informe o CNPJ/documento para criar
              o acesso do cliente.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))',
                },
              }}
            >
              <TextField
                label="CNPJ/documento"
                value={convertForm.document}
                onChange={(event) =>
                  setConvertForm((current) => ({
                    ...current,
                    document: event.target.value,
                  }))
                }
                required
                sx={fieldSx}
              />
              {/* <TextField
                label="Senha inicial"
                type="password"
                onChange={(event) =>
                  setConvertForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
                sx={fieldSx}
              /> */}
              <TextField
                label="Nome"
                value={convertForm.name}
                onChange={(event) =>
                  setConvertForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                sx={fieldSx}
              />
              <TextField
                label="E-mail"
                type="email"
                value={convertForm.email}
                onChange={(event) =>
                  setConvertForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
                sx={fieldSx}
              />
              <TextField
                label="Empresa / razão social"
                value={convertForm.companyName}
                onChange={(event) =>
                  setConvertForm((current) => ({
                    ...current,
                    companyName: event.target.value,
                  }))
                }
                sx={fieldSx}
              />
              <TextField
                label="Telefone"
                value={convertForm.phone}
                onChange={(event) =>
                  setConvertForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                sx={fieldSx}
              />
              <TextField
                label="Segmento"
                value={convertForm.segment}
                onChange={(event) =>
                  setConvertForm((current) => ({
                    ...current,
                    segment: event.target.value,
                  }))
                }
                sx={fieldSx}
              />
              <TextField
                select
                label="Status do cliente"
                value={convertForm.status}
                onChange={(event) =>
                  setConvertForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
                sx={fieldSx}
              >
                <MenuItem value="PENDENTE">Pendente</MenuItem>
                <MenuItem value="ATIVO">Ativo</MenuItem>
                <MenuItem value="INATIVO">Inativo</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => setConvertOpen(false)}
              sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={converting}
              sx={{
                borderRadius: '10px',
                bgcolor: crmPalette.orange,
                fontWeight: 900,
                textTransform: 'none',
                '&:hover': { bgcolor: crmPalette.orangeDark },
              }}
            >
              {converting ? 'Convertendo...' : 'Criar cliente'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <FeedbackToast
        open={!!toast}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'success'}
        onClose={() => setToast(null)}
      />
    </AppLayout >
  );
}
