import { apiFetch } from "@/services/api";
import type {
  GoogleAnalyticsProperty,
  MarketingIntegration,
} from "@/types/marketing-integrations";

export function listarIntegracoesMarketing(token?: string | null) {
  return apiFetch<MarketingIntegration[]>(
    "/marketing-integrations",
    { cache: "no-store" },
    token ?? undefined,
  );
}

export function conectarGoogleAnalytics(token: string) {
  return apiFetch<{ url: string }>(
    "/marketing-integrations/google/connect",
    { cache: "no-store" },
    token,
  );
}

export function listarPropriedadesGoogleAnalytics(
  token: string,
  signal?: AbortSignal,
) {
  return apiFetch<{ pending: boolean; properties: GoogleAnalyticsProperty[] }>(
    "/marketing-integrations/google-analytics/properties",
    { cache: "no-store", signal },
    token,
  );
}

export function selecionarPropriedadeGoogleAnalytics(
  token: string,
  propertyId: string,
) {
  return apiFetch<{ message: string }>(
    "/marketing-integrations/google-analytics/select-property",
    { method: "POST", body: JSON.stringify({ propertyId }) },
    token,
  );
}

export function testarGoogleAnalytics(token: string) {
  return apiFetch<{ message: string }>(
    "/marketing-integrations/google-analytics/test",
    { method: "POST" },
    token,
  );
}

export function desconectarGoogleAnalytics(token: string) {
  return apiFetch<{ message: string }>(
    "/marketing-integrations/google-analytics",
    { method: "DELETE" },
    token,
  );
}
