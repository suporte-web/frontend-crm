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
async function fetchPropostaWithOptionalFile<T>(endpoint: string, method: 'POST' | 'PATCH', payload: CreatePropostaPayload | UpdatePropostaPayload, token: string, arquivo?: File | null): Promise<T> {
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
  const { data } = await Api.request<T>({ url: endpoint, method, data: body, headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function getAllTickets(token: string, filters: TicketFilters = {}) {
  const query = buildTicketQuery(filters);
  const { data } = await Api.get<Ticket[]>(`/tickets${query}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getMyTickets(token: string, filters: TicketFilters = {}) {
  const query = buildTicketQuery(filters);
  const { data } = await Api.get<Ticket[]>(`/tickets/me${query}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getTicket(id: string, token: string) {
  const { data } = await Api.get<Ticket>(`/tickets/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function createTicket(payload: CreateTicketPayload, token: string) {
  const { data } = await Api.post<Ticket>("/tickets", payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function updateTicketStatus(id: string, status: TicketStatus, token: string) {
  const { data } = await Api.patch<Ticket>(`/tickets/${id}/status`, { status }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function replyTicket(id: string, message: string, token: string) {
  const { data } = await Api.post<Ticket>(`/tickets/${id}/messages`, { message }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function addInternalTicketNote(id: string, message: string, token: string) {
  const { data } = await Api.post<Ticket>(`/tickets/${id}/messages`, { message, isInternal: true }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function startTicket(id: string, token: string) {
  const { data } = await Api.post<Ticket>(`/tickets/${id}/start`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function sendPreProposal(id: string, payload: {
  message: string;
  preContractNotes?: string;
  opportunityId?: string;
}, token: string) {
  const { data } = await Api.post<Ticket>(`/tickets/${id}/pre-proposal`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function clientTicketDecision(id: string, payload: {
  action: "APPROVE" | "REQUEST_ADJUSTMENT" | "REJECT";
  message?: string;
}, token: string) {
  const { data } = await Api.post<Ticket>(`/tickets/${id}/client-decision`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function sendTicketToManagement(id: string, payload: {
  message?: string;
}, token: string) {
  const { data } = await Api.post<Ticket>(`/tickets/${id}/send-to-management`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function managementTicketDecision(id: string, payload: {
  action: "APPROVE" | "REQUEST_ADJUSTMENT" | "REJECT";
  message?: string;
  notifyClient?: boolean;
}, token: string) {
  const { data } = await Api.post<Ticket>(`/tickets/${id}/management-decision`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
/**
* PROPOSTAS
*
* Esses endpoints usam a nova entidade formal `Proposta`.
* Eles não removem o fluxo antigo de pre-proposal/client-decision.
*/
export async function getTicketPropostas(ticketId: string, token: string) {
  const { data } = await Api.get<Proposta[]>(`/tickets/${ticketId}/propostas`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getTicketProposta(ticketId: string, propostaId: string, token: string) {
  const { data } = await Api.get<Proposta>(`/tickets/${ticketId}/propostas/${propostaId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export function createTicketProposta(ticketId: string, payload: CreatePropostaPayload, token: string, arquivo?: File | null) {
  return fetchPropostaWithOptionalFile<Proposta>(`/tickets/${ticketId}/propostas`, "POST", payload, token, arquivo);
}
export function updateTicketProposta(ticketId: string, propostaId: string, payload: UpdatePropostaPayload, token: string, arquivo?: File | null) {
  return fetchPropostaWithOptionalFile<Proposta>(`/tickets/${ticketId}/propostas/${propostaId}`, "PATCH", payload, token, arquivo);
}
export async function sendTicketPropostaToClient(ticketId: string, propostaId: string, token: string, payload: UpdatePropostaPayload = {}) {
  const { data } = await Api.post<PropostaActionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/enviar-cliente`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function sendTicketPropostaToManagement(ticketId: string, propostaId: string, token: string) {
  const { data } = await Api.post<PropostaActionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/enviar-gestao`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function approveTicketPropostaByClient(ticketId: string, propostaId: string, token: string) {
  const { data } = await Api.post<ClientPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/aprovar-cliente`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function requestTicketPropostaAdjustmentByClient(ticketId: string, propostaId: string, motivo: string, token: string) {
  const payload: ClientePropostaDecisionPayload = {
    motivo,
  };
  const { data } = await Api.post<ClientPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/solicitar-ajuste-cliente`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function rejectTicketPropostaByClient(ticketId: string, propostaId: string, motivo: string, token: string) {
  const payload: ClientePropostaDecisionPayload = {
    motivo,
  };
  const { data } = await Api.post<ClientPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/recusar-cliente`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function approveTicketPropostaByManagement(ticketId: string, propostaId: string, token: string) {
  const { data } = await Api.post<ManagementPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/aprovar-gestao`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function requestTicketPropostaAdjustmentByManagement(ticketId: string, propostaId: string, motivo: string, token: string) {
  const payload: GestaoPropostaDecisionPayload = {
    motivo,
  };
  const { data } = await Api.post<ManagementPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/solicitar-ajuste-gestao`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function rejectTicketPropostaByManagement(ticketId: string, propostaId: string, motivo: string, token: string) {
  const payload: GestaoPropostaDecisionPayload = {
    motivo,
  };
  const { data } = await Api.post<ManagementPropostaDecisionResponse>(`/tickets/${ticketId}/propostas/${propostaId}/recusar-gestao`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
