export type LeadStatus = 'ATIVO' | 'PENDENTE' | 'INATIVO';

export type TimelineEventType =
  | 'LEAD_CREATED'
  | 'LEAD_UPDATED'
  | 'OPPORTUNITY_CREATED'
  | 'STAGE_CHANGED'
  | 'NOTE_ADDED'
  | 'OPPORTUNITY_WON'
  | 'OPPORTUNITY_LOST';

export type OpportunityStage =
  | 'NOVO'
  | 'QUALIFICADO'
  | 'PROPOSTA'
  | 'NEGOCIACAO'
  | 'GANHO'
  | 'PERDIDO';

export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';

export interface TimelineEvent {
  id: string;
  leadId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  createdAt: string;
  createdBy?: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
}

export interface Opportunity {
  id: string;
  leadId: string;
  title: string;
  value?: number | null;
  stage: OpportunityStage;
  status: OpportunityStatus;
  expectedCloseDate?: string | null;
  lostReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSummary {
  id: string;
  name: string;
  email: string;
  company: string;
  segment: string;
  owner: string;
  status: LeadStatus;
  createdAt: string;
}

export interface LeadDetail extends LeadSummary {
  document?: string | null;
  phone?: string | null;
  source?: string | null;
  notes?: string | null;
  lastContactAt?: string | null;
  timeline: TimelineEvent[];
  opportunities: Opportunity[];
}

export interface CrmDashboardSummary {
  totalLeads: number;
  openOpportunities: number;
  wonOpportunities: number;
  conversionRate: number;
  openValue: number;
  opportunitiesByStage: Array<{
    stage: OpportunityStage;
    count: number;
    value: number;
  }>;
}
