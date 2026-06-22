import type {
  HelpArticle,
  HelpArticlePayload,
  HelpChatResponse,
} from '@/types/help-center';
import { API_BASE_URL } from '@/services/api';

const API_URL = API_BASE_URL;
const TOKEN_KEY = 'crm_token';

function getAuthHeaders() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Erro ao processar a requisicao.';

    throw new Error(message);
  }

  return data as T;
}

export async function getHelpArticles(): Promise<HelpArticle[]> {
  const response = await fetch(`${API_URL}/help-center/articles`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  return handleResponse<HelpArticle[]>(response);
}

export async function createHelpArticle(
  payload: HelpArticlePayload,
): Promise<HelpArticle> {
  const response = await fetch(`${API_URL}/help-center/articles`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<HelpArticle>(response);
}

export async function updateHelpArticle(
  id: string,
  payload: Partial<HelpArticlePayload>,
): Promise<HelpArticle> {
  const response = await fetch(`${API_URL}/help-center/articles/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<HelpArticle>(response);
}

export async function updateHelpArticleStatus(
  id: string,
  active: boolean,
): Promise<HelpArticle> {
  const response = await fetch(`${API_URL}/help-center/articles/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ active }),
  });

  return handleResponse<HelpArticle>(response);
}

export async function askHelpCenter(message: string): Promise<HelpChatResponse> {
  const response = await fetch(`${API_URL}/help-center/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });

  return handleResponse<HelpChatResponse>(response);
}
