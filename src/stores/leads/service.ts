import { Api } from '@/utils/Api';
import { normalizarEmpresaLead } from '@/lib/nome-cadastro';
import type { CreateLeadPayload, CreateLeadObservationPayload, ConvertLeadToClientPayload, ConvertLeadToClientResponse, ImportLeadsCsvPayload, Lead, LeadFilters, LeadImportJob, LeadObservation, ReceiveWhatsAppLeadPayload, UpdateLeadPayload, LeadsResumo, } from '@/types/leads';
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
    searchParams.set('convertidoParaCliente', String(filters.convertidoParaCliente));
  }
  for (const key of ['origemProspeccao', 'consultoraId', 'criadoDe', 'criadoAte'] as const) {
    if (filters[key])
      searchParams.set(key, filters[key]!);
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
// Lead convertido para cliente
export function getLeads(token: string, filters: LeadFilters = {}) {
  return Api.get<Lead[]>(`/leads${buildQuery(filters)}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data).then(registros => registros.map(normalizarEmpresaLead));
}
// resumo leads
export async function getLeadsResumo(token: string, filters: LeadFilters = {}) {
  const { data } = await Api.get<LeadsResumo>(`/leads/resumo${buildQuery(filters)}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export function getLeadById(id: string, token: string) {
  return Api.get<Lead>(`/leads/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data).then(normalizarEmpresaLead);
}
export async function createLeadObservation(id: string, payload: CreateLeadObservationPayload, token: string) {
  const { data } = await Api.post<LeadObservation>(`/leads/${id}/observacoes`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getLeadObservations(id: string, token: string) {
  const { data } = await Api.get<LeadObservation[]>(`/leads/${id}/observacoes`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export function createLead(payload: CreateLeadPayload, token: string) {
  return Api.post<Lead>('/leads', normalizarEmpresaLead(payload), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data).then(normalizarEmpresaLead);
}
export function updateLeadStatus(id: string, status: string, token: string) {
  return Api.patch<Lead>(`/leads/${id}/status`, { status }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data).then(normalizarEmpresaLead);
}
export function updateLead(id: string, payload: UpdateLeadPayload, token: string) {
  return Api.patch<Lead>(`/leads/${id}`, normalizarEmpresaLead(payload), { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }).then(({ data }) => data).then(normalizarEmpresaLead);
}
// exlcuir lead
export async function excluirLead(id: string, token: string) {
  const { data } = await Api.delete<{
    message: string;
  }>(`/leads/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function convertLeadToClient(id: string, payload: ConvertLeadToClientPayload, token: string) {
  const { data } = await Api.post<ConvertLeadToClientResponse>(`/leads/${id}/convert-to-client`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getLeadImportJobs(token: string) {
  const { data } = await Api.get<LeadImportJob[]>('/leads/import-jobs', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getLeadImportJob(id: string, token: string) {
  const { data } = await Api.get<LeadImportJob>(`/leads/import-jobs/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function importLeadsCsv(payload: ImportLeadsCsvPayload, token: string) {
  const formData = new FormData();
  formData.append('file', payload.file);
  if (payload.defaultSource?.trim()) {
    formData.append('defaultSource', payload.defaultSource.trim());
  }
  if (payload.defaultStatus?.trim()) {
    formData.append('defaultStatus', payload.defaultStatus.trim());
  }
  const response = await Api.post(`/leads/import/csv`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  const data = response.data;
  return data as LeadImportJob;
}
export async function simulateWhatsAppLead(payload: ReceiveWhatsAppLeadPayload, integrationToken: string) {
  const response = await Api.post(`/leads/integrations/whatsapp`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'x-integration-token': integrationToken,
    }
  });
  const data = response.data;
  return data as {
    created: boolean;
    lead: Lead;
    message: string;
  };
}
export interface SolicitacaoExclusaoLead {
  id: string;
  leadId: string | null;
  status: 'PENDENTE' | 'APROVADA' | 'RECUSADA' | 'CANCELADA';
  leadNameSnapshot: string;
  reason: string | null;
  createdAt: string;
  requestedBy?: {
    id: string;
    name: string;
  };
}
export async function solicitarExclusaoLead(id: string, reason: string, token: string) {
  const { data } = await Api.post<SolicitacaoExclusaoLead>(`/leads/${id}/deletion-request`, { reason }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getSolicitacoesExclusaoLeads(token: string) {
  const { data } = await Api.get<SolicitacaoExclusaoLead[]>('/leads/deletion-requests', { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function decidirExclusaoLead(id: string, payload: {
  action: 'APPROVE' | 'REJECT';
  message?: string;
}, token: string) {
  const { data } = await Api.post<{
    message: string;
  }>(`/leads/deletion-requests/${id}/decision`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
