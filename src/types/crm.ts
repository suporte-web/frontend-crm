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

export type OpportunityStatus = "OPEN" | "WON" | "LOST";

export interface TimelineEvent {
  id: string;
  leadId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  createdAt: string;
  createdBy?: string | null;
  createdByRole?: string | null;
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
  document?: string | null;
  phone?: string | null;
  segment: string;
  owner: string;
  status: LeadStatus;
  createdAt: string;
  tradeName?: string | null;
  city: string;
}

export interface ClientDocument {
  id: string;
  clientId: string;
  fileName: string;
  originalName: string;
  mimeType?: string | null;
  size?: number | null;
  url: string;
  description?: string | null;
  category?: string | null;
  createdAt: string;
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
}

export interface ClientContact {
  id: string;
  clientId: string;
  name?: string | null;
  nomeContato?: string | null;
  role?: string | null;
  cargo?: string | null;
  email?: string | null;
  phone?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  linkedin?: string | null;
  notes?: string | null;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  legalName?: string | null;
  tradeName?: string | null;
  cnae?: string | null;
  stateRegistration?: string | null;
  businessActivity?: string | null;
  taxRegime?: string | null;
  taxation?: string | null;
  address?: string | null;
  bankDetails?: string | null;
  modality?: string | null;
  registrationDate?: string | null;
  paymentMethod?: string | null;
  paymentTerm?: string | null;
  contractValidity?: string | null;
  priceAdjustment?: string | null;
  invoiceContactName?: string | null;
  invoiceContactEmail?: string | null;
  invoiceContactPhone?: string | null;
  commercialTermsNotes?: string | null;
  source?: string | null;
  notes?: string | null;
  lastContactAt?: string | null;
  timeline: TimelineEvent[];
  opportunities: Opportunity[];
  documents: ClientDocument[];
  contacts: ClientContact[];
  city: string;
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
  leadsByStage?: Array<{
    stage: string;
    label: string;
    count: number;
    monthlyEstimatedValue?: number;
  }>;
}
