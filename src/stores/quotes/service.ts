import { Api } from '@/utils/Api';
import type { CreateInternalQuotePayload, CreateQuotePayload, Quote, QuoteStatus, } from '@/types/quotes';
export async function createQuote(payload: CreateQuotePayload, token: string) {
  const { data } = await Api.post<Quote>(`/quotes`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function getMyQuotes(token: string) {
  const { data } = await Api.get<Quote[]>(`/quotes/me`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function getAllQuotes(token: string) {
  const { data } = await Api.get<Quote[]>(`/quotes`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function getQuoteById(id: string, token: string) {
  const { data } = await Api.get<Quote>(`/quotes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function createInternalQuote(payload: CreateInternalQuotePayload, token: string) {
  const { data } = await Api.post<Quote>(`/quotes/internal`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function respondQuote(id: string, payload: {
  price: number;
  commercialNotes?: string;
}, token: string) {
  const { data } = await Api.patch<Quote>(`/quotes/${id}/respond`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function updateQuoteStatus(id: string, payload: {
  status: QuoteStatus;
  notes?: string;
}, token: string) {
  const { data } = await Api.patch<Quote>(`/quotes/${id}/status`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function updateQuote(id: string, payload: Partial<CreateQuotePayload>, token: string) {
  const { data } = await Api.patch<Quote>(`/quotes/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function deleteQuote(id: string, token: string) {
  const { data } = await Api.post<{
    message: string;
  }>(`/quotes/${id}/delete`, undefined, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
