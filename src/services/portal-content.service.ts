import type {
  PortalContent,
  PortalContentPayload,
} from '@/types/portal-content';
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
  if (!response.ok) {
    let message = 'Erro ao processar a requisicao';

    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.message)) {
        message = errorData.message.join(', ');
      } else {
        message = errorData.message || message;
      }
    } catch {
      //
    }

    throw new Error(message);
  }

  return response.json();
}

export async function getPortalContents(): Promise<PortalContent[]> {
  const response = await fetch(`${API_URL}/portal-content`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  return handleResponse<PortalContent[]>(response);
}

export async function getPublishedPortalContents(): Promise<PortalContent[]> {
  const response = await fetch(`${API_URL}/portal-content/published`, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  return handleResponse<PortalContent[]>(response);
}

export async function createPortalContent(
  payload: PortalContentPayload,
): Promise<PortalContent> {
  const response = await fetch(`${API_URL}/portal-content`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<PortalContent>(response);
}

export async function uploadPortalContentMedia(file: File): Promise<{
  fileName: string;
  mimeType: string;
  url: string;
}> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch(`${API_URL}/portal-content/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  return handleResponse<{
    fileName: string;
    mimeType: string;
    url: string;
  }>(response);
}

export async function updatePortalContent(
  id: string,
  payload: Partial<PortalContentPayload>,
): Promise<PortalContent> {
  const response = await fetch(`${API_URL}/portal-content/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<PortalContent>(response);
}

export async function deletePortalContent(
  id: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/portal-content/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}
