const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://52.193.143.187/api';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        'Erro ao comunicar com a API.',
    );
  }

  return data as T;
}

export { API_BASE_URL };
