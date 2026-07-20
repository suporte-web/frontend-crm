import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  Clock3,
  FileText,
  Flag,
  MessageSquareText,
  PencilLine,
  PhoneCall,
  Target,
} from 'lucide-react';
import { crmPalette } from '@/components/mui/crm-primitives';
import type { TimelineEvent, TimelineEventType } from '@/types/crm';

const eventStyles: Record<
  TimelineEventType,
  {
    icon: typeof Clock3;
    color: string;
    bg: string;
  }
> = {
  LEAD_CREATED: {
    icon: Clock3,
    color: '#0369a1',
    bg: '#e0f2fe',
  },
  LEAD_UPDATED: {
    icon: PencilLine,
    color: '#475569',
    bg: '#f1f5f9',
  },
  OPPORTUNITY_CREATED: {
    icon: Target,
    color: '#6d28d9',
    bg: '#ede9fe',
  },
  STAGE_CHANGED: {
    icon: Flag,
    color: '#b45309',
    bg: '#fef3c7',
  },
  NOTE_ADDED: {
    icon: FileText,
    color: '#0e7490',
    bg: '#cffafe',
  },
  OPPORTUNITY_WON: {
    icon: Target,
    color: '#047857',
    bg: '#d1fae5',
  },
  OPPORTUNITY_LOST: {
    icon: Target,
    color: '#be123c',
    bg: '#ffe4e6',
  },
  QUOTE_CREATED: {
    icon: FileText,
    color: '#1d4ed8',
    bg: '#dbeafe',
  },
  QUOTE_STATUS: {
    icon: FileText,
    color: '#4338ca',
    bg: '#e0e7ff',
  },
};

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  GESTAO: 'Gestão',
  COMERCIAL: 'Comercial',
  MARKETING: 'Marketing',
  OPERACIONAL: 'Operacional',
  CLIENTE: 'Cliente',
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

function getMetadataString(
  metadata: TimelineEvent['metadata'] | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function isContactEvent(event: TimelineEvent) {
  return getMetadataString(event.metadata, 'kind') === 'CONTACT';
}

export function TimelineSection({
  events,
  darkMode = false,
}: {
  events: TimelineEvent[];
  darkMode?: boolean;
}) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const isDark = darkMode;
  const contactEvents = sortedEvents.filter(isContactEvent).length;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        border: '1px solid',
        borderColor: isDark ? '#334155' : crmPalette.border,
        borderRadius: '12px',
        bgcolor: isDark ? '#020617' : '#ffffff',
        color: isDark ? '#ffffff' : crmPalette.text,
        boxShadow: 'none',
      }}
    >
      <Stack spacing={2.5}>
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
            Histórico de contatos
          </Typography>
          <Typography
            component="h2"
            sx={{
              mt: 0.5,
              color: isDark ? '#ffffff' : crmPalette.text,
              fontSize: { xs: 20, md: 22 },
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            Linha do tempo do cliente
          </Typography>
          <Typography
            sx={{
              mt: 0.75,
              color: isDark ? '#cbd5e1' : crmPalette.muted,
              fontSize: 13,
            }}
          >
            {contactEvents} contatos registrados, com responsável, canal e data do contato.
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 8,
              bottom: 8,
              left: 19,
              width: 1,
              bgcolor: isDark ? '#334155' : crmPalette.border,
            },
          }}
        >
          {sortedEvents.map((event) => {
            const isContact = isContactEvent(event);
            const config = isContact
              ? { icon: PhoneCall, color: '#047857', bg: '#d1fae5' }
              : eventStyles[event.type];
            const Icon = config.icon;
            const contactChannel = getMetadataString(
              event.metadata,
              'contactChannel',
            );
            const contactPerson = getMetadataString(
              event.metadata,
              'contactPerson',
            );
            const contactedAt = getMetadataString(event.metadata, 'contactedAt');
            const roleLabel = event.createdByRole
              ? roleLabels[event.createdByRole] ?? event.createdByRole
              : null;

            return (
              <Paper
                key={event.id}
                variant="outlined"
                sx={{
                  position: 'relative',
                  p: 1.75,
                  borderRadius: '12px',
                  borderColor: isDark ? '#334155' : crmPalette.border,
                  bgcolor: isDark ? '#0f172a' : '#f8fafc',
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      zIndex: 1,
                      width: 38,
                      height: 38,
                      flexShrink: 0,
                      borderRadius: '10px',
                      bgcolor: config.bg,
                      color: config.color,
                    }}
                  >
                    <Icon size={16} />
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      sx={{
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        justifyContent: 'space-between',
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          color: isDark ? '#ffffff' : crmPalette.text,
                          fontSize: 14,
                          fontWeight: 900,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {event.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: isDark ? '#94a3b8' : crmPalette.muted,
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(event.createdAt)}
                      </Typography>
                    </Stack>

                    {isContact ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1.25, flexWrap: 'wrap', rowGap: 0.75 }}
                      >
                        {contactChannel ? (
                          <Chip
                            icon={<MessageSquareText size={14} />}
                            label={contactChannel}
                            size="small"
                            sx={{
                              borderRadius: '8px',
                              bgcolor: '#ecfeff',
                              color: '#0e7490',
                              fontWeight: 800,
                            }}
                          />
                        ) : null}
                        {contactPerson ? (
                          <Chip
                            label={`Contato: ${contactPerson}`}
                            size="small"
                            sx={{
                              borderRadius: '8px',
                              bgcolor: '#f1f5f9',
                              color: crmPalette.text,
                              fontWeight: 800,
                            }}
                          />
                        ) : null}
                        {contactedAt ? (
                          <Chip
                            label={`Feito em ${formatDate(contactedAt)}`}
                            size="small"
                            sx={{
                              borderRadius: '8px',
                              bgcolor: '#f1f5f9',
                              color: crmPalette.text,
                              fontWeight: 800,
                            }}
                          />
                        ) : null}
                      </Stack>
                    ) : null}

                    <Typography
                      sx={{
                        mt: 1,
                        color: isDark ? '#cbd5e1' : '#475569',
                        fontSize: 13,
                        lineHeight: 1.65,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {event.description}
                    </Typography>

                    {event.createdBy ? (
                      <Typography
                        sx={{
                          mt: 1,
                          color: isDark ? '#64748b' : '#94a3b8',
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: '.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Registrado por {event.createdBy}
                        {roleLabel ? ` - ${roleLabel}` : ''}
                      </Typography>
                    ) : null}
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Stack>
    </Paper>
  );
}
