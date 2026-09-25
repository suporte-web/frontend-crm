import {
  API_BASE_URL,
  apiFetch,
} from '@/services/api';

import type {
  PaginaSite,
  QuemSomosConteudo,
} from '@/types/site-institucional';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

async function getErrorMessage(response: Response) {
  try {
    const data = await response.json();

    if (typeof data?.message === 'string') {
      return data.message;
    }

    if (Array.isArray(data?.message)) {
      return data.message.join(', ');
    }
  } catch {
    // resposta sem JSON
  }

  return `Erro na requisição (${response.status}).`;
}

export async function buscarPaginaSite(
  slug: string,
  token: string,
): Promise<PaginaSite | null> {
  const response = await fetch(
    `${API_URL}/site-institucional/paginas/${slug}`,
    {
      method: 'GET',

      headers: {
        Authorization: `Bearer ${token}`,
      },

      cache: 'no-store',
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}

export async function salvarRascunhoPaginaSite(
  slug: string,
  nome: string,
  conteudo: QuemSomosConteudo,
  token: string,
): Promise<PaginaSite> {
  const response = await fetch(
    `${API_URL}/site-institucional/paginas/${slug}/rascunho`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        nome,
        conteudo,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
}

export async function publicarPaginaSite(
  slug: string,
  token: string,
): Promise<PaginaSite> {
  const response = await fetch(
    `${API_URL}/site-institucional/paginas/${slug}/publicar`,
    {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response),
    );
  }

  return response.json();
  
  
}
export type SiteImageUploadResult = {
  fileName: string;

  path: string;

  mimeType: string;

  size: number;
};

export async function uploadImagemSite(
  slug: string,
  file: File,
  token: string,
): Promise<SiteImageUploadResult> {
  const body = new FormData();

  body.append(
    'file',
    file,
  );

  const response =
    await fetch(
      `${API_BASE_URL}/site-institucional/paginas/${slug}/upload`,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body,
      },
    );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        'Erro ao enviar imagem.',
    );
  }

  return data as SiteImageUploadResult;
}
