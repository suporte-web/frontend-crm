import { apiFetch } from '@/services/api';
import type {
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
  segment?: string | null;
  notes?: string | null;
  status?: string | null;
  internalOwnerId?: string | null;
  createdAt: string;
  updatedAt: string;
  user: BackendUser;
  opportunities?: BackendOpportunity[];
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
  return {
    id: client.id,
    name: client.user.name,
    email: client.user.email,
    company: client.companyName || client.user.name,
    segment: client.segment || '-',
    owner: client.internalOwnerId
      ? owners.get(client.internalOwnerId) ?? 'Responsavel interno'
      : 'Sem responsavel',
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
    userId: detail.client.user.id,
    internalOwnerId: detail.client.internalOwnerId ?? null,
    document: detail.client.document ?? null,
    phone: detail.client.phone ?? null,
    source: 'CRM',
    notes: detail.client.notes ?? null,
    lastContactAt: detail.client.updatedAt,
    timeline: detail.timeline.map((event) => mapTimelineEvent(detail.client.id, event)),
    opportunities: detail.opportunities.map(mapOpportunity),
  };
}

export async function updateClient(
  id: string,
  payload: {
    name?: string;
    email?: string;
    companyName?: string;
    document?: string;
    phone?: string;
    segment?: string;
    notes?: string;
    status?: LeadStatus;
    internalOwnerId?: string;
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
    NEGOCIACAO: 'Negociacao',
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
