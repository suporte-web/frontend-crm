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

export const EntradasService = {
  getEntradas: async (filters: EntradaFilters = {}) => {
    const { data } = await Api.get<EntradaTicket[]>(`/entradas${buildEntradaQuery(filters)}`);
    return data;
  },

  getEntrada: async (id: string) => {
    const { data } = await Api.get<EntradaTicket>(`/entradas/${id}`);
    return data;
  },

  assumirEntrada: async (id: string) => {
    const { data } = await Api.post<EntradaTicket>(`/entradas/${id}/assumir`, {});
    return data;
  },

  getProspectSuggestions: async (id: string) => {
    const { data } = await Api.get<ProspectSuggestions>(`/entradas/${id}/prospects/sugestoes`);
    return data;
  },

  linkOrCreateProspect: async (id: string, payload: LinkProspectPayload) => {
    const { data } = await Api.post<EntradaTicket>(`/entradas/${id}/prospect`, payload);
    return data;
  },

  createEntradaQuote: async (id: string, payload: CreateEntradaQuotePayload) => {
    const { data } = await Api.post<Quote>(`/entradas/${id}/cotacao`, payload);
    return data;
  },

  finalizarEntrada: async (id: string, note: string) => {
    const { data } = await Api.post<EntradaTicket>(`/entradas/${id}/finalizar`, { note });
    return data;
  },

  marcarEntradaPerdida: async (id: string, note: string) => {
    const { data } = await Api.post<EntradaTicket>(`/entradas/${id}/perder`, { note });
    return data;
  },
};
