import { Clock3, FileText, Flag, PencilLine, Target } from 'lucide-react';
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function TimelineSection({
  events,
}: {
  events: TimelineEvent[];
}) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            Timeline
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Atividades do lead
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Historico resumido com eventos comerciais e atualizacoes recentes.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sortedEvents.map((event) => {
          const config = eventStyles[event.type];
          const Icon = config.icon;

          return (
            <article
              key={event.id}
              className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.accent}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-950">
                      {event.title}
                    </h3>
                    <span className="text-xs font-medium text-slate-400">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {event.description}
                  </p>

                  {event.createdBy ? (
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                      Registrado por {event.createdBy}
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
