import { Api } from '@/utils/Api';
import type { GoogleAnalyticsProperty, MarketingIntegration, } from "@/types/marketing-integrations";

export const MarketingIntegrationsService = {
  listarIntegracoesMarketing: async () => {
    const { data } = await Api.get<MarketingIntegration[]>("/marketing-integrations");
    return data;
  },

  conectarGoogleAnalytics: async () => {
    const { data } = await Api.get<{
      url: string;
    }>("/marketing-integrations/google/connect");
    return data;
  },

  listarPropriedadesGoogleAnalytics: async (signal?: AbortSignal) => {
    const { data } = await Api.get<{
      pending: boolean;
      properties: GoogleAnalyticsProperty[];
    }>("/marketing-integrations/google-analytics/properties", { signal });
    return data;
  },

  selecionarPropriedadeGoogleAnalytics: async (propertyId: string) => {
    const { data } = await Api.post<{
      message: string;
    }>("/marketing-integrations/google-analytics/select-property", { propertyId });
    return data;
  },

  testarGoogleAnalytics: async () => {
    const { data } = await Api.post<{
      message: string;
    }>("/marketing-integrations/google-analytics/test", undefined);
    return data;
  },

  desconectarGoogleAnalytics: async () => {
    const { data } = await Api.delete<{
      message: string;
    }>("/marketing-integrations/google-analytics");
    return data;
  },
};
