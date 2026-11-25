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

export const MarketingManualReportsService = {
  listManualReports: async (signal?: AbortSignal) => {
    const { data } = await Api.get<ManualReportSummary[]>("/marketing-metrics/manual-reports", { signal });
    return data;
  },

  getManualReport: async (id: string, signal?: AbortSignal) => {
    const { data } = await Api.get<ManualReport>(`/marketing-metrics/manual-reports/${encodeURIComponent(id)}`, { signal });
    return data;
  },

  importManualReport: async (form: FormData): Promise<ManualReport> => {
    const { data } = await Api.post<ManualReport>('/marketing-metrics/manual-reports', form);
    return data;
  },
};
