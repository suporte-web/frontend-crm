export type LeadSource = 'manual' | 'import_csv' | 'whatsapp' | string;

export type LeadTimelineEventType =
  | 'CREATED_MANUAL'
  | 'IMPORTED_CSV'
  | 'UPDATED'
  | 'WHATSAPP_CREATED'
  | 'WHATSAPP_INTERACTION'
  | 'NOTE_ADDED';

export type LeadImportJobStatus =
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED';

export type LeadImportRowStatus = 'IMPORTED' | 'SKIPPED' | 'FAILED';

export type LeadUserReference = {
  id: string;
  name: string;
  email: string;
};

export type LeadTimelineEvent = {
  id: string;
  leadId: string;
  type: LeadTimelineEventType;
  title: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: LeadUserReference | null;
};

export type Lead = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source: LeadSource;
  status: string;
  notes?: string | null;
  channel?: string | null;
  sourcePhone?: string | null;
  externalMessageId?: string | null;
  externalContactId?: string | null;
  metadata?: Record<string, unknown> | null;
  rawPayload?: Record<string, unknown> | null;
  lastInteractionAt?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: LeadUserReference | null;
  updatedBy?: LeadUserReference | null;
  timeline?: LeadTimelineEvent[];
};

export type LeadImportRowResult = {
  id: string;
  jobId: string;
  rowNumber: number;
  status: LeadImportRowStatus;
  reason?: string | null;
  rawData?: Record<string, unknown> | null;
  leadId?: string | null;
  createdAt: string;
  lead?: Pick<Lead, 'id' | 'name' | 'email' | 'phone' | 'company' | 'source' | 'status'> | null;
};

export type LeadImportJob = {
  id: string;
  fileName: string;
  sourceFileType: string;
  totalRows: number;
  successCount: number;
  ignoredCount: number;
  failureCount: number;
  status: LeadImportJobStatus;
  summary?: Record<string, unknown> | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  createdBy?: LeadUserReference | null;
  rowResults?: LeadImportRowResult[];
  _count?: {
    rowResults: number;
  };
};

export type CreateLeadPayload = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status?: string;
  notes?: string;
};

export type ImportLeadsCsvPayload = {
  file: File;
  defaultSource?: string;
  defaultStatus?: string;
};

export type ReceiveWhatsAppLeadPayload = {
  phone: string;
  name?: string;
  company?: string;
  notes?: string;
  externalMessageId?: string;
  externalContactId?: string;
  sourcePhone?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
  rawPayload?: Record<string, unknown>;
};

export type LeadFilters = {
  q?: string;
  source?: string;
  status?: string;
};
