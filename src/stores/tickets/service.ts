import { Api } from '@/utils/Api';
import type { ClientePropostaDecisionPayload, ClientPropostaDecisionResponse, CreatePropostaPayload, GestaoPropostaDecisionPayload, ManagementPropostaDecisionResponse, CreateTicketPayload, Proposta, PropostaActionResponse, Ticket, TicketStatus, TicketType, UpdatePropostaPayload, } from "@/types/tickets";
type TicketFilters = {
  status?: TicketStatus | "TODOS";
  type?: TicketType | "TODOS";
  q?: string;
};
function buildTicketQuery(filters: TicketFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "TODOS") {
    params.set("status", filters.status);
  }
  if (filters.type && filters.type !== "TODOS") {
    params.set("type", filters.type);
  }
  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
async function fetchPropostaWithOptionalFile<T>(endpoint: string, method: 'POST' | 'PATCH', payload: CreatePropostaPayload | UpdatePropostaPayload, arquivo?: File | null): Promise<T> {
  let body: typeof payload | FormData = payload;
  if (arquivo) {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '')
        form.append(key, String(value));
    });
    form.append('arquivo', arquivo);
    body = form;
  }
  const { data } = await Api.request<T>({ url: endpoint, method, data: body });
  return data;
}

export const TicketsService = {
  getAllTickets: async (filters: TicketFilters = {}) => {
    const query = buildTicketQuery(filters);
    const { data } = await Api.get<Ticket[]>(`/tickets${query}`);
    return data;
  },

  getMyTickets: async (filters: TicketFilters = {}) => {
    const query = buildTicketQuery(filters);
    const { data } = await Api.get<Ticket[]>(`/tickets/me${query}`);
    return data;
  },

  getTicket: async (id: string) => {
    const { data } = await Api.get<Ticket>(`/tickets/${id}`);
    return data;
  },

  createTicket: async (payload: CreateTicketPayload) => {
    const { data } = await Api.post<Ticket>("/tickets", payload);
    return data;
  },

  updateTicketStatus: async (id: string, status: TicketStatus) => {
    const { data } = await Api.patch<Ticket>(`/tickets/${id}/status`, { status });
    return data;
  },

  replyTicket: async (id: string, message: string) => {
    const { data } = await Api.post<Ticket>(`/tickets/${id}/messages`, { message });
    return data;
  },

  addInternalTicketNote: async (id: string, message: string) => {
    const { data } = await Api.post<Ticket>(`/tickets/${id}/messages`, { message, isInternal: true });
    return data;
  },

  startTicket: async (id: string) => {
    const { data } = await Api.post<Ticket>(`/tickets/${id}/start`, {});
    return data;
  },

  sendPreProposal: async (id: string, payload: {
    message: string;
    preContractNotes?: string;
    opportunityId?: string;
  }) => {
    const { data } = await Api.post<Ticket>(`/tickets/${id}/pre-proposal`, payload);
    return data;
  },

  clientTicketDecision: async (id: string, payload: {
    action: "APPROVE" | "REQUEST_ADJUSTMENT" | "REJECT";
    message?: string;
  }) => {
    const { data } = await Api.post<Ticket>(`/tickets/${id}/client-decision`, payload);
    return data;
  },

  sendTicketToManagement: async (id: string, payload: {
    message?: string;
  }) => {
    const { data } = await Api.post<Ticket>(`/tickets/${id}/send-to-management`, payload);
    return data;
  },

  managementTicketDecision: async (id: string, payload: {
    action: "APPROVE" | "REQUEST_ADJUSTMENT" | "REJECT";
    message?: string;
    notifyClient?: boolean;
  }) => {
    const { data } = await Api.post<Ticket>(`/tickets/${id}/management-decision`, payload);
    return data;
  },

  /**
  * PROPOSTAS
  *
  * Esses endpoints usam a nova entidade formal `Proposta`.
  * Eles não removem o fluxo antigo de pre-proposal/client-decision.
  */
  getTicketPropostas: async (ticketId: string) => {
    const { data } = await Api.get<Proposta[]>(`/tickets/${ticketId}/propostas`);
    return data;
  },

  getTicketProposta: async (ticketId: string, propostaId: string) => {
    const { data } = await Api.get<Proposta>(`/tickets/${ticketId}/propostas/${propostaId}`);
    return data;
  },

  createTicketProposta: (ticketId: string, payload: CreatePropostaPayload, arquivo?: File | null) => {
    return fetchPropostaWithOptionalFile<Proposta>(`/tickets/${ticketId}/propostas`, "POST", payload, arquivo);
  },

  updateTicketProposta: (ticketId: string, propostaId: string, payload: UpdatePropostaPayload, arquivo?: File | null) => {
    return fetchPropostaWithOptionalFile<Proposta>(`/tickets/${ticketId}/propostas/${propostaId}`, "PATCH", payload, arquivo);
  },

  sendTicketPropostaToClient: async (ticketId: string, propostaId: string, payload: UpdatePropostaPayload = {}) => {
    const { data } = await Api.post<PropostaActionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/enviar-cliente`, payload);
    return data;
  },

  sendTicketPropostaToManagement: async (ticketId: string, propostaId: string) => {
    const { data } = await Api.post<PropostaActionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/enviar-gestao`, {});
    return data;
  },

  approveTicketPropostaByClient: async (ticketId: string, propostaId: string) => {
    const { data } = await Api.post<ClientPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/aprovar-cliente`, {});
    return data;
  },

  requestTicketPropostaAdjustmentByClient: async (ticketId: string, propostaId: string, motivo: string) => {
    const payload: ClientePropostaDecisionPayload = {
      motivo,
    };
    const { data } = await Api.post<ClientPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/solicitar-ajuste-cliente`, payload);
    return data;
  },

  rejectTicketPropostaByClient: async (ticketId: string, propostaId: string, motivo: string) => {
    const payload: ClientePropostaDecisionPayload = {
      motivo,
    };
    const { data } = await Api.post<ClientPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/recusar-cliente`, payload);
    return data;
  },

  approveTicketPropostaByManagement: async (ticketId: string, propostaId: string) => {
    const { data } = await Api.post<ManagementPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/aprovar-gestao`, {});
    return data;
  },

  requestTicketPropostaAdjustmentByManagement: async (ticketId: string, propostaId: string, motivo: string) => {
    const payload: GestaoPropostaDecisionPayload = {
      motivo,
    };
    const { data } = await Api.post<ManagementPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/solicitar-ajuste-gestao`, payload);
    return data;
  },

  rejectTicketPropostaByManagement: async (ticketId: string, propostaId: string, motivo: string) => {
    const payload: GestaoPropostaDecisionPayload = {
      motivo,
    };
    const { data } = await Api.post<ManagementPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/recusar-gestao`, payload);
    return data;
  },
};
