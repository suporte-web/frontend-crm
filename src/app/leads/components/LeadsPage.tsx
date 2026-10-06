'use client';

import { hasAnyRole } from "@/lib/user-roles";
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { ArrowRight, Globe2, UserPlus, Users, X } from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import { LeadForm } from '@/components/leads/lead-form';
import { getLeadSourceLabel } from '@/components/leads/lead-timeline';
import {
  LEAD_FUNNEL_STAGES,
  getLeadFunnelStageLabel,
  normalizeLeadFunnelStage,
} from '@/constants/lead-funnel';
import {
  CrmKpiCard,
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';
import { FeedbackToast } from '@/components/ui/feedback-toast';
import { useAuth } from '@/context/auth-context';
import { createLead, getLeads, getLeadsResumo } from '@/services/leads.service';
import type { CreateLeadPayload, Lead, LeadsResumo } from '@/types/leads';

const internalRoles = new Set(['ADMIN', 'GESTAO', 'COMERCIAL', 'MARKETING']);


const fieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 44,
    borderRadius: '10px',
    bgcolor: '#fff',
  },
};

function formatDate(date: string) {
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

function getClientIdFromLead(lead: Lead) {
  const metadata = lead.metadata;

  if (
    !metadata ||
    Array.isArray(metadata) ||
    typeof metadata !== 'object'
  ) {
    return '';
  }

  return typeof metadata.clientId === 'string'
    ? metadata.clientId
    : '';
}


export default function LeadsPage() {
  const { user, token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visao, setVisao] = useState<'ativos' | 'convertidos'>('ativos');
  const [resumoLeads, setResumoLeads] = useState<LeadsResumo>({
    ativos: 0,
    convertidos: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [manualLoading, setManualLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: 'success' | 'error';
  } | null>(null);
  const [filters, setFilters] = useState({
    q: '',
    source: '',
    status: '',
  });

  const isAllowed = user?.role
    ? hasAnyRole(user, [...internalRoles])
    : false;

  const visibleLeads = leads;

  const summary = useMemo(() => {
    const total = visibleLeads.length;

    const manual = visibleLeads.filter(
      (lead) => lead.source === 'manual',
    ).length;

    const site = visibleLeads.filter(
      (lead) => lead.source === 'site',
    ).length;

    const fresh = visibleLeads.filter(
      (lead) =>
        normalizeLeadFunnelStage(lead.status) === 'entrada_leads',
    ).length;

    return {
      total,
      manual,
      site,
      fresh,
    };
  }, [visibleLeads]);


  async function loadData() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setPageError('');

      const [leadData, resumoData] = await Promise.all([
        getLeads(token, {
          ...filters,
          convertidoParaCliente: visao === 'convertidos',
        }),

        getLeadsResumo(token),
      ]);

      setLeads(leadData);
      setResumoLeads(resumoData);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar os leads.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAllowed && token) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAllowed, token, visao]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData();
  }

  async function handleManualCreate(payload: CreateLeadPayload): Promise<boolean> {
    if (!token) {
      return false;
    }

    try {
      setManualLoading(true);
      await createLead(payload, token);
      await loadData();
      setToast({
        title: 'Lead criado',
        message: 'Cadastro manual concluído com sucesso.',
        variant: 'success',
      });
      setCreateOpen(false);
      return true;
    } catch (error) {
      setToast({
        title: 'Falha ao criar lead',
        message: error instanceof Error ? error.message : 'Erro ao criar lead.',
        variant: 'error',
      });
      return false;
    } finally {
      setManualLoading(false);
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
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Comercial"
          title="Leads"
          description="Entrada manual e cotações recebidas pelo site em uma base única para o comercial."
          icon={<Users size={24} />}
          aside={
            <Button
              type="button"
              variant="contained"
              startIcon={<UserPlus size={18} />}
              onClick={() => setCreateOpen(true)}
              sx={{
                minHeight: 44,
                borderRadius: '12px',
                bgcolor: crmPalette.orange,
                fontWeight: 900,
                textTransform: 'none',
                '&:hover': { bgcolor: crmPalette.orangeDark },
              }}
            >
              Novo lead
            </Button>
          }
        />

        <Box
          sx={{
            display: 'grid',

            gap: {
              xs: 1.5,
              md: 2,
            },

            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },

            alignItems: 'stretch',
            gridAutoRows: '1fr',
          }}
        >
          <CrmKpiCard
            title="Total"
            value={summary.total}
            icon={<Users size={22} />}
            accent="#ff5805"
            softColor="#ff58051a"
            sx={{
              minHeight: 140,
              height: '100%',
            }}
          />

          <CrmKpiCard
            title="Manual"
            value={summary.manual}
            icon={<UserPlus size={22} />}
            accent="#f59e0b"
            softColor="#f59e0b1a"
            sx={{
              minHeight: 140,
              height: '100%',
            }}
          />

          <CrmKpiCard
            title="Site"
            value={summary.site}
            icon={<Globe2 size={22} />}
            accent="#f97316"
            softColor="#f973161a"
            sx={{
              minHeight: 140,
              height: '100%',
            }}
          />

          <CrmKpiCard
            title="Entrada"
            value={summary.fresh}
            icon={<ArrowRight size={22} />}
            accent="#ef4444"
            softColor="#ef44441a"
            sx={{
              minHeight: 140,
              height: '100%',
            }}
          />
        </Box>

        {pageError ? <Alert severity="error">{pageError}</Alert> : null}

        <CrmSection
          sx={{
            p: {
              xs: 2,
              md: 3,
            },

            bgcolor: '#fffaf7',

            border: '1px solid rgba(255,88,5,0.10)',

            borderRadius: '18px',

            boxShadow: '0 10px 35px rgba(15,23,42,0.05)',
          }}
        >
          <Stack
            spacing={2.5}
            sx={{
              width: '100%',
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: crmPalette.orangeDark,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: '.16em',
                  textTransform: 'uppercase',
                }}
              >
                Pipeline de entrada
              </Typography>
              <Typography
                component="h2"
                sx={{
                  mt: 0.5,
                  fontSize: 26,
                  fontWeight: 900,
                }}
              >
                {visao === 'ativos'
                  ? 'Base de leads'
                  : 'Convertidos em clientes'}
              </Typography>

              <Typography
                sx={{
                  mt: 0.75,
                  color: 'text.secondary',
                }}
              >
                {visao === 'ativos'
                  ? 'Lista operacional para acompanhar leads manuais e do site.'
                  : 'Histórico de leads que foram convertidos em clientes.'}
              </Typography>

            </Box>

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
              {/* LEADS ATIVOS */}
              <Paper
                component="button"
                type="button"
                elevation={0}
                onClick={() => setVisao('ativos')}
                sx={{
                  p: 2,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '14px',

                  border: '1px solid',
                  borderColor:
                    visao === 'ativos'
                      ? crmPalette.orange
                      : 'rgba(15,23,42,0.10)',

                  bgcolor:
                    visao === 'ativos'
                      ? '#fff7ed'
                      : '#ffffff',

                  transition: 'all 0.2s ease',

                  '&:hover': {
                    borderColor: crmPalette.orange,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  },
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: '#64748b',
                        fontSize: 12,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                      }}
                    >
                      Leads ativos
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.5,
                        color: '#0f172a',
                        fontSize: 28,
                        fontWeight: 950,
                      }}
                    >
                      {resumoLeads.ativos}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        color: '#64748b',
                        fontSize: 13,
                      }}
                    >
                      Em acompanhamento comercial
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '12px',
                      bgcolor:
                        visao === 'ativos'
                          ? '#ffedd5'
                          : '#f8fafc',
                      color: crmPalette.orange,
                    }}
                  >
                    <Users size={21} />
                  </Box>
                </Stack>
              </Paper>

              {/* CONVERTIDOS EM CLIENTES */}
              <Paper
                component="button"
                type="button"
                elevation={0}
                onClick={() => setVisao('convertidos')}
                sx={{
                  p: 2,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '14px',

                  border: '1px solid',
                  borderColor:
                    visao === 'convertidos'
                      ? '#16a34a'
                      : 'rgba(15,23,42,0.10)',

                  bgcolor:
                    visao === 'convertidos'
                      ? '#f0fdf4'
                      : '#ffffff',

                  transition: 'all 0.2s ease',

                  '&:hover': {
                    borderColor: '#16a34a',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                  },
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: '#64748b',
                        fontSize: 12,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                      }}
                    >
                      Convertidos em clientes
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.5,
                        color: '#0f172a',
                        fontSize: 28,
                        fontWeight: 950,
                      }}
                    >
                      {resumoLeads.convertidos}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.25,
                        color: '#64748b',
                        fontSize: 13,
                      }}
                    >
                      Leads que já viraram clientes
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '12px',
                      bgcolor:
                        visao === 'convertidos'
                          ? '#dcfce7'
                          : '#f8fafc',
                      color: '#16a34a',
                    }}
                  >
                    <UserPlus size={21} />
                  </Box>
                </Stack>
              </Paper>
            </Box>

            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                width: '100%',

                display: 'grid',

                gap: 1.5,

                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'minmax(260px, 2fr) minmax(160px, 1fr) minmax(170px, 1fr) 120px',
                },

                alignItems: 'end',
              }}
            >
              <TextField
                label="Buscar"
                size="small"
                value={filters.q}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, q: event.target.value }))
                }
                placeholder="Nome, e-mail ou empresa"
                sx={fieldSx}
              />
              <TextField
                select
                label="Origem"
                size="small"
                value={filters.source}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, source: event.target.value }))
                }
                sx={fieldSx}
              >
                <MenuItem value="">Manual e site</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
                <MenuItem value="site">Site</MenuItem>
              </TextField>
              <TextField
                select
                label="Etapa"
                size="small"
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, status: event.target.value }))
                }
                sx={fieldSx}
              >
                <MenuItem value="">Todas</MenuItem>
                {LEAD_FUNNEL_STAGES.map((stage) => (
                  <MenuItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  minHeight: 40,
                  borderRadius: '10px',
                  fontWeight: 900,
                  textTransform: 'none',
                }}
              >
                Filtrar
              </Button>
            </Box>
          </Stack>

          {loading ? (
            <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : visibleLeads.length === 0 ? (
            <Alert severity="info" sx={{ mt: 3 }}>
              {visao === 'ativos'
                ? 'Nenhum lead ativo encontrado.'
                : 'Nenhum lead convertido em cliente encontrado.'}
            </Alert>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 3 }}>
              {visibleLeads.map((lead) => (
                <Paper
                  key={lead.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '14px',
                    bgcolor: '#fff',
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: {
                        xs: '1fr',
                        lg: '1.6fr .8fr .8fr 1fr auto',
                      },
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 900 }}>
                        {lead.name}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.5,
                          color: 'text.secondary',
                          fontSize: 13,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {lead.email || lead.phone || 'Sem contato principal'}
                      </Typography>
                      {lead.company ? (
                        <Typography sx={{ mt: 0.25, color: 'text.disabled', fontSize: 13 }}>
                          {lead.company}
                        </Typography>
                      ) : null}
                    </Box>

                    <Box>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
                        Origem
                      </Typography>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={getLeadSourceLabel(lead.source)}
                        sx={{ mt: 1, fontWeight: 800, ...getLeadSourceChipSx(lead.source) }}
                      />
                    </Box>

                    <Box>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
                        Etapa
                      </Typography>
                      <Typography sx={{ mt: 1, fontSize: 14, fontWeight: 900 }}>
                        {getLeadStatusLabel(lead.status)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
                        Criado em
                      </Typography>
                      <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 14 }}>
                        {formatDate(lead.createdAt)}
                      </Typography>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ justifyContent: 'flex-end' }}
                    >
                      {visao === 'convertidos' && getClientIdFromLead(lead) ? (
                        <Button
                          component={Link}
                          href={`/clientes/${getClientIdFromLead(lead)}`}
                          variant="outlined"
                          endIcon={<ArrowRight size={16} />}
                          sx={{
                            borderRadius: '10px',
                            borderColor: '#16a34a',
                            color: '#15803d',
                            fontWeight: 800,
                            textTransform: 'none',

                            '&:hover': {
                              borderColor: '#15803d',
                              bgcolor: '#f0fdf4',
                            },
                          }}
                        >
                          Ver cliente
                        </Button>
                      ) : (
                        <Button
                          component={Link}
                          href={`/leads/${lead.id}`}
                          variant="outlined"
                          endIcon={<ArrowRight size={16} />}
                          sx={{
                            borderRadius: '10px',
                            fontWeight: 800,
                            textTransform: 'none',
                          }}
                        >
                          Detalhes
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </CrmSection>
      </CrmPageShell>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
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
          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                display: 'grid',
                placeItems: 'center',
                flex: '0 0 auto',
                borderRadius: '16px',
                bgcolor: '#ffedd5',
                color: crmPalette.orange,
              }}
            >
              <UserPlus size={25} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography component="h2" sx={{ color: '#1f2937', fontSize: 26, fontWeight: 950, lineHeight: 1.1 }}>
                Novo lead
              </Typography>
              <Typography sx={{ mt: 0.75, color: '#64748b', fontSize: 15 }}>
                Inclua os dados comerciais, logo/foto e informações do funil.
              </Typography>
            </Box>
            <IconButton
              aria-label="Fechar"
              onClick={() => setCreateOpen(false)}
              sx={{
                color: '#64748b',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: '#fff',
                '&:hover': { bgcolor: '#f8fafc' },
              }}
            >
              <X size={20} />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ p: { xs: 2.25, md: 3 }, bgcolor: '#ffffff' }}>
          <LeadForm loading={manualLoading} onSubmit={handleManualCreate} />
        </DialogContent>
      </Dialog>

      <FeedbackToast
        open={!!toast}
        title={toast?.title ?? ''}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'success'}
        onClose={() => setToast(null)}
      />
    </AppLayout>
  );
}
