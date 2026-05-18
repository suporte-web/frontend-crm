import {
  Clock3,
  FileText,
  Flag,
  MessageSquareText,
  PencilLine,
  PhoneCall,
  Target,
} from 'lucide-react';
import type { TimelineEvent, TimelineEventType } from '@/types/crm';

const eventStyles: Record<
  TimelineEventType,
  {
    icon: typeof Clock3;
    accent: string;
  }
> = {
  LEAD_CREATED: {
    icon: Clock3,
    accent: 'bg-sky-100 text-sky-700',
  },
  LEAD_UPDATED: {
    icon: PencilLine,
    accent: 'bg-slate-100 text-slate-700',
  },
  OPPORTUNITY_CREATED: {
    icon: Target,
    accent: 'bg-violet-100 text-violet-700',
  },
  STAGE_CHANGED: {
    icon: Flag,
    accent: 'bg-amber-100 text-amber-700',
  },
  NOTE_ADDED: {
    icon: FileText,
    accent: 'bg-cyan-100 text-cyan-700',
  },
  OPPORTUNITY_WON: {
    icon: Target,
    accent: 'bg-emerald-100 text-emerald-700',
  },
  OPPORTUNITY_LOST: {
    icon: Target,
    accent: 'bg-rose-100 text-rose-700',
  },
  QUOTE_CREATED: {
    icon: FileText,
    accent: 'bg-blue-100 text-blue-700',
  },
  QUOTE_STATUS: {
    icon: FileText,
    accent: 'bg-indigo-100 text-indigo-700',
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
    <section
      className={`rounded-[28px] border p-5 shadow-sm md:p-6 ${
        isDark
          ? 'border-slate-700 bg-slate-950 text-white'
          : 'border-slate-200 bg-white text-slate-950'
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p
            className={`text-sm font-semibold uppercase tracking-[0.18em] ${
              isDark ? 'text-cyan-300' : 'text-blue-700'
            }`}
          >
            Histórico de contatos
          </p>
          <h2
            className={`mt-2 text-2xl font-bold ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}
          >
            Linha do tempo do cliente
          </h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
            {contactEvents} contatos registrados, com responsável, canal e data do contato.
          </p>
        </div>

      </div>

      <div
        className={`relative mt-6 space-y-4 before:absolute before:bottom-2 before:left-[21px] before:top-2 before:w-px ${
          isDark ? 'before:bg-slate-700' : 'before:bg-slate-200'
        }`}
      >
        {sortedEvents.map((event) => {
          const isContact = isContactEvent(event);
          const config = isContact
            ? { icon: PhoneCall, accent: 'bg-emerald-100 text-emerald-700' }
            : eventStyles[event.type];
          const Icon = config.icon;
          const contactChannel = getMetadataString(event.metadata, 'contactChannel');
          const contactPerson = getMetadataString(event.metadata, 'contactPerson');
          const contactedAt = getMetadataString(event.metadata, 'contactedAt');
          const roleLabel = event.createdByRole
            ? roleLabels[event.createdByRole] ?? event.createdByRole
            : null;

          return (
            <article
              key={event.id}
              className={`relative rounded-[24px] border p-4 ${
                isDark
                  ? 'border-slate-700 bg-slate-900/80'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.accent}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      className={`text-base font-semibold ${
                        isDark ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      {event.title}
                    </h3>
                    <span
                      className={`text-xs font-medium ${
                        isDark ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      {formatDate(event.createdAt)}
                    </span>
                  </div>

                  {isContact ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {contactChannel ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            isDark
                              ? 'bg-slate-800 text-cyan-200'
                              : 'bg-cyan-50 text-cyan-700'
                          }`}
                        >
                          <MessageSquareText className="h-3.5 w-3.5" />
                          {contactChannel}
                        </span>
                      ) : null}
                      {contactPerson ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isDark
                              ? 'bg-slate-800 text-slate-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Contato: {contactPerson}
                        </span>
                      ) : null}
                      {contactedAt ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isDark
                              ? 'bg-slate-800 text-slate-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Feito em {formatDate(contactedAt)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {event.description}
                  </p>

                  {event.createdBy ? (
                    <p
                      className={`mt-2 text-xs font-medium uppercase tracking-[0.16em] ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      Registrado por {event.createdBy}
                      {roleLabel ? ` - ${roleLabel}` : ''}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
