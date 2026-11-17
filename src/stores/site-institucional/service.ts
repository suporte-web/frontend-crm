import { Api, ApiError } from '@/utils/Api';
import type { PaginaSite, QuemSomosConteudo, } from '@/types/site-institucional';
export async function buscarPaginaSite(slug: string, token: string): Promise<PaginaSite | null> {
  try {
    const { data } = await Api.get<PaginaSite>(`/site-institucional/paginas/${slug}`, { headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } });
    return data;
  }
  catch (error) {
    if (error instanceof ApiError && error.status === 404)
      return null;
    throw error;
  }
}
export async function salvarRascunhoPaginaSite(slug: string, nome: string, conteudo: QuemSomosConteudo, token: string): Promise<PaginaSite> {
  const { data } = await Api.patch<PaginaSite>(`/site-institucional/paginas/${slug}/rascunho`, { nome, conteudo }, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function publicarPaginaSite(slug: string, token: string): Promise<PaginaSite> {
  const { data } = await Api.post<PaginaSite>(`/site-institucional/paginas/${slug}/publicar`, undefined, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export type SiteImageUploadResult = {
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
};
export async function uploadImagemSite(slug: string, file: File, token: string): Promise<SiteImageUploadResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await Api.post<SiteImageUploadResult>(`/site-institucional/paginas/${slug}/upload`, form, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
