import { Api } from '@/utils/Api';
import type { GoogleAnalyticsProperty, MarketingIntegration, } from "@/types/marketing-integrations";
export async function listarIntegracoesMarketing(token?: string | null) {
  const { data } = await Api.get<MarketingIntegration[]>("/marketing-integrations", { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function conectarGoogleAnalytics(token: string) {
  const { data } = await Api.get<{
    url: string;
  }>("/marketing-integrations/google/connect", { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function listarPropriedadesGoogleAnalytics(token: string, signal?: AbortSignal) {
  const { data } = await Api.get<{
    pending: boolean;
    properties: GoogleAnalyticsProperty[];
  }>("/marketing-integrations/google-analytics/properties", { signal, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function selecionarPropriedadeGoogleAnalytics(token: string, propertyId: string) {
  const { data } = await Api.post<{
    message: string;
  }>("/marketing-integrations/google-analytics/select-property", { propertyId }, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function testarGoogleAnalytics(token: string) {
  const { data } = await Api.post<{
    message: string;
  }>("/marketing-integrations/google-analytics/test", undefined, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export async function desconectarGoogleAnalytics(token: string) {
  const { data } = await Api.delete<{
    message: string;
  }>("/marketing-integrations/google-analytics", { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
