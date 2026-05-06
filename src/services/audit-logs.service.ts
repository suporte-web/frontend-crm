import { API_BASE_URL, apiFetch } from '@/services/api';
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

export function getAuditLogs(token: string, filters: AuditLogFilters = {}) {
  return apiFetch<AuditLog[]>(`/audit-logs${buildQuery(filters)}`, {}, token);
}

export function getAuditLogSummary(token: string, filters: AuditLogFilters = {}) {
  return apiFetch<AuditLogSummary>(`/audit-logs/summary${buildQuery(filters)}`, {}, token);
}

export async function exportAuditLogs(token: string, filters: AuditLogFilters = {}) {
  const response = await fetch(`${API_BASE_URL}/audit-logs/export.csv${buildQuery(filters)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || data?.error || 'Erro ao exportar logs.');
  }

  const blob = await response.blob();
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
