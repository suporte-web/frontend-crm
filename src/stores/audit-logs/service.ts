import { Api } from '@/utils/Api';
import type { AuditLog, AuditLogFilters, AuditLogSummary } from '@/types/audit-logs';
function buildQuery(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value?.trim()) {
      params.set(key, value.trim());
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}
export async function getAuditLogs(token: string, filters: AuditLogFilters = {}) {
  const { data } = await Api.get<AuditLog[]>(`/audit-logs${buildQuery(filters)}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getAuditLogSummary(token: string, filters: AuditLogFilters = {}) {
  const { data } = await Api.get<AuditLogSummary>(`/audit-logs/summary${buildQuery(filters)}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function exportAuditLogs(token: string, filters: AuditLogFilters = {}) {
  const response = await Api.get(`/audit-logs/export.csv${buildQuery(filters)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    }, responseType: 'blob'
  });
  const blob = response.data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const suffix = filters.dateFrom || filters.dateTo || new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `logs-operacionais-${suffix}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
