import { Api } from '@/utils/Api';
import type { DeliveryCity, DeliveryFilters, DeliveryOccurrence, DeliveryPayer, DeliveryRegion, DeliveryRow, DeliverySummary, } from '@/types/deliveries';
function buildQueryString(filters: Partial<DeliveryFilters>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'string' &&
      value.trim() &&
      value.trim() !== 'Todos') {
      params.set(key, value.trim());
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const DeliveriesService = {
  getDeliveries: async (filters: Partial<DeliveryFilters>) => {
    const { data } = await Api.get<DeliveryRow[]>(`/entregas${buildQueryString(filters)}`);
    return data;
  },

  getDeliveriesSummary: async (filters: Partial<DeliveryFilters>) => {
    const { data } = await Api.get<DeliverySummary>(`/entregas/resumo${buildQueryString(filters)}`);
    return data;
  },

  getCities: async (filters: Partial<DeliveryFilters>) => {
    const { data } = await Api.get<DeliveryCity[]>(`/entregas/find-cities${buildQueryString(filters)}`);
    return data;
  },

  getRegions: async (filters: Partial<DeliveryFilters>) => {
    const { data } = await Api.get<DeliveryRegion[]>(`/entregas/find-regions${buildQueryString(filters)}`);
    return data;
  },

  getPayers: async (filters: Partial<DeliveryFilters>) => {
    const url = `/entregas/find-payers${buildQueryString(filters)}`;
    const { data } = await Api.get<DeliveryPayer[]>(url);
    return data;
  },

  getOccurrences: async (filters: Partial<DeliveryFilters>) => {
    const { data } = await Api.get<DeliveryOccurrence[]>(`/entregas/find-occurrences${buildQueryString(filters)}`);
    return data;
  },
};
