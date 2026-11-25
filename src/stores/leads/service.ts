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

export const LeadsService = {
  // Lead convertido para cliente
  getLeads: (filters: LeadFilters = {}) => {
    return Api.get<Lead[]>(`/leads${buildQuery(filters)}`).then(({ data }) => data).then(registros => registros.map(normalizarEmpresaLead));
  },

  // resumo leads
  getLeadsResumo: async (filters: LeadFilters = {}) => {
    const { data } = await Api.get<LeadsResumo>(`/leads/resumo${buildQuery(filters)}`);
    return data;
  },

  getLeadById: (id: string) => {
    return Api.get<Lead>(`/leads/${id}`).then(({ data }) => data).then(normalizarEmpresaLead);
  },

  createLeadObservation: async (id: string, payload: CreateLeadObservationPayload) => {
    const { data } = await Api.post<LeadObservation>(`/leads/${id}/observacoes`, payload);
    return data;
  },

  getLeadObservations: async (id: string) => {
    const { data } = await Api.get<LeadObservation[]>(`/leads/${id}/observacoes`);
    return data;
  },

  createLead: (payload: CreateLeadPayload) => {
    return Api.post<Lead>('/leads', normalizarEmpresaLead(payload)).then(({ data }) => data).then(normalizarEmpresaLead);
  },

  updateLeadStatus: (id: string, status: string) => {
    return Api.patch<Lead>(`/leads/${id}/status`, { status }).then(({ data }) => data).then(normalizarEmpresaLead);
  },

  updateLead: (id: string, payload: UpdateLeadPayload) => {
    return Api.patch<Lead>(`/leads/${id}`, normalizarEmpresaLead(payload)).then(({ data }) => data).then(normalizarEmpresaLead);
  },

  // exlcuir lead
  excluirLead: async (id: string) => {
    const { data } = await Api.delete<{
      message: string;
    }>(`/leads/${id}`);
    return data;
  },

  convertLeadToClient: async (id: string, payload: ConvertLeadToClientPayload) => {
    const { data } = await Api.post<ConvertLeadToClientResponse>(`/leads/${id}/convert-to-client`, payload);
    return data;
  },

  getLeadImportJobs: async () => {
    const { data } = await Api.get<LeadImportJob[]>('/leads/import-jobs');
    return data;
  },

  getLeadImportJob: async (id: string) => {
    const { data } = await Api.get<LeadImportJob>(`/leads/import-jobs/${id}`);
    return data;
  },

  importLeadsCsv: async (payload: ImportLeadsCsvPayload) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.defaultSource?.trim()) {
      formData.append('defaultSource', payload.defaultSource.trim());
    }
    if (payload.defaultStatus?.trim()) {
      formData.append('defaultStatus', payload.defaultStatus.trim());
    }
    const response = await Api.post(`/leads/import/csv`, formData);
    const data = response.data;
    return data as LeadImportJob;
  },

  simulateWhatsAppLead: async (payload: ReceiveWhatsAppLeadPayload, integrationToken: string) => {
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
  },

  solicitarExclusaoLead: async (id: string, reason: string) => {
    const { data } = await Api.post<SolicitacaoExclusaoLead>(`/leads/${id}/deletion-request`, { reason });
    return data;
  },

  getSolicitacoesExclusaoLeads: async () => {
    const { data } = await Api.get<SolicitacaoExclusaoLead[]>('/leads/deletion-requests');
    return data;
  },

  decidirExclusaoLead: async (id: string, payload: {
    action: 'APPROVE' | 'REJECT';
    message?: string;
  }) => {
    const { data } = await Api.post<{
      message: string;
    }>(`/leads/deletion-requests/${id}/decision`, payload);
    return data;
  },
};
