'use client';

import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  History,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Tags,
} from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import {
  CrmKpiCard,
  CrmPageHeader,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from '@/components/mui/crm-primitives';
import { useAuth } from '@/context/auth-context';
import {
  exportAuditLogs,
  getAuditLogSummary,
  getAuditLogs,
} from '@/services/audit-logs.service';
import { getUsers } from '@/services/users.service';
import type {
  AuditLog,
  AuditLogCategory,
  AuditLogSummary,
} from '@/types/audit-logs';
import type { User } from '@/types/user';

const allowedRoles = new Set(['ADMIN', 'GESTAO']);

const categories: Array<'TODOS' | AuditLogCategory> = [
  'TODOS',
  'ACCESS',
  'AUTH',
  'USER',
  'CLIENT',
  'QUOTE',
  'TICKET',
  'TRACKING',
  'SYSTEM',
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const categoryLabels: Record<'TODOS' | AuditLogCategory, string> = {
  TODOS: 'Todas',
  ACCESS: 'Acessos',
  AUTH: 'Autenticação',
  USER: 'Usuários',
  CLIENT: 'Clientes',
  QUOTE: 'Cotações',
  TICKET: 'Chamados',
  TRACKING: 'Rastreamentos',
  SYSTEM: 'Sistema',
};

const categoryMeta: Record<
  AuditLogCategory,
  {
    accent: string;
    softColor: string;
  }
> = {
  ACCESS: { accent: '#7c3aed', softColor: '#f3e8ff' },
  AUTH: { accent: crmPalette.orange, softColor: '#fff0e8' },
  USER: { accent: crmPalette.blue, softColor: '#eaf4ff' },
  CLIENT: { accent: crmPalette.green, softColor: '#ecfdf5' },
  QUOTE: { accent: crmPalette.yellow, softColor: '#fff7df' },
  TICKET: { accent: '#db2777', softColor: '#fce7f3' },
  TRACKING: { accent: '#0f766e', softColor: '#ccfbf1' },
  SYSTEM: { accent: crmPalette.text, softColor: '#f1f5f9' },
};

const textCorrections: Array<[RegExp, string]> = [
  [/\bVeiculo\b/g, 'Veículo'],
  [/\bveiculo\b/g, 'veículo'],
  [/\bVeiculos\b/g, 'Veículos'],
  [/\bveiculos\b/g, 'veículos'],
  [/\bUsuario\b/g, 'Usuário'],
  [/\busuario\b/g, 'usuário'],
  [/\bUsuarios\b/g, 'Usuários'],
  [/\busuarios\b/g, 'usuários'],
  [/\bAutenticacao\b/g, 'Autenticação'],
  [/\bautenticacao\b/g, 'autenticação'],
  [/\bCotacao\b/g, 'Cotação'],
  [/\bcotacao\b/g, 'cotação'],
  [/\bCotacoes\b/g, 'Cotações'],
  [/\bcotacoes\b/g, 'cotações'],
  [/\bGestao\b/g, 'Gestão'],
  [/\bgestao\b/g, 'gestão'],
  [/\bAcao\b/g, 'Ação'],
  [/\bacao\b/g, 'ação'],
  [/\bAcoes\b/g, 'Ações'],
  [/\bacoes\b/g, 'ações'],
  [/\bPermissao\b/g, 'Permissão'],
  [/\bpermissao\b/g, 'permissão'],
  [/\bPermissoes\b/g, 'Permissões'],
  [/\bpermissoes\b/g, 'permissões'],
  [/\bexcluida\b/g, 'excluída'],
  [/\binvalida\b/g, 'inválida'],
  [/\brecuperacao\b/g, 'recuperação'],
  [/\binformacao\b/g, 'informação'],
  [/\binformacoes\b/g, 'informações'],
  [/\bintegracao\b/g, 'integração'],
  [/\bnegociacao\b/g, 'negociação'],
];

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 52,
    minHeight: 52,
    borderRadius: '10px',
    bgcolor: '#ffffff',
    alignItems: 'center',
  },
  '& .MuiInputBase-input': {
    height: 'auto',
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 13,
  },
  '& .MuiInputLabel-root': {
    fontSize: 13,
    fontWeight: 800,
  },
  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    height: '100% !important',
    paddingTop: '0 !important',
    paddingBottom: '0 !important',
  },
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getCategoryLabel(category: AuditLogCategory) {
  return categoryLabels[category] ?? category;
}

function getCategoryMeta(category: AuditLogCategory) {
  return categoryMeta[category] ?? categoryMeta.SYSTEM;
}

