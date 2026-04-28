import type { Quote } from "./quotes";
import type { Opportunity } from "./crm";


export type TicketStatus =
  | "NOVO"
  | "ABERTO"
  | "EM_ANDAMENTO"
  | "AGUARDANDO_CLIENTE"
  | "AGUARDANDO_COMERCIAL"
  | "AGUARDANDO_GESTAO"
  | "RESPONDIDO"
  | "APROVADO_CLIENTE"
  | "APROVADO_GESTAO"
  | "AJUSTE_SOLICITADO"
  | "REPROVADO"
  | "FECHADO"
  | "CANCELADO";

export type TicketType =
  | "COTACAO"
  | "LEAD"
  | "PRE_NEGOCIACAO"
  | "APROVACAO_GESTAO"
  | "AJUSTE_CLIENTE"
  | "AJUSTE_GESTAO"
  | "SUPORTE"
  | "DOCUMENTACAO"
  | "OPERACIONAL";

export type TicketHistoryEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "MESSAGE_SENT"
  | "INTERNAL_NOTE"
  | "NOTIFICATION_SENT"
  | "EMAIL_SENT"
  | "PRE_PROPOSAL_SENT"
  | "APPROVAL_SENT"
  | "APPROVED"
  | "REJECTED"
  | "ADJUSTMENT_REQUESTED"
  | "CLOSED";

export type TicketMessage = {
  id: string;
  ticketId: string;
  senderType: "CLIENTE" | "INTERNO" | "CLIENT" | "AGENT" | "AI";
  message: string;
  isInternal?: boolean;
  attachments?: unknown;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
};

export type TicketHistory = {
  id: string;
  ticketId: string;
  eventType: TicketHistoryEventType;
  title: string;
  description: string;
  internalOnly: boolean;
  metadata?: Record<string, unknown> | null;
  createdById?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
};

export type StatusProposta =
  | "RASCUNHO"
  | "ENVIADA_AO_CLIENTE"
  | "APROVADA_PELO_CLIENTE"
  | "RECUSADA_PELO_CLIENTE"
  | "AJUSTE_SOLICITADO_PELO_CLIENTE"
  | "ENVIADA_PARA_GESTAO"
  | "APROVADA_PELA_GESTAO"
  | "RECUSADA_PELA_GESTAO"
  | "AJUSTE_SOLICITADO_PELA_GESTAO"
  | "CANCELADA"
  | "EXPIRADA";

export type Proposta = {
  id: string;
  ticketId: string;
  quoteId?: string | null;
  opportunityId?: string | null;
  clientId?: string | null;

  criadaPorId?: string | null;
  enviadaPorId?: string | null;

  status: StatusProposta;

  titulo: string;
  descricao?: string | null;
  descricaoServico?: string | null;
  origem?: string | null;
  destino?: string | null;

  valor?: string | number | null;

  condicoesPagamento?: string | null;
  condicoesComerciais?: string | null;
  observacoes?: string | null;

  validadeDias?: number | null;
  validaAte?: string | null;

  versao: number;

  enviadaEm?: string | null;

  aprovadaPeloClienteEm?: string | null;
  recusadaPeloClienteEm?: string | null;
  ajusteSolicitadoPeloClienteEm?: string | null;

  enviadaParaGestaoEm?: string | null;
  aprovadaPelaGestaoEm?: string | null;
  recusadaPelaGestaoEm?: string | null;
  ajusteSolicitadoPelaGestaoEm?: string | null;

  createdAt: string;
  updatedAt: string;

  criadaPor?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;

  enviadaPor?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
};

export type StatusLogEmail =
  | "PENDENTE"
  | "ENVIADO"
  | "FALHOU"
  | "IGNORADO";

export type LogEmail = {
  id: string;

  ticketId?: string | null;
  propostaId?: string | null;
  notificationId?: string | null;
  userId?: string | null;

  emailDestino: string;
  assunto: string;
  resumo?: string | null;
  template?: string | null;

  status: StatusLogEmail;

  provedor?: string | null;
  idMensagemProvedor?: string | null;
  mensagemErro?: string | null;

  enviadoEm?: string | null;
  createdAt: string;
};

export type PropostaActionResponse = {
  proposta: Proposta;
  ticketStatus: TicketStatus;
  mensagem: string;
};

export type ClientPropostaDecisionResponse = PropostaActionResponse;

export type CreatePropostaPayload = {
  titulo: string;
  descricao?: string;
  descricaoServico?: string;
  origem?: string;
  destino?: string;
  valor?: number;
  condicoesPagamento?: string;
  condicoesComerciais?: string;
  observacoes?: string;
  validadeDias?: number;
  validaAte?: string;
};

export type UpdatePropostaPayload = Partial<CreatePropostaPayload>;

export type ClientePropostaDecisionPayload = {
  motivo?: string;
};

export type GestaoPropostaDecisionPayload = {
  motivo?: string;
};

export type TicketLead = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  status?: string | null;
};

export type Ticket = {
  id: string;
  clientId?: string | null;
  quoteId?: string | null;
  leadId?: string | null;
  opportunityId?: string | null;
  assignedToId?: string | null;
  requesterId?: string | null;
  type: TicketType;
  subject: string;
  description: string;
  status: TicketStatus;
  requiresActionRole?: string | null;
  lastInteractionAt?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    companyName?: string | null;
    user?: {
      id: string;
      name: string;
      email: string;
    } | null;
  } | null;
  quote?: Quote | null;
  lead?: TicketLead | null;
  opportunity?: Opportunity | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  requester?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  messages?: TicketMessage[];
  history?: TicketHistory[];

  propostas?: Proposta[];
  propostaAtual?: Proposta | null;
  currentProposal?: Proposta | null;

  canCreateProposal?: boolean;
  canSendProposalToClient?: boolean;
  canClientApproveProposal?: boolean;
  canClientRequestAdjustment?: boolean;
  canClientRejectProposal?: boolean;
  canSendToManagement?: boolean;
  canManagementApprove?: boolean;
  canManagementReject?: boolean;
  canManagementRequestAdjustment?: boolean;
  canReleaseService?: boolean;

  displayStatus?: string;
  nextAction?: string | null;
};

export type CreateTicketPayload = {
  clientId?: string;
  quoteId?: string;
  leadId?: string;
  opportunityId?: string;
  assignedToId?: string;
  type?: TicketType;
  subject: string;
  description: string;
};
