import { apiFetch } from '@/services/api';
import type {
  CreateEntradaQuotePayload,
  EntradaFilters,
  EntradaTicket,
  LinkProspectPayload,
  ProspectSuggestions,
} from '@/types/entradas';
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

export function getEntradas(token: string, filters: EntradaFilters = {}) {
  return apiFetch<EntradaTicket[]>(
    `/entradas${buildEntradaQuery(filters)}`,
    {},
    token,
  );
}

export function getEntrada(id: string, token: string) {
  return apiFetch<EntradaTicket>(`/entradas/${id}`, {}, token);
}

export function assumirEntrada(id: string, token: string) {
  return apiFetch<EntradaTicket>(
    `/entradas/${id}/assumir`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    token,
  );
}

export function getProspectSuggestions(id: string, token: string) {
  return apiFetch<ProspectSuggestions>(
    `/entradas/${id}/prospects/sugestoes`,
    {},
    token,
  );
}

export function linkOrCreateProspect(
  id: string,
  payload: LinkProspectPayload,
  token: string,
) {
  return apiFetch<EntradaTicket>(
    `/entradas/${id}/prospect`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function createEntradaQuote(
  id: string,
  payload: CreateEntradaQuotePayload,
  token: string,
) {
  return apiFetch<Quote>(
    `/entradas/${id}/cotacao`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function finalizarEntrada(id: string, note: string, token: string) {
  return apiFetch<EntradaTicket>(
    `/entradas/${id}/finalizar`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
    token,
  );
}

export function marcarEntradaPerdida(id: string, note: string, token: string) {
  return apiFetch<EntradaTicket>(
    `/entradas/${id}/perder`,
    {
      method: 'POST',
      body: JSON.stringify({ note }),
    },
    token,
  );
}