function getSuccessRate(summary: AuditLogSummary) {
  if (!summary.total) {
    return '0%';
  }

  return `${Math.round((summary.successCount / summary.total) * 100)}%`;
}

function getUserLabel(log: AuditLog) {
  return log.user?.name ?? 'Sistema';
}

function getUserBadgeLabel(log: AuditLog) {
  if (log.user?.email) {
    return log.user.email.split('@')[0];
  }

  return getUserLabel(log);
}

function getDisplayText(value?: string | null) {
  if (!value) {
    return '';
  }

  return textCorrections.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}

function ActivityLogCard({ log }: { log: AuditLog }) {
  const meta = getCategoryMeta(log.category);
  const title = getDisplayText(log.message) || getDisplayText(log.action);
  const action = getDisplayText(log.action);
  const target = [log.targetType, log.targetId].filter(Boolean).join(' - ');
  const accent = log.success ? meta.accent : crmPalette.red;

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 166,
        p: { xs: 2, md: 2.5 },
        border: `1px solid ${log.success ? crmPalette.border : '#fecaca'}`,
        borderRadius: '12px',
        bgcolor: '#ffffff',
        boxShadow: log.success
          ? '0 10px 26px rgba(15, 23, 42, 0.04)'
          : '0 12px 28px rgba(220, 38, 38, 0.10)',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        '&:hover': {
          borderColor: `${accent}70`,
          boxShadow: `0 16px 34px ${accent}1f`,
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          height: '100%',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 52,
              height: 52,
              borderRadius: '12px',
              bgcolor: meta.softColor,
              color: accent,
              border: `1px solid ${accent}25`,
              flexShrink: 0,
            }}
          >
            {log.success ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component="h3"
              sx={{
                color: '#020617',
                fontSize: { xs: 15, md: 16 },
                fontWeight: 900,
                lineHeight: 1.35,
                overflowWrap: 'anywhere',
              }}
            >
              {title}
            </Typography>

            <Stack
              direction="row"
              spacing={0.75}
              sx={{ mt: 1.1, flexWrap: 'wrap', rowGap: 0.75 }}
            >
              <Chip
                label={getUserBadgeLabel(log)}
                size="small"
                variant="outlined"
                sx={{
                  height: 28,
                  borderRadius: '8px',
                  bgcolor: '#fff7ed',
                  color: crmPalette.orangeDark,
                  borderColor: '#fdba74',
                  fontSize: 12,
                  fontWeight: 900,
                }}
              />

              <Chip
                label={action || getCategoryLabel(log.category)}
                size="small"
                variant="outlined"
                sx={{
                  maxWidth: '100%',
                  height: 28,
                  borderRadius: '8px',
                  bgcolor: '#f8fafc',
                  color: crmPalette.text,
                  borderColor: crmPalette.border,
                  fontSize: 12,
                  fontWeight: 900,
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />

              <Chip
                label={getCategoryLabel(log.category)}
                size="small"
                sx={{
                  height: 28,
                  borderRadius: '8px',
                  bgcolor: meta.softColor,
                  color: meta.accent,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              />
            </Stack>

            {target ? (
              <Typography
                sx={{
                  mt: 1,
                  color: crmPalette.muted,
                  fontSize: 12,
                  fontWeight: 700,
                  overflowWrap: 'anywhere',
                }}
              >
                Alvo: {getDisplayText(target)}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Box
          sx={{
            minWidth: { xs: 'auto', sm: 150 },
            textAlign: { xs: 'left', sm: 'right' },
          }}
        >
          <Typography sx={{ color: crmPalette.text, fontSize: 13, fontWeight: 800 }}>
            {formatDateTime(log.createdAt)}
          </Typography>

          {log.ipAddress ? (
            <Typography sx={{ mt: 0.6, color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>
              IP: {log.ipAddress}
            </Typography>
          ) : null}

          <Chip
            icon={log.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            label={log.success ? 'Sucesso' : 'Falha'}
            size="small"
            sx={{
              mt: 1.2,
              height: 26,
              borderRadius: '8px',
              bgcolor: log.success ? '#ecfdf5' : '#fef2f2',
              color: log.success ? '#047857' : '#b91c1c',
              fontSize: 12,
              fontWeight: 900,
              '& .MuiChip-icon': {
                color: 'inherit',
              },
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

export default function LogsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary>({
    total: 0,
    successCount: 0,
    errorCount: 0,
    byCategory: [],
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    category: 'TODOS',
    userId: '',
    q: '',
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isAllowed = user ? allowedRoles.has(user.role) : false;

  const apiFilters = useMemo(
    () => ({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      category: filters.category === 'TODOS' ? '' : filters.category,
      userId: filters.userId,
      q: filters.q,
    }),
    [filters],
  );

  const totalPages = Math.max(1, Math.ceil(logs.length / rowsPerPage));

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return logs.slice(start, start + rowsPerPage);
  }, [logs, page, rowsPerPage]);

  const paginationStart =
    logs.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;

  const paginationEnd = Math.min(page * rowsPerPage, logs.length);

  useEffect(() => {
    setPage(1);
  }, [filters, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function loadLogs() {
    if (!token || !isAllowed) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError('');
      const [logData, summaryData, userData] = await Promise.all([
        getAuditLogs(token, apiFilters),
        getAuditLogSummary(token, apiFilters),
        getUsers(),
      ]);
      setLogs(logData);
      setSummary(summaryData);
      setUsers(userData);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Erro ao carregar logs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadLogs();
    }
  }, [authLoading, token, isAllowed, apiFilters]);

  if (!authLoading && !isAllowed) {
    return (
      <AppLayout>
        <CrmPageShell>
          <Alert
            severity="warning"
            icon={<ShieldAlert size={22} />}
            sx={{
              border: '1px solid #fed7aa',
              borderRadius: '14px',
              bgcolor: '#fff7ed',
              color: '#7c2d12',
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            <Typography sx={{ fontSize: 18, fontWeight: 900 }}>
              Acesso restrito
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 14 }}>
              Esta tela está disponível apenas para Admin e Gestão.
            </Typography>
          </Alert>
        </CrmPageShell>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="Auditoria"
          title="Logs operacionais"
          description="Acompanhe ações de usuários e autenticação."
          icon={<History size={30} />}
          aside={
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{ alignItems: 'stretch' }}
            >
              <Button
                variant="outlined"
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <RefreshCcw size={17} />
                  )
                }
                onClick={loadLogs}
                disabled={loading}
                sx={{
                  minHeight: 44,
                  borderRadius: '10px',
                  borderColor: crmPalette.border,
                  color: crmPalette.text,
                  fontWeight: 800,
                }}
              >
                Atualizar
              </Button>

              <Button
                variant="contained"
                startIcon={<Download size={17} />}
                onClick={() => token && exportAuditLogs(token, apiFilters)}
                sx={{
                  minHeight: 44,
                  borderRadius: '10px',
                  px: 2.5,
                  bgcolor: crmPalette.orange,
                  fontWeight: 900,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: crmPalette.orangeDark,
                    boxShadow: 'none',
                  },
                }}
              >
                Exportar relatório
              </Button>
            </Stack>
          }
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          <CrmKpiCard
            title="Eventos filtrados"
            value={summary.total}
            caption="Total no período selecionado"
            icon={<Activity size={24} />}
            accent={crmPalette.orange}
            softColor="#fff0e8"
          />
          <CrmKpiCard
            title="Taxa de sucesso"
            value={getSuccessRate(summary)}
            caption={`${summary.successCount} evento(s) concluído(s)`}
            icon={<CheckCircle2 size={24} />}
            accent={crmPalette.green}
            softColor="#ecfdf5"
          />
          <CrmKpiCard
            title="Alertas e erros"
            value={summary.errorCount}
            caption="Falhas registradas no filtro"
            icon={<AlertTriangle size={24} />}
            accent={crmPalette.red}
            softColor="#fef2f2"
          />
          <CrmKpiCard
            title="Categorias"
            value={summary.byCategory.length}
            caption="Frentes com movimentação"
            icon={<Tags size={24} />}
            accent={crmPalette.blue}
            softColor="#eaf4ff"
          />
        </Box>

        <CrmSection sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1}
              sx={{
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography sx={{ color: crmPalette.text, fontSize: 18, fontWeight: 900 }}>
                  Filtros de auditoria
                </Typography>
                <Typography sx={{ mt: 0.4, color: crmPalette.muted, fontSize: 13 }}>
                  Refine a atividade recente por período, categoria, usuário ou termo.
                </Typography>
              </Box>

              <Chip
                icon={<Clock3 size={14} />}
                label={`${logs.length} registro(s) exibido(s)`}
                size="small"
                sx={{
                  height: 30,
                  borderRadius: '8px',
                  bgcolor: '#f1f5f9',
                  color: crmPalette.text,
                  fontSize: 12,
                  fontWeight: 900,
                  '& .MuiChip-icon': {
                    color: crmPalette.muted,
                  },
                }}
              />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(5, minmax(0, 1fr))',
                },
                gap: 1.5,
              }}
            >
              <TextField
                fullWidth
                type="date"
                label="Data inicial"
                value={filters.dateFrom}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    dateFrom: event.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
                sx={textFieldSx}
              />

              <TextField
                fullWidth
                type="date"
                label="Data final"
                value={filters.dateTo}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    dateTo: event.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
                sx={textFieldSx}
              />

              <TextField
                select
                fullWidth
                label="Categoria"
                value={filters.category}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                sx={textFieldSx}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {categoryLabels[category]}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Usuário"
                value={filters.userId}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    userId: event.target.value,
                  }))
                }
                sx={textFieldSx}
              >
                <MenuItem value="">Todos os usuários</MenuItem>
                {users.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Busca"
                value={filters.q}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, q: event.target.value }))
                }
                placeholder="Mensagem, rota ou alvo"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={textFieldSx}
              />
            </Box>
          </Stack>
        </CrmSection>

        <CrmSection>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 2,
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              borderBottom: `1px solid ${crmPalette.border}`,
            }}
          >
            <Box>
              <Typography component="h2" sx={{ color: crmPalette.text, fontSize: 24, fontWeight: 900 }}>
                Atividade recente
              </Typography>
              <Typography sx={{ mt: 0.4, color: crmPalette.muted, fontSize: 15 }}>
                Últimas ações registradas no sistema.
              </Typography>
            </Box>

            <Chip
              icon={<Clock3 size={14} />}
              label={`${logs.length} registro(s) exibido(s)`}
              size="small"
              variant="outlined"
              sx={{
                height: 30,
                borderRadius: '8px',
                bgcolor: '#ffffff',
                color: crmPalette.text,
                borderColor: crmPalette.border,
                fontSize: 12,
                fontWeight: 900,
                '& .MuiChip-icon': {
                  color: crmPalette.muted,
                },
              }}
            />
          </Stack>

          {loading ? (
            <Stack
              spacing={1.5}
              sx={{
                minHeight: 260,
                alignItems: 'center',
                justifyContent: 'center',
                color: crmPalette.muted,
              }}
            >
              <CircularProgress size={28} />
              <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                Carregando logs operacionais...
              </Typography>
            </Stack>
          ) : pageError ? (
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Alert severity="error" sx={{ borderRadius: '10px' }}>
                {pageError}
              </Alert>
            </Box>
          ) : logs.length === 0 ? (
            <Stack
              spacing={1}
              sx={{
                minHeight: 260,
                alignItems: 'center',
                justifyContent: 'center',
                color: crmPalette.muted,
                px: 2,
                textAlign: 'center',
              }}
            >
              <History size={30} />
              <Typography sx={{ fontSize: 14, fontWeight: 900 }}>
                Nenhum log encontrado com os filtros aplicados.
              </Typography>
            </Stack>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    xl: 'repeat(2, minmax(0, 1fr))',
                  },
                  gap: 2,
                  p: { xs: 2, md: 2.5 },
                }}
              >
                {paginatedLogs.map((log) => (
                  <ActivityLogCard key={log.id} log={log} />
                ))}
              </Box>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                sx={{
                  px: { xs: 2, md: 2.5 },
                  py: 1.5,
                  alignItems: { xs: 'stretch', md: 'center' },
                  justifyContent: 'space-between',
                  borderTop: `1px solid ${crmPalette.border}`,
                  bgcolor: '#ffffff',
                }}
              >
                <Typography
                  sx={{
                    color: crmPalette.muted,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Mostrando {paginationStart}-{paginationEnd} de {logs.length}
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.25}
                  sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
                >
                  <TextField
                    select
                    size="small"
                    label="Por página"
                    value={rowsPerPage}
                    onChange={(event) =>
                      setRowsPerPage(Number(event.target.value))
                    }
                    sx={{
                      minWidth: 132,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        fontSize: 13,
                        fontWeight: 800,
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: 12,
                        fontWeight: 800,
                      },
                    }}
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Pagination
                    page={page}
                    count={totalPages}
                    onChange={(_, nextPage) => setPage(nextPage)}
                    color="primary"
                    shape="rounded"
                    size="small"
                    siblingCount={1}
                    boundaryCount={1}
                  />
                </Stack>
              </Stack>
            </>
          )}
        </CrmSection>
      </CrmPageShell>
    </AppLayout>
  );
}
