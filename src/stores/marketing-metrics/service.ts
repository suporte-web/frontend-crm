import { Api } from '@/utils/Api';
import type { MarketingEvent, MarketingMetrics, MarketingPage, MarketingSummary, MarketingTraffic, MetricsFilter, } from "@/types/marketing-metrics";

export const MarketingMetricsService = {
  carregarMetricasMarketing: async (filter: MetricsFilter, signal?: AbortSignal): Promise<MarketingMetrics> => {
    const params = new URLSearchParams({ periodo: filter.periodo });
    if (filter.periodo === "personalizado") {
      if (filter.inicio)
        params.set("inicio", filter.inicio);
      if (filter.fim)
        params.set("fim", filter.fim);
    }
    const options = { signal };
    const [resumo, trafego, paginas, eventos] = await Promise.all([
      Api.get<MarketingSummary>(`/marketing-metrics/resumo?${params}`, options).then(({ data }) => data),
      Api.get<MarketingTraffic[]>(`/marketing-metrics/trafego?${params}`, options).then(({ data }) => data),
      Api.get<MarketingPage[]>(`/marketing-metrics/paginas?${params}`, options).then(({ data }) => data),
      Api.get<MarketingEvent[]>(`/marketing-metrics/eventos?${params}`, options).then(({ data }) => data),
    ]);
    return { resumo, trafego, paginas, eventos };
  },
};
