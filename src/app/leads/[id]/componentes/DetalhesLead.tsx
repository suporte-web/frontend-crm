'use client';

import { LeadAttachments } from "@/components/attachments/LeadAttachments";
import { IdentificacaoProspeccao } from "@/components/crm/prospeccao-consultora";
import { hasAnyRole } from "@/lib/user-roles";
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

import {

  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,

} from '@mui/material';

import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Edit3,
  Mail,
  UserRoundCheck,
  MoreVertical,
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
  solicitarExclusaoLead,
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

const internalRoles = new Set(['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING', 'CONSULTORA']);
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
    <TextField
      fullWidth
      size="small"
      label={label}
      value={value || ""}
      placeholder="Não informado"
      slotProps={{
        input: {
          readOnly: true,
        },
        inputLabel: {
          shrink: true,
        },
      }}
      sx={{
        minWidth: 0,

        "& .MuiOutlinedInput-root": {
          minHeight: 42,
          borderRadius: "10px",
          bgcolor: "#ffffff",
        },

        "& .MuiInputBase-input": {
          fontSize: 13,
          fontWeight: 500,
          color: "#334155",
          textOverflow: "ellipsis",
        },

        "& .MuiInputLabel-root": {
          fontSize: 13,
          color: "#64748b",
        },

        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#e2e8f0",
        },
      }}
    />
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
    (stage) => stage.value === normalizedStatus
  );

  return (
    <CrmSection
      sx={{
        p: { xs: 2, md: 2.5 },
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      <Stack spacing={2}>
        {/* CABEÇALHO */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              component="h2"
              sx={{
                fontSize: 18,
                fontWeight: 800,
                color: "#1f2937",
              }}
            >
              Etapas do funil comercial
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontSize: 13,
                color: "#64748b",
              }}
            >
              Acompanhe a evolução do lead no processo comercial.
            </Typography>
          </Box>

          <Chip
            size="small"
            label={
              loading
                ? "Atualizando etapa..."
                : `Atual: ${getLeadStatusLabel(currentStatus)}`
            }
            sx={{
              height: 30,
              borderRadius: "8px",
              bgcolor: "#fff7ed",
              color: "#c2410c",
              border: "1px solid #fed7aa",
              fontSize: 12,
              fontWeight: 700,
            }}
          />
        </Stack>

        {/* ETAPAS ORIGINAIS DO CRM */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            pt: 1,
            pb: 1.5,
            scrollbarWidth: "thin",
          }}
        >
          {LEAD_FUNNEL_STAGES.map((stage, index) => {
            const isActive = stage.value === normalizedStatus;
            const isPrevious =
              currentIndex >= 0 && index < currentIndex;

            return (
              <Button
                key={stage.value}
                type="button"
                aria-current={isActive ? "step" : undefined}
                disabled={!canEdit || loading}
                onClick={() => {
                  if (!isActive) {
                    void onChange(stage.value);
                  }
                }}
                sx={{
                  flex: "1 0 155px",
                  minWidth: 155,
                  minHeight: 72,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: isActive ? "#ff5805" : "#e2e8f0",
                  bgcolor: isActive ? "#fff7ed" : "#ffffff",
                  color: isActive ? "#c2410c" : "#475569",
                  textTransform: "none",
                  boxShadow: "none",
                  justifyContent: "flex-start",
                  gap: 1.25,
                  transition: "all 0.2s ease",

                  "&:hover": {
                    bgcolor: isActive ? "#ffedd5" : "#f8fafc",
                    borderColor: "#ff5805",
                    boxShadow: "none",
                  },

                  "&.Mui-disabled": {
                    opacity: 0.85,
                    color: isActive ? "#c2410c" : "#64748b",
                    bgcolor: isActive ? "#fff7ed" : "#f8fafc",
                    borderColor: isActive ? "#ff5805" : "#e2e8f0",
                  },
                }}
              >
                {/* INDICADOR DA ETAPA */}
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    flexShrink: 0,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: isActive
                      ? "#ff5805"
                      : isPrevious
                        ? "#e2e8f0"
                        : "#f1f5f9",
                    color: isActive ? "#ffffff" : "#64748b",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {index + 1}
                </Box>

                {/* NOME ORIGINAL DA ETAPA */}
                <Box sx={{ minWidth: 0, textAlign: "left" }}>
                  <Typography
                    sx={{
                      color: "inherit",
                      fontSize: 12.5,
                      fontWeight: isActive ? 800 : 600,
                      lineHeight: 1.4,
                      whiteSpace: "normal",
                      overflowWrap: "break-word",
                    }}
                  >
                    {stage.label}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      color: isActive ? "#c2410c" : "#94a3b8",
                      fontSize: 10.5,
                      fontWeight: 600,
                    }}
                  >
                    {isActive
                      ? "Etapa atual"
                      : isPrevious
                        ? "Etapa anterior"
                        : "Próxima etapa"}
                  </Typography>
                </Box>
              </Button>
            );
          })}
        </Box>

        {!canEdit && (
          <Typography
            sx={{
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            Seu perfil pode visualizar o funil, mas não pode alterar a etapa.
          </Typography>
        )}
      </Stack>
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
          py: 3,
          px: 2,
          textAlign: "center",
          borderRadius: "10px",
          bgcolor: "#f8fafc",
          border: "1px dashed #dce3eb",
        }}
      >
        <Typography
          sx={{
            color: "#475569",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Nenhuma observação registrada
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            color: "#94a3b8",
            fontSize: 12,
          }}
        >
          O histórico de observações aparecerá aqui.
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

