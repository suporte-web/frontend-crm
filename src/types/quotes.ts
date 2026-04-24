export type QuoteStatus =
  | 'RECEIVED'
  | 'IN_ANALYSIS'
  | 'ANSWERED'
  | 'APPROVED'
  | 'REJECTED';

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

export interface QuoteClient {
  id: string;
  companyName?: string | null;
  user?: QuoteClientUser | null;
}

export interface Quote {
  id: string;
  clientId: string;
  origin: string;
  destination: string;
  serviceType: string;
  requestType?: string | null;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  cargoDescription?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  weight?: number | null;
  volume?: number | null;
  quantity?: number | null;
  merchandiseValue?: number | null;
  desiredDeadline?: string | null;
  notes?: string | null;
  price?: number | null;
  commercialNotes?: string | null;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  history?: QuoteHistoryEntry[];
  client?: QuoteClient | null;
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
  weight?: number;
  volume?: number;
  quantity?: number;
  merchandiseValue?: number;
  desiredDeadline?: string;
  notes?: string;
}
