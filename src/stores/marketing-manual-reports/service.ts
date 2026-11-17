import { Api } from '@/utils/Api';
export type ManualReportSummary = {
  id: string;
  title: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  filename: string;
  rowCount: number;
  createdAt: string;
};
export type ManualReport = ManualReportSummary & {
  data: {
    columns: string[];
    rows: string[][];
  };
};
export async function listManualReports(token: string, signal?: AbortSignal) {
  const { data } = await Api.get<ManualReportSummary[]>("/marketing-metrics/manual-reports", { signal, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function getManualReport(token: string, id: string, signal?: AbortSignal) {
  const { data } = await Api.get<ManualReport>(`/marketing-metrics/manual-reports/${encodeURIComponent(id)}`, { signal, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function importManualReport(token: string, form: FormData): Promise<ManualReport> {
  const { data } = await Api.post<ManualReport>('/marketing-metrics/manual-reports', form, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
