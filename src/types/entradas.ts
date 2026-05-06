import type { Quote } from './quotes';

export type EntradaOrigem = 'SITE' | 'PORTAL' | 'MANUAL';

export type EntradaStatus =
  | 'NOVO'
  | 'ABERTO'
  | 'EM_ANDAMENTO'
  | 'CONVERTIDO_EM_PROSPECT'
  | 'COTACAO_CRIADA'
  | 'FINALIZADO'
  | 'PERDIDO'
  | 'TRANSFERIDO'
  | 'CANCELADO'
  | 'REPROVADO';

export type EntradaTipo =
  | 'COTACAO'
  | 'FORNECEDOR'
  | 'AGREGADO'
  | 'FINANCEIRO'
  | 'FISCAL'
  | 'JURIDICO'
  | 'MARKETING'
  | 'FROTA';

export type ProspectStatusCadastral =
  | 'PROSPECT'
  | 'AGUARDANDO_CADASTRO'
  | 'EM_VALIDACAO'
  | 'ATIVO'
  | 'REPROVADO'
  | 'INATIVO';

export type ProspectPortalAccessStatus =
  | 'SEM_ACESSO'
  | 'CONVITE_ENVIADO'
  | 'ATIVO'
  | 'BLOQUEADO';

export type EntradaUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export type Prospect = {
  id: string;
  nomeRazaoSocial: string;
  nomeContato?: string | null;
  email?: string | null;
  telefone?: string | null;
  document?: string | null;
  cidade?: string | null;
  estado?: string | null;
  origem: EntradaOrigem;
  statusCadastral: ProspectStatusCadastral;
  portalAccessStatus: ProspectPortalAccessStatus;
  createdFromTicketId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EntradaClient = {
  id: string;
  companyName?: string | null;
  document?: string | null;
  phone?: string | null;
  user?: EntradaUser | null;
};

export type EntradaHistory = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  createdBy?: EntradaUser | null;
};

export type EntradaTicket = {
  id: string;
  protocolo?: string | null;
  origem?: EntradaOrigem | null;
  type: EntradaTipo;
  status: EntradaStatus;
  prioridade?: string | null;
  nomeSolicitante?: string | null;
  emailSolicitante?: string | null;
  telefoneSolicitante?: string | null;
  mensagem?: string | null;
  formPayload?: Record<string, unknown> | null;
  assignedToId?: string | null;
  prospectId?: string | null;
  clientId?: string | null;
  quoteId?: string | null;
  subject: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  assignedTo?: EntradaUser | null;
  prospect?: Prospect | null;
  client?: EntradaClient | null;
  quote?: Quote | null;
  history?: EntradaHistory[];
};

export type EntradaFilters = {
  status?: EntradaStatus | 'TODOS';
  tipo?: EntradaTipo | 'TODOS';
  responsavelId?: string;
  origem?: EntradaOrigem | 'TODOS';
  dateFrom?: string;
  dateTo?: string;
  q?: string;
};

export type ProspectSuggestions = {
  criteria: {
    email?: string | null;
    telefone?: string | null;
    document?: string | null;
  };
  prospects: Prospect[];
  clients: EntradaClient[];
};

export type LinkProspectPayload = {
  prospectId?: string;
  clientId?: string;
  nomeRazaoSocial?: string;
  nomeContato?: string;
  email?: string;
  telefone?: string;
  document?: string;
  cidade?: string;
  estado?: string;
};

export type CreateEntradaQuotePayload = {
  origin: string;
  destination: string;
  serviceType: string;
  requestType?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  cargoDescription?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  weight?: number;
  volume?: number;
  quantity?: number;
  merchandiseValue?: number;
  desiredDeadline?: string;
  notes?: string;
};
