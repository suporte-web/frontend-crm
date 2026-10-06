import { apiFetch } from "@/services/api";
import type {
  MarketingEvent,
  MarketingMetrics,
  MarketingPage,
  MarketingSummary,
  MarketingTraffic,
  MetricsFilter,
} from "@/types/marketing-metrics";

export async function carregarMetricasMarketing(
  token: string,
  filter: MetricsFilter,
  signal?: AbortSignal,
): Promise<MarketingMetrics> {
  const params = new URLSearchParams({ periodo: filter.periodo });
  if (filter.periodo === "personalizado") {
    if (filter.inicio) params.set("inicio", filter.inicio);
    if (filter.fim) params.set("fim", filter.fim);
  }
  const options = { cache: "no-store" as const, signal };
  const [resumo, trafego, paginas, eventos] = await Promise.all([
    apiFetch<MarketingSummary>(
      `/marketing-metrics/resumo?${params}`,
      options,
      token,
    ),
    apiFetch<MarketingTraffic[]>(
      `/marketing-metrics/trafego?${params}`,
      options,
      token,
    ),
    apiFetch<MarketingPage[]>(
      `/marketing-metrics/paginas?${params}`,
      options,
      token,
    ),
    apiFetch<MarketingEvent[]>(
      `/marketing-metrics/eventos?${params}`,
      options,
      token,
    ),
  ]);
  return { resumo, trafego, paginas, eventos };
}
