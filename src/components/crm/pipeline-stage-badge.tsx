import { formatOpportunityStage } from '@/services/crm.service';
import type { OpportunityStage } from '@/types/crm';

const stageClasses: Record<OpportunityStage, string> = {
  NOVO: 'border-slate-200 bg-slate-100 text-slate-700',
  QUALIFICADO: 'border-sky-200 bg-sky-100 text-sky-700',
  PROPOSTA: 'border-violet-200 bg-violet-100 text-violet-700',
  NEGOCIACAO: 'border-amber-200 bg-amber-100 text-amber-700',
  GANHO: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  PERDIDO: 'border-rose-200 bg-rose-100 text-rose-700',
};

export function PipelineStageBadge({
  stage,
}: {
  stage: OpportunityStage;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stageClasses[stage]}`}
    >
      {formatOpportunityStage(stage)}
    </span>
  );
}
