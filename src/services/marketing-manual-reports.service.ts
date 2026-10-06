import { API_BASE_URL, apiFetch } from "./api";

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
  data: { columns: string[]; rows: string[][] };
};

export function listManualReports(token: string, signal?: AbortSignal) {
  return apiFetch<ManualReportSummary[]>(
    "/marketing-metrics/manual-reports",
    { cache: "no-store", signal },
    token,
  );
}
export function getManualReport(
  token: string,
  id: string,
  signal?: AbortSignal,
) {
  return apiFetch<ManualReport>(
    `/marketing-metrics/manual-reports/${encodeURIComponent(id)}`,
    { cache: "no-store", signal },
    token,
  );
}
export async function importManualReport(
  token: string,
  form: FormData,
): Promise<ManualReport> {
  const response = await fetch(
    `${API_BASE_URL}/marketing-metrics/manual-reports`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message;
    throw new Error(
      Array.isArray(message)
        ? message.join(" · ")
        : message || "Não foi possível importar o relatório.",
    );
  }
  return data as ManualReport;
}
