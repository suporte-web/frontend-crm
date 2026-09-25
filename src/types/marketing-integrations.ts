export type MarketingProvider =
  | 'GOOGLE_ANALYTICS'
  | 'GOOGLE_ADS'
  | 'META'
  | 'LINKEDIN';

export type MarketingIntegrationStatus =
  | 'NAO_CONFIGURADO'
  | 'CONECTANDO'
  | 'CONECTADO'
  | 'ERRO'
  | 'EXPIRADO';

export type MarketingIntegration = {
  id: string | null;
  provider: MarketingProvider;
  status: MarketingIntegrationStatus;
  accountId: string | null;
  accountName: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  lastSyncAt: string | null;
  lastError: string | null;
  ativo: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};
