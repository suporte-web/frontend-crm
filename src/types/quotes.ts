export type QuoteStatus =
  | 'RECEIVED'
  | 'IN_ANALYSIS'
  | 'ANSWERED'
  | 'APPROVED'
  | 'REJECTED';

export interface Quote {
  id: string;
  clientId: string;
  origin: string;
  destination: string;
  serviceType: string;
  weight?: number | null;
  volume?: number | null;
  quantity?: number | null;
  desiredDeadline?: string | null;
  notes?: string | null;
  price?: number | null;
  commercialNotes?: string | null;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotePayload {
  origin: string;
  destination: string;
  serviceType: string;
  weight?: number;
  volume?: number;
  quantity?: number;
  desiredDeadline?: string;
  notes?: string;
}