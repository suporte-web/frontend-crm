import type { CreateQuotePayload, Quote } from '@/types/quotes';

const API_BASE_URL = 'http://localhost:3001/api';

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || 'Erro ao comunicar com a API.',
    );
  }

  return data as T;
}

export async function createQuote(
  payload: CreateQuotePayload,
  token: string,
) {
  const response = await fetch(`${API_BASE_URL}/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<Quote>(response);
}

export async function getMyQuotes(token: string) {
  const response = await fetch(`${API_BASE_URL}/quotes/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<Quote[]>(response);
}

export async function getAllQuotes(token: string) {
  const response = await fetch(`${API_BASE_URL}/quotes`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<Quote[]>(response);
}