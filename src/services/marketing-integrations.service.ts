import { apiFetch } from '@/services/api';
import type { MarketingIntegration } from '@/types/marketing-integrations';

export function listarIntegracoesMarketing(token?: string | null) {
  return apiFetch<MarketingIntegration[]>(
    '/marketing-integrations',
    {},
    token ?? undefined,
  );
}
