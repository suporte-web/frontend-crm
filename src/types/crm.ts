export type LeadStatus = 'ATIVO' | 'PENDENTE' | 'INATIVO';

export type TimelineEventType =
  | 'LEAD_CREATED'
  | 'LEAD_UPDATED'
  | 'OPPORTUNITY_CREATED'
  | 'STAGE_CHANGED'
  | 'NOTE_ADDED'
  | 'OPPORTUNITY_WON'
  | 'OPPORTUNITY_LOST'
  | 'QUOTE_CREATED'
  | 'QUOTE_STATUS';

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
  clientId?: string;
  quoteId?: string | null;
  title: string;
  value?: number | null;
  stage: OpportunityStage;
  status: OpportunityStatus;
  preContract?: boolean;
  preContractNotes?: string | null;
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

export type ClientDeletionRequestStatus =
  | 'PENDENTE'
  | 'APROVADA'
  | 'RECUSADA'
  | 'CANCELADA';

export interface ClientDeletionRequest {
  id: string;
  clientId?: string | null;
  status: ClientDeletionRequestStatus;
  reason?: string | null;
  managementResponse?: string | null;
  clientNameSnapshot?: string | null;
  clientEmailSnapshot?: string | null;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string | null;
  client?: {
    id: string;
    companyName?: string | null;
    user?: {
      id: string;
      name: string;
      email: string;
    } | null;
  } | null;
  requestedBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
}

export interface LeadDetail extends LeadSummary {
  userId?: string;
  internalOwnerId?: string | null;
  document?: string | null;
  phone?: string | null;
  source?: string | null;
  notes?: string | null;
  lastContactAt?: string | null;
  timeline: TimelineEvent[];
  opportunities: Opportunity[];
}

export interface CrmDashboardSummary {
  totalClients?: number;
  activeClients?: number;
  totalLeads: number;
  newLeads?: number;
  openOpportunities: number;
  wonOpportunities: number;
  totalQuotes?: number;
  openQuotes?: number;
  answeredQuotes?: number;
  totalTickets?: number;
  openTickets?: number;
  closedTickets?: number;
  usersWithAccess?: number;
  conversionRate: number;
  openValue: number;
  answeredQuoteValue?: number;
  opportunitiesByStage: Array<{
    stage: OpportunityStage;
    count: number;
    value: number;
  }>;
}