export default function DetalhesLead() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [deletingLead, setDeletingLead] = useState(false);
  const [leadDeletionRequestOpen, setLeadDeletionRequestOpen] = useState(false);
  const [leadDeletionReason, setLeadDeletionReason] = useState("");
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
  const [menuAnchorEl, setMenuAnchorEl] =
    useState<HTMLElement | null>(null);

  const menuAberto = Boolean(menuAnchorEl);

  const fecharMenu = () => {
    setMenuAnchorEl(null);
  };

  const excluirPeloMenu = () => {
    fecharMenu();
    if (user?.role === "CONSULTORA") {
      setLeadDeletionReason("");
      setLeadDeletionRequestOpen(true);
      return;
    }
    void handleExcluirLead();
  };
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

  const isAllowed = user?.role ? hasAnyRole(user, [...internalRoles]) : false;
  const canConvert = user?.role ? hasAnyRole(user, [...converterRoles]) : false;
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
        const [dadosLead, observationsData] = await Promise.all([
          getLeadById(id, token),
          getLeadObservations(id, token),
        ]);

        setLead(dadosLead);
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
    if (!token || !lead || deletingLead) {
      return;
    }

    const consultora = hasAnyRole(user, ["CONSULTORA"]) && !hasAnyRole(user, ["ADMIN", "GESTAO", "COMERCIAL"]);
    const confirmou = consultora || window.confirm(
      `Tem certeza que deseja excluir o lead "${lead.company || lead.name}"?\n\nEssa ação não poderá ser desfeita.`,
    );

    if (!confirmou) {
      return;
    }

    try {
      setDeletingLead(true);
      if (consultora) {
        const reason = leadDeletionReason;
        if (!reason.trim()) {
          setToast({ title: 'Motivo obrigatório', message: 'Informe o motivo para solicitar a exclusão.', variant: 'error' });
          return;
        }
        await solicitarExclusaoLead(lead.id, reason.trim(), token);
        setLeadDeletionRequestOpen(false);
        setLeadDeletionReason("");
        setToast({ title: 'Solicitação enviada', message: 'A exclusão será analisada pelo Comercial ou Gestão.', variant: 'success' });
        return;
      }
      await excluirLead(lead.id, token);

      router.push('/leads');
      router.refresh();
    } catch (deleteError) {
      setToast({
        title: 'Falha ao excluir',
        message:
          deleteError instanceof Error
            ? deleteError.message
            : 'Não foi possível concluir a exclusão do lead.',
        variant: 'error',
      });
    } finally {
      setDeletingLead(false);
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
                      </Typography><IdentificacaoProspeccao registro={lead} />

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
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      flexWrap: 'wrap',
                      gap: 1.2,
                    }}
                  >
                    {/* VOLTAR */}
                    <Button
                      component={Link}
                      href="/leads"
                      startIcon={<ArrowLeft size={18} />}
                      sx={{
                        height: 42,
                        px: 2,
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        bgcolor: '#ffffff',
                        color: '#334155',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#ff5805',
                          bgcolor: '#fff7ed',
                        },
                      }}
                    >
                      Voltar
                    </Button>

                    {/* EDITAR */}
                    {canConvert && (
                      <Button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        startIcon={<Edit3 size={18} />}
                        sx={{
                          height: 42,
                          px: 2,
                          borderRadius: '10px',
                          bgcolor: '#ff5805',
                          color: '#ffffff',
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: '#e94f00',
                          },
                        }}
                      >
                        Editar
                      </Button>
                    )}

                    {/* CONVERTER */}
                    {canConvert && !isConvertedToClient && (
                      <Button
                        type="button"
                        onClick={openConvertModal}
                        startIcon={<UserRoundCheck size={18} />}
                        sx={{
                          height: 42,
                          px: 2,
                          borderRadius: '10px',
                          border: '1px solid #ff5805',
                          bgcolor: '#ffffff',
                          color: '#ff5805',
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: '#fff7ed',
                            borderColor: '#e94f00',
                          },
                        }}
                      >
                        Converter
                      </Button>
                    )}

                    {/* MENU DE TRÊS PONTINHOS */}
                    <Tooltip title="Mais opções">
                      <IconButton
                        type="button"
                        aria-label="Mais opções"
                        aria-haspopup="menu"
                        aria-expanded={menuAberto ? true : undefined}
                        onClick={(event) => setMenuAnchorEl(event.currentTarget)}
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          bgcolor: '#ffffff',
                          color: '#334155',
                          '&:hover': {
                            bgcolor: '#f8fafc',
                            borderColor: '#ff5805',
                          },
                        }}
                      >
                        <MoreVertical size={20} />
                      </IconButton>
                    </Tooltip>

                    {/* OPÇÕES DO MENU */}
                    <Menu
                      anchorEl={menuAnchorEl}
                      open={menuAberto}
                      onClose={fecharMenu}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      slotProps={{
                        paper: {
                          sx: {
                            mt: 1,
                            minWidth: 170,
                            borderRadius: '10px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                          },
                        },
                      }}
                    >
                      <MenuItem
                        onClick={excluirPeloMenu}
                        disabled={deletingLead || !hasAnyRole(user, ["ADMIN", "GESTAO", "COMERCIAL", "CONSULTORA"])}
                        sx={{
                          color: '#dc2626',
                          fontWeight: 500,
                          fontSize: 14,
                          py: 1.2,
                          '&:hover': {
                            bgcolor: '#fef2f2',
                          },
                        }}
                      >
                        <ListItemIcon>
                          <DeleteOutlineRoundedIcon
                            fontSize="small"
                            sx={{ color: '#dc2626' }}
                          />
                        </ListItemIcon>

                        <ListItemText primary={user?.role === "CONSULTORA" ? "Solicitar exclusão" : "Excluir lead"} />
                      </MenuItem>
                    </Menu>
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
                  p: { xs: 2, md: 2.5 },
                  height: "100%",
                  bgcolor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  boxShadow: "none",
                }}
              >
                <Stack spacing={2.5}>
                  {/* CABEÇALHO */}
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        bgcolor: "#fff7ed",
                        color: "#ff5805",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <UserRoundCheck size={20} />
                    </Box>

                    <Box>
                      <Typography
                        component="h2"
                        sx={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#1f2937",
                        }}
                      >
                        Dados do lead
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#64748b",
                        }}
                      >
                        Informações cadastrais e comerciais.
                      </Typography>
                    </Box>
                  </Stack>


                  {/* DADOS DE CONTATO */}
                  <Box>
                    <Typography
                      sx={{
                        mb: 2,
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#334155",
                      }}
                    >
                      Dados de contato
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 2,
                      }}
                    >
                      <DetailField label="E-mail" value={lead.email} />
                      <DetailField label="Telefone" value={lead.phone} />
                      <DetailField
                        label="Criado em"
                        value={formatDate(lead.createdAt)}
                      />
                    </Box>
                  </Box>

                  <Divider />

                  {/* INFORMAÇÕES COMERCIAIS */}
                  <Box>
                    <Typography
                      sx={{
                        mb: 2,
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#334155",
                      }}
                    >
                      Informações comerciais
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 2,
                      }}
                    >
                      <DetailField
                        label="Segmento"
                        value={commercialInfo.segment}
                      />

                      <DetailField
                        label="Transporte"
                        value={commercialInfo.transport}
                      />

                      <DetailField
                        label="Armazenagem"
                        value={commercialInfo.storage}
                      />

                      <DetailField
                        label="Data de entrada"
                        value={commercialInfo.entryDate}
                      />

                      <DetailField
                        label="Última interação"
                        value={commercialInfo.lastInteractionDate}
                      />

                      <DetailField
                        label="Volume mensal estimado"
                        value={commercialInfo.monthlyEstimatedValue}
                      />

                      <DetailField
                        label="Responsável"
                        value={commercialInfo.responsible}
                      />

                      <DetailField
                        label="Status atual"
                        value={commercialInfo.currentStatus}
                      />

                      <DetailField
                        label="Próxima ação"
                        value={commercialInfo.nextAction}
                      />
                    </Box>
                  </Box>

                  {/* DADOS EXTERNOS */}
                  {(lead.externalContactId ||
                    lead.externalMessageId ||
                    lead.sourcePhone) && (
                      <>
                        <Divider />

                        <Box>
                          <Typography
                            sx={{
                              mb: 2,
                              fontSize: 14,
                              fontWeight: 800,
                              color: "#334155",
                            }}
                          >
                            Informações de origem
                          </Typography>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                              },
                              gap: 2,
                            }}
                          >
                            <DetailField
                              label="Contato externo"
                              value={lead.externalContactId}
                            />

                            <DetailField
                              label="Mensagem externa"
                              value={lead.externalMessageId}
                            />

                            <DetailField
                              label="Número de origem"
                              value={lead.sourcePhone}
                            />
                          </Box>
                        </Box>
                      </>
                    )}

                  <Divider />

                  {/* ORIENTAÇÃO DA ETAPA ATUAL */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                    }}
                  >
                    <Typography
                      sx={{
                        mb: 1.5,
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#334155",
                      }}
                    >
                      Orientação da etapa atual
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "#64748b",
                            fontWeight: 700,
                          }}
                        >
                          Critério
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.5,
                            fontSize: 13,
                            color: "#334155",
                            lineHeight: 1.6,
                          }}
                        >
                          {currentStageInfo.criterion}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "#64748b",
                            fontWeight: 700,
                          }}
                        >
                          Ação recomendada
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.5,
                            fontSize: 13,
                            color: "#334155",
                            lineHeight: 1.6,
                          }}
                        >
                          {currentStageInfo.action}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Stack>
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

              {token && <CrmSection sx={{ p: { xs: 2, md: 3 }, gridColumn: { xs: 'auto', xl: '1 / -1' } }}>
                <LeadAttachments key={lead.id} leadId={lead.id} token={token} />
              </CrmSection>}

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
                    minRows={2}
                    maxRows={4}
                    size="small"
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
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#ffffff",
                        borderRadius: "10px",
                        fontSize: 13,
                        minHeight: 80,

                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#ff5805",
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
                      p: 1.5,
                      borderRadius: "10px",
                      bgcolor: "#f8fafc",
                      border: "1px solid #e2e8f0",
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
                        height: 36,
                        minHeight: 36,
                        px: 2,
                        borderRadius: "10px",
                        bgcolor: "#ff5805",
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "none",
                        boxShadow: "none",

                        "&:hover": {
                          bgcolor: "#e94f00",
                          boxShadow: "none",
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
              <Divider sx={{ my: 2 }} />

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
            onCancelar={() => setEditOpen(false)}
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

      <Dialog open={leadDeletionRequestOpen} onClose={() => { if (!deletingLead) setLeadDeletionRequestOpen(false); }} fullWidth maxWidth="sm">
        <DialogTitle>Solicitar exclusão do lead</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>O lead continuará disponível até que o Comercial ou a Gestão aprove a exclusão.</Alert>
          <TextField label="Motivo da exclusão" fullWidth multiline minRows={3} required value={leadDeletionReason} disabled={deletingLead} onChange={event => setLeadDeletionReason(event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} />
        </DialogContent>
        <DialogActions>
          <Button disabled={deletingLead} onClick={() => setLeadDeletionRequestOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={deletingLead || !leadDeletionReason.trim()} onClick={() => void handleExcluirLead()}>{deletingLead ? "Enviando..." : "Solicitar exclusão"}</Button>
        </DialogActions>
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
function handleExcluirLead() {
  throw new Error("Function not implemented.");
}

