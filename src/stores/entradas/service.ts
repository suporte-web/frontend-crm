import { Api } from '@/utils/Api';
import type { CreateEntradaQuotePayload, EntradaFilters, EntradaTicket, LinkProspectPayload, ProspectSuggestions, } from '@/types/entradas';
import type { Quote } from '@/types/quotes';
function buildEntradaQuery(filters: EntradaFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'TODOS') {
    params.set('status', filters.status);
  }
  if (filters.tipo && filters.tipo !== 'TODOS') {
    params.set('tipo', filters.tipo);
  }
  if (filters.origem && filters.origem !== 'TODOS') {
    params.set('origem', filters.origem);
  }
  if (filters.responsavelId?.trim()) {
    params.set('responsavelId', filters.responsavelId.trim());
  }
  if (filters.dateFrom) {
    params.set('dateFrom', filters.dateFrom);
  }
  if (filters.dateTo) {
    params.set('dateTo', filters.dateTo);
  }
  if (filters.q?.trim()) {
    params.set('q', filters.q.trim());
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}
export async function getEntradas(token: string, filters: EntradaFilters = {}) {
  const { data } = await Api.get<EntradaTicket[]>(`/entradas${buildEntradaQuery(filters)}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getEntrada(id: string, token: string) {
  const { data } = await Api.get<EntradaTicket>(`/entradas/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function assumirEntrada(id: string, token: string) {
  const { data } = await Api.post<EntradaTicket>(`/entradas/${id}/assumir`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getProspectSuggestions(id: string, token: string) {
  const { data } = await Api.get<ProspectSuggestions>(`/entradas/${id}/prospects/sugestoes`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function linkOrCreateProspect(id: string, payload: LinkProspectPayload, token: string) {
  const { data } = await Api.post<EntradaTicket>(`/entradas/${id}/prospect`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function createEntradaQuote(id: string, payload: CreateEntradaQuotePayload, token: string) {
  const { data } = await Api.post<Quote>(`/entradas/${id}/cotacao`, payload, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function finalizarEntrada(id: string, note: string, token: string) {
  const { data } = await Api.post<EntradaTicket>(`/entradas/${id}/finalizar`, { note }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function marcarEntradaPerdida(id: string, note: string, token: string) {
  const { data } = await Api.post<EntradaTicket>(`/entradas/${id}/perder`, { note }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
