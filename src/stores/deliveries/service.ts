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
export async function getDeliveries(filters: Partial<DeliveryFilters>, token: string) {
  const { data } = await Api.get<DeliveryRow[]>(`/entregas${buildQueryString(filters)}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function getDeliveriesSummary(filters: Partial<DeliveryFilters>, token: string) {
  const { data } = await Api.get<DeliverySummary>(`/entregas/resumo${buildQueryString(filters)}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function getCities(filters: Partial<DeliveryFilters>, token: string) {
  const { data } = await Api.get<DeliveryCity[]>(`/entregas/find-cities${buildQueryString(filters)}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function getRegions(filters: Partial<DeliveryFilters>, token: string) {
  const { data } = await Api.get<DeliveryRegion[]>(`/entregas/find-regions${buildQueryString(filters)}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function getPayers(filters: Partial<DeliveryFilters>, token: string) {
  const url = `/entregas/find-payers${buildQueryString(filters)}`;
  const { data } = await Api.get<DeliveryPayer[]>(url, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function getOccurrences(filters: Partial<DeliveryFilters>, token: string) {
  const { data } = await Api.get<DeliveryOccurrence[]>(`/entregas/find-occurrences${buildQueryString(filters)}`, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
