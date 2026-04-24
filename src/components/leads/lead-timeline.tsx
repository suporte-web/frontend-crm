'use client';

import type { LeadTimelineEvent } from '@/types/leads';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function getLeadSourceLabel(source?: string | null) {
  const labels: Record<string, string> = {
    manual: 'Manual',
    import_csv: 'Importacao CSV',
    whatsapp: 'WhatsApp',
  };

  if (!source) {
    return '-';
  }

  return labels[source] ?? source;
}

export function getLeadSourceBadgeClass(source?: string | null) {
  const classes: Record<string, string> = {
    manual: 'bg-blue-100 text-blue-700',
    import_csv: 'bg-emerald-100 text-emerald-700',
    whatsapp: 'bg-green-100 text-green-700',
  };

  return classes[source ?? ''] ?? 'bg-slate-100 text-slate-700';
}

export function LeadTimeline({ events }: { events: LeadTimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        Nenhum evento registrado para este lead.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <article
          key={event.id}
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-base font-semibold text-slate-950">{event.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{event.description}</p>
            </div>

            <div className="text-sm text-slate-400 md:text-right">
              <p>{formatDate(event.createdAt)}</p>
              <p className="mt-1">
                {event.createdBy?.name ? `por ${event.createdBy.name}` : 'automacao'}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
