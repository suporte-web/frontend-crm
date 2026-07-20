import type {
  DeliveryCity,
  DeliveryFilters,
  DeliveryOccurrence,
  DeliveryPayer,
  DeliveryRow,
  DeliverySummary,
} from '@/types/deliveries';
import { API_BASE_URL } from '@/services/api';

function buildQueryString(filters: Partial<DeliveryFilters>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      typeof value === 'string' &&
      value.trim() &&
      value.trim() !== 'Todos'
    ) {
      params.set(key, value.trim());
    }
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : '';
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || 'Erro ao comunicar com a API.',
    );
  }

  return data as T;
}

export async function getDeliveries(
  filters: Partial<DeliveryFilters>,
  token: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/entregas${buildQueryString(filters)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return parseResponse<DeliveryRow[]>(response);
}

export async function getDeliveriesSummary(
  filters: Partial<DeliveryFilters>,
  token: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/entregas/resumo${buildQueryString(filters)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return parseResponse<DeliverySummary>(response);
}

export async function getCities(
  filters: Partial<DeliveryFilters>,
  token: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/entregas/find-cities${buildQueryString(filters)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return parseResponse<DeliveryCity[]>(response);
}

export async function getPayers(
  filters: Partial<DeliveryFilters>,
  token: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/entregas/find-payers${buildQueryString(filters)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return parseResponse<DeliveryPayer[]>(response);
}

export async function getOccurrences(
  filters: Partial<DeliveryFilters>,
  token: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/entregas/find-occurrences${buildQueryString(filters)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return parseResponse<DeliveryOccurrence[]>(response);
}
