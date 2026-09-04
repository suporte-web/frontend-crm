import { API_BASE_URL, apiFetch } from '@/services/api';
import type {
  CreateLeadPayload,
  CreateLeadObservationPayload,
  ConvertLeadToClientPayload,
  ConvertLeadToClientResponse,
  ImportLeadsCsvPayload,
  Lead,
  LeadFilters,
  LeadImportJob,
  LeadObservation,
  ReceiveWhatsAppLeadPayload,
  UpdateLeadPayload,
  LeadsResumo,
} from '@/types/leads';

function buildQuery(filters: LeadFilters = {}) {
  const searchParams = new URLSearchParams();

  if (filters.q?.trim()) {
    searchParams.set('q', filters.q.trim());
  }

  if (filters.source?.trim()) {
    searchParams.set('source', filters.source.trim());
  }

  if (filters.status?.trim()) {
    searchParams.set('status', filters.status.trim());
  }

  if (filters.convertidoParaCliente !== undefined) {
  searchParams.set(
    'convertidoParaCliente',
    String(filters.convertidoParaCliente),
  );
}


  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// Lead convertido para cliente

export function getLeads(
  token: string,
  filters: LeadFilters = {},
) {
  return apiFetch<Lead[]>(
    `/leads${buildQuery(filters)}`,
    {},
    token,
  );
}

// resumo leads

export function getLeadsResumo(token: string) {
  return apiFetch<LeadsResumo>(
    '/leads/resumo',
    {},
    token,
  );
}


export function getLeadById(id: string, token: string) {
  return apiFetch<Lead>(`/leads/${id}`, {}, token);
}

export function createLeadObservation(
  id: string,
  payload: CreateLeadObservationPayload,
  token: string,
) {
  return apiFetch<LeadObservation>(
    `/leads/${id}/observacoes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function getLeadObservations(
  id: string,
  token: string,
) {
  return apiFetch<LeadObservation[]>(
    `/leads/${id}/observacoes`,
    {},
    token,
  );
}

export function createLead(payload: CreateLeadPayload, token: string) {
  return apiFetch<Lead>(
    '/leads',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function updateLeadStatus(id: string, status: string, token: string) {
  return apiFetch<Lead>(
    `/leads/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    token,
  );
}

export function updateLead(id: string, payload: UpdateLeadPayload, token: string) {
  return apiFetch<Lead>(
    `/leads/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token,
  );
}

// exlcuir lead
export function excluirLead(id: string, token: string) {
  return apiFetch<{ message: string }>(
    `/leads/${id}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

export function convertLeadToClient(
  id: string,
  payload: ConvertLeadToClientPayload,
  token: string,
) {
  return apiFetch<ConvertLeadToClientResponse>(
    `/leads/${id}/convert-to-client`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function getLeadImportJobs(token: string) {
  return apiFetch<LeadImportJob[]>('/leads/import-jobs', {}, token);
}

export function getLeadImportJob(id: string, token: string) {
  return apiFetch<LeadImportJob>(`/leads/import-jobs/${id}`, {}, token);
}

export async function importLeadsCsv(
  payload: ImportLeadsCsvPayload,
  token: string,
) {
  const formData = new FormData();
  formData.append('file', payload.file);

  if (payload.defaultSource?.trim()) {
    formData.append('defaultSource', payload.defaultSource.trim());
  }

  if (payload.defaultStatus?.trim()) {
    formData.append('defaultStatus', payload.defaultStatus.trim());
  }

  const response = await fetch(`${API_BASE_URL}/leads/import/csv`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Erro ao importar leads.');
  }

  return data as LeadImportJob;
}

export async function simulateWhatsAppLead(
  payload: ReceiveWhatsAppLeadPayload,
  integrationToken: string,
) {
  const response = await fetch(`${API_BASE_URL}/leads/integrations/whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-integration-token': integrationToken,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Erro ao processar o WhatsApp.');
  }

  return data as {
    created: boolean;
    lead: Lead;
    message: string;
  };

  
}
