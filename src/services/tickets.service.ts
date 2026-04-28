import { apiFetch } from "@/services/api";
import type {
  ClientePropostaDecisionPayload,
  ClientPropostaDecisionResponse,
  CreatePropostaPayload,
  CreateTicketPayload,
  Proposta,
  PropostaActionResponse,
  Ticket,
  TicketStatus,
  TicketType,
  UpdatePropostaPayload,
} from "@/types/tickets";

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

export function getAllTickets(token: string, filters: TicketFilters = {}) {
  const query = buildTicketQuery(filters);

  return apiFetch<Ticket[]>(`/tickets${query}`, {}, token);
}

export function getMyTickets(token: string, filters: TicketFilters = {}) {
  const query = buildTicketQuery(filters);

  return apiFetch<Ticket[]>(`/tickets/me${query}`, {}, token);
}

export function getTicket(id: string, token: string) {
  return apiFetch<Ticket>(`/tickets/${id}`, {}, token);
}

export function createTicket(payload: CreateTicketPayload, token: string) {
  return apiFetch<Ticket>(
    "/tickets",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function updateTicketStatus(
  id: string,
  status: TicketStatus,
  token: string,
) {
  return apiFetch<Ticket>(
    `/tickets/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    token,
  );
}

export function replyTicket(id: string, message: string, token: string) {
  return apiFetch<Ticket>(
    `/tickets/${id}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
    token,
  );
}

export function addInternalTicketNote(
  id: string,
  message: string,
  token: string,
) {
  return apiFetch<Ticket>(
    `/tickets/${id}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ message, isInternal: true }),
    },
    token,
  );
}

export function startTicket(id: string, token: string) {
  return apiFetch<Ticket>(
    `/tickets/${id}/start`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    token,
  );
}

export function sendPreProposal(
  id: string,
  payload: {
    message: string;
    preContractNotes?: string;
    opportunityId?: string;
  },
  token: string,
) {
  return apiFetch<Ticket>(
    `/tickets/${id}/pre-proposal`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function clientTicketDecision(
  id: string,
  payload: {
    action: "APPROVE" | "REQUEST_ADJUSTMENT" | "REJECT";
    message?: string;
  },
  token: string,
) {
  return apiFetch<Ticket>(
    `/tickets/${id}/client-decision`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function sendTicketToManagement(
  id: string,
  payload: { message?: string },
  token: string,
) {
  return apiFetch<Ticket>(
    `/tickets/${id}/send-to-management`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function managementTicketDecision(
  id: string,
  payload: {
    action: "APPROVE" | "REQUEST_ADJUSTMENT" | "REJECT";
    message?: string;
    notifyClient?: boolean;
  },
  token: string,
) {
  return apiFetch<Ticket>(
    `/tickets/${id}/management-decision`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

/**
 * PROPOSTAS
 *
 * Esses endpoints usam a nova entidade formal `Proposta`.
 * Eles não removem o fluxo antigo de pre-proposal/client-decision.
 */

export function getTicketPropostas(ticketId: string, token: string) {
  return apiFetch<Proposta[]>(`/tickets/${ticketId}/propostas`, {}, token);
}

export function getTicketProposta(
  ticketId: string,
  propostaId: string,
  token: string,
) {
  return apiFetch<Proposta>(
    `/tickets/${ticketId}/propostas/${propostaId}`,
    {},
    token,
  );
}

export function createTicketProposta(
  ticketId: string,
  payload: CreatePropostaPayload,
  token: string,
) {
  return apiFetch<Proposta>(
    `/tickets/${ticketId}/propostas`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function updateTicketProposta(
  ticketId: string,
  propostaId: string,
  payload: UpdatePropostaPayload,
  token: string,
) {
  return apiFetch<Proposta>(
    `/tickets/${ticketId}/propostas/${propostaId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function sendTicketPropostaToClient(
  ticketId: string,
  propostaId: string,
  token: string,
) {
  return apiFetch<PropostaActionResponse>(
    `/tickets/${ticketId}/propostas/${propostaId}/enviar-cliente`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    token,
  );
}

export function approveTicketPropostaByClient(
  ticketId: string,
  propostaId: string,
  token: string,
) {
  return apiFetch<ClientPropostaDecisionResponse>(
    `/tickets/${ticketId}/propostas/${propostaId}/aprovar-cliente`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    token,
  );
}

export function requestTicketPropostaAdjustmentByClient(
  ticketId: string,
  propostaId: string,
  motivo: string,
  token: string,
) {
  const payload: ClientePropostaDecisionPayload = {
    motivo,
  };

  return apiFetch<ClientPropostaDecisionResponse>(
    `/tickets/${ticketId}/propostas/${propostaId}/solicitar-ajuste-cliente`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function rejectTicketPropostaByClient(
  ticketId: string,
  propostaId: string,
  motivo: string,
  token: string,
) {
  const payload: ClientePropostaDecisionPayload = {
    motivo,
  };

  return apiFetch<ClientPropostaDecisionResponse>(
    `/tickets/${ticketId}/propostas/${propostaId}/recusar-cliente`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}