import { API_BASE_URL, apiFetch } from '@/services/api';
import type {
  ClientContact,
  ClientDocument,
  ClientDeletionRequest,
  ClientDeletionRequestStatus,
  CrmDashboardSummary,
  LeadDetail,
  LeadStatus,
  LeadSummary,
  Opportunity,
  OpportunityStage,
  OpportunityStatus,
  TimelineEvent,
} from '@/types/crm';

type BackendUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type BackendClient = {
  id: string;
  document?: string | null;
  phone?: string | null;
  companyName?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  cnae?: string | null;
  stateRegistration?: string | null;
  businessActivity?: string | null;
  taxRegime?: string | null;
  address?: string | null;
  bankDetails?: string | null;
  modality?: string | null;
  registrationDate?: string | null;
  segment?: string | null;
  notes?: string | null;
  status?: string | null;
  internalOwnerId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: BackendUser | null;
  opportunities?: BackendOpportunity[];
  documents?: ClientDocument[];
  contacts?: ClientContact[];
};

type BackendOpportunity = {
  id: string;
  clientId: string;
  quoteId?: string | null;
  title: string;
  value?: number | string | null;
  stage: OpportunityStage;
  status: OpportunityStatus;
  preContract?: boolean;
  preContractNotes?: string | null;
  expectedCloseDate?: string | null;
  lostReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

type BackendTimelineEvent = {
  id: string;
  type: TimelineEvent['type'] | string;
  title: string;
  description: string;
  date?: string;
  createdAt?: string;
  createdBy?: {
    name?: string | null;
    role?: string | null;
  } | null;
  metadata?: Record<string, string | number | boolean | null> | null;
};

type BackendClientDetail = {
  client: BackendClient;
  opportunities: BackendOpportunity[];
  timeline: BackendTimelineEvent[];
};

type OwnerSummary = {
  owner: BackendUser;
  metrics: {
    totalClients: number;
    activeClients: number;
  };
};

function normalizeStatus(status?: string | null): LeadStatus {
  if (status === 'ATIVO' || status === 'PENDENTE' || status === 'INATIVO') {
    return status;
  }

  return 'PENDENTE';
}

function toNumber(value?: number | string | null) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapOpportunity(opportunity: BackendOpportunity): Opportunity {
  return {
    id: opportunity.id,
    leadId: opportunity.clientId,
    clientId: opportunity.clientId,
    quoteId: opportunity.quoteId ?? null,
    title: opportunity.title,
    value: toNumber(opportunity.value),
    stage: opportunity.stage,
    status: opportunity.status,
    preContract: opportunity.preContract ?? false,
    preContractNotes: opportunity.preContractNotes ?? null,
    expectedCloseDate: opportunity.expectedCloseDate ?? null,
    lostReason: opportunity.lostReason ?? null,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
  };
}

function mapClientSummary(client: BackendClient, owners: Map<string, string>): LeadSummary {
  const clientName =
    client.tradeName ||
    client.legalName ||
    client.companyName ||
    client.user?.name ||
    client.document ||
    'Cliente';

  return {
    id: client.id,
    name: clientName,
    email: client.user?.email ?? '',
    company:
      client.tradeName || client.legalName || client.companyName || clientName,
    document: client.document ?? null,
    phone: client.phone ?? null,
    segment: client.businessActivity || client.segment || '-',
    owner: client.internalOwnerId
      ? owners.get(client.internalOwnerId) ?? 'Responsável interno'
      : 'Sem responsável',
    status: normalizeStatus(client.status),
    createdAt: client.createdAt,
  };
}

function mapTimelineEvent(clientId: string, event: BackendTimelineEvent): TimelineEvent {
  const eventType = [
    'LEAD_CREATED',
    'LEAD_UPDATED',
    'OPPORTUNITY_CREATED',
    'STAGE_CHANGED',
    'NOTE_ADDED',
    'OPPORTUNITY_WON',
    'OPPORTUNITY_LOST',
    'QUOTE_CREATED',
    'QUOTE_STATUS',
  ].includes(event.type)
    ? (event.type as TimelineEvent['type'])
    : 'NOTE_ADDED';

  return {
    id: event.id,
    leadId: clientId,
    type: eventType,
    title: event.title,
    description: event.description,
    createdAt: event.createdAt ?? event.date ?? new Date().toISOString(),
    createdBy: event.createdBy?.name ?? null,
    createdByRole: event.createdBy?.role ?? null,
    metadata: event.metadata ?? null,
  };
}

export async function getCrmClientSummaries(token: string): Promise<LeadSummary[]> {
  const [clients, owners] = await Promise.all([
    apiFetch<BackendClient[]>('/clients', {}, token),
    apiFetch<OwnerSummary[]>('/clients/owners/summary', {}, token),
  ]);
  const ownerMap = new Map(owners.map((item) => [item.owner.id, item.owner.name]));

  return clients.map((client) => mapClientSummary(client, ownerMap));
}

export async function getCrmLeadById(
  id: string,
  token: string,
): Promise<LeadDetail | null> {
  const detail = await apiFetch<BackendClientDetail>(`/clients/${id}/detail`, {}, token);
  const summary = mapClientSummary(detail.client, new Map());

  return {
    ...summary,
    userId: detail.client.user?.id ?? detail.client.id,
    internalOwnerId: detail.client.internalOwnerId ?? null,
    document: detail.client.document ?? null,
    phone: detail.client.phone ?? null,
    legalName: detail.client.legalName ?? null,
    tradeName: detail.client.tradeName ?? null,
    cnae: detail.client.cnae ?? null,
    stateRegistration: detail.client.stateRegistration ?? null,
    businessActivity: detail.client.businessActivity ?? null,
    taxRegime: detail.client.taxRegime ?? null,
    address: detail.client.address ?? null,
    bankDetails: detail.client.bankDetails ?? null,
    modality: detail.client.modality ?? null,
    registrationDate: detail.client.registrationDate ?? null,
    source: 'CRM',
    notes: detail.client.notes ?? null,
    lastContactAt: detail.client.updatedAt,
    timeline: detail.timeline.map((event) => mapTimelineEvent(detail.client.id, event)),
    opportunities: detail.opportunities.map(mapOpportunity),
    documents: detail.client.documents ?? [],
    contacts: detail.client.contacts ?? [],
  };
}

export async function updateClient(
  id: string,
  payload: {
    name?: string;
    email?: string;
    companyName?: string;
    legalName?: string;
    tradeName?: string;
    cnae?: string;
    stateRegistration?: string;
    businessActivity?: string;
    taxRegime?: string;
    address?: string;
    bankDetails?: string;
    modality?: string;
    registrationDate?: string;
    document?: string;
    phone?: string;
    segment?: string;
    notes?: string;
    status?: LeadStatus;
    internalOwnerId?: string;
    contacts?: Array<{
      name?: string;
      role?: string;
      email?: string;
      phone?: string;
      notes?: string;
      isPrimary?: boolean;
    }>;
  },
  token: string,
) {
  return apiFetch<BackendClient>(
    `/clients/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token,
  );
}

type CreatedClientResponse = {
  id?: string;
  client?: {
    id: string;
  } | null;
  clientProfile?: {
    id: string;
  } | null;
};

export async function createClient(
  payload: {
    name?: string;
    companyName?: string;
    legalName?: string;
    tradeName?: string;
    cnae?: string;
    stateRegistration?: string;
    businessActivity?: string;
    taxRegime?: string;
    address?: string;
    bankDetails?: string;
    modality?: string;
    registrationDate?: string;
    document?: string;
    phone?: string;
    segment?: string;
    notes?: string;
    status?: LeadStatus;
    internalOwnerId?: string;
    contacts?: Array<{
      name?: string;
      role?: string;
      email?: string;
      phone?: string;
      notes?: string;
      isPrimary?: boolean;
    }>;
  },
token: string,
): Promise<CreatedClientResponse> {
return apiFetch<CreatedClientResponse>(
    '/clients',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function uploadClientDocument(
  clientId: string,
  file: File,
  token: string,
  description?: string,
): Promise<ClientDocument> {
  const body = new FormData();
  body.append('file', file);

  if (description?.trim()) {
    body.append('description', description.trim());
  }

  const response = await fetch(
    `${API_BASE_URL}/clients/${clientId}/documents`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || 'Erro ao enviar documento do cliente.',
    );
  }

  return data as ClientDocument;
}

export async function createTimelineContact(
  clientId: string,
  payload: {
    title?: string;
    description: string;
    contactChannel?: string;
    contactPerson?: string;
    contactedAt?: string;
  },
  token: string,
): Promise<TimelineEvent> {
  const event = await apiFetch<BackendTimelineEvent>(
    `/clients/${clientId}/timeline`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );

  return mapTimelineEvent(clientId, event);
}

export async function getCrmDashboardSummary(token: string): Promise<CrmDashboardSummary> {
  return apiFetch<CrmDashboardSummary>('/clients/dashboard/summary', {}, token);
}

export async function getClientDeletionRequests(
  token: string,
  status?: ClientDeletionRequestStatus | 'TODOS',
) {
  const query =
    status && status !== 'TODOS'
      ? `?status=${encodeURIComponent(status)}`
      : '';

  return apiFetch<ClientDeletionRequest[]>(
    `/clients/deletion-requests${query}`,
    {},
    token,
  );
}

export async function requestClientDeletion(
  clientId: string,
  payload: { reason?: string },
  token: string,
) {
  return apiFetch<ClientDeletionRequest>(
    `/clients/${clientId}/deletion-request`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function decideClientDeletionRequest(
  requestId: string,
  payload: { action: 'APPROVE' | 'REJECT'; message?: string },
  token: string,
) {
  return apiFetch<{
    message: string;
    request: ClientDeletionRequest;
  }>(
    `/clients/deletion-requests/${requestId}/decision`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateOpportunityStage(
  opportunityId: string,
  stage: OpportunityStage,
  token: string,
  lostReason?: string,
) {
  return apiFetch<Opportunity>(
    `/opportunities/${opportunityId}/stage`,
    {
      method: 'PATCH',
      body: JSON.stringify({ stage, lostReason }),
    },
    token,
  );
}

export async function updateOpportunity(
  opportunityId: string,
  payload: {
    quoteId?: string | null;
    title?: string;
    value?: number | null;
    stage?: OpportunityStage;
    expectedCloseDate?: string | null;
    preContract?: boolean;
    preContractNotes?: string | null;
    lostReason?: string | null;
  },
  token: string,
) {
  return apiFetch<Opportunity>(
    `/opportunities/${opportunityId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function createOpportunity(
  payload: {
    clientId: string;
    quoteId?: string;
    title: string;
    value?: number;
    stage?: OpportunityStage;
    expectedCloseDate?: string;
    preContract?: boolean;
    preContractNotes?: string;
  },
  token: string,
) {
  return apiFetch<Opportunity>(
    '/opportunities',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function formatLeadStatus(status: LeadStatus) {
  const labels: Record<LeadStatus, string> = {
    ATIVO: 'Ativo',
    PENDENTE: 'Pendente',
    INATIVO: 'Inativo',
  };

  return labels[status];
}

export function formatOpportunityStage(stage: OpportunityStage) {
  const labels: Record<OpportunityStage, string> = {
    NOVO: 'Novo',
    QUALIFICADO: 'Qualificado',
    PROPOSTA: 'Proposta',
    NEGOCIACAO: 'Negociação',
    GANHO: 'Ganho',
    PERDIDO: 'Perdido',
  };

  return labels[stage];
}

export function getOpportunityStatusFromStage(stage: OpportunityStage) {
  if (stage === 'GANHO') {
    return 'WON';
  }

  if (stage === 'PERDIDO') {
    return 'LOST';
  }

  return 'OPEN';
}
