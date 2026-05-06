export type QuoteStatus =
  | "RECEIVED"
  | "IN_ANALYSIS"
  | "ANSWERED"
  | "APPROVED"
  | "REJECTED";

export interface QuoteHistoryEntry {
  id: string;
  status: QuoteStatus;
  notes?: string | null;
  createdAt: string;
}

export interface QuoteClientUser {
  id: string;
  name: string;
  email: string;
}

export interface QuotePropostaSummary {
  id: string;
  code: string;
  titulo: string;
  valor?: number | string | null;
  status: string;
  versao: number;
  updatedAt?: string;
}

export interface QuoteClient {
  id: string;
  companyName?: string | null;
  user?: QuoteClientUser | null;
}

export interface QuoteProspect {
  id: string;
  nomeRazaoSocial: string;
  nomeContato?: string | null;
  email?: string | null;
  telefone?: string | null;
  statusCadastral?: string | null;
  portalAccessStatus?: string | null;
}

export interface Quote {
  id: string;
  code: string;
  clientId?: string | null;
  prospectId?: string | null;
  origin: string;
  destination: string;
  serviceType: string;
  requestType?: string | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  cargoDescription?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  weight?: number | null;
  volume?: number | null;
  quantity?: number | null;
  merchandiseValue?: number | string | null;
  desiredDeadline?: string | null;
  notes?: string | null;
  price?: number | string | null;
  commercialNotes?: string | null;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  history?: QuoteHistoryEntry[];
  client?: QuoteClient | null;
  prospect?: QuoteProspect | null;
  propostas?: QuotePropostaSummary[];
}

export interface CreateQuotePayload {
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
  merchandiseValue: number;
  desiredDeadline?: string;
  notes?: string;
}
