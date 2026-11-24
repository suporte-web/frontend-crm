export type AppVersion = { version: string; buildDate: string; commit: string | null };
export const currentVersion = __APP_VERSION__.version;

export function isAppVersion(value: unknown): value is AppVersion {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.version === 'string' && /^[\w.-]{1,128}$/.test(item.version)
    && typeof item.buildDate === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(item.buildDate) && Number.isFinite(Date.parse(item.buildDate))
    && (item.commit === null || (typeof item.commit === 'string' && /^[a-f\d]{7,64}$/i.test(item.commit)));
}

// Arquivo estático do frontend: não utiliza /api nem envia o token do CRM.
export async function getAvailableVersion(signal: AbortSignal): Promise<AppVersion> {
  const timeout = new AbortController();
  const abort = () => timeout.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timer = setTimeout(abort, 8000);
  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store', signal: timeout.signal });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Versão indisponível.');
    const value: unknown = await response.json();
    if (!isAppVersion(value)) throw new Error('Versão inválida.');
    return value;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
