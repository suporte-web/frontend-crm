import { Api, ApiError } from '@/utils/Api';
import type { PaginaSite, QuemSomosConteudo, } from '@/types/site-institucional';
export type SiteImageUploadResult = {
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
};

export const SiteInstitucionalService = {
  buscarPaginaSite: async (slug: string): Promise<PaginaSite | null> => {
    try {
      const { data } = await Api.get<PaginaSite>(`/site-institucional/paginas/${slug}`, { headers: { 'Cache-Control': 'no-cache' } });
      return data;
    }
    catch (error) {
      if (error instanceof ApiError && error.status === 404)
        return null;
      throw error;
    }
  },

  salvarRascunhoPaginaSite: async (slug: string, nome: string, conteudo: QuemSomosConteudo): Promise<PaginaSite> => {
    const { data } = await Api.patch<PaginaSite>(`/site-institucional/paginas/${slug}/rascunho`, { nome, conteudo });
    return data;
  },

  publicarPaginaSite: async (slug: string): Promise<PaginaSite> => {
    const { data } = await Api.post<PaginaSite>(`/site-institucional/paginas/${slug}/publicar`, undefined);
    return data;
  },

  uploadImagemSite: async (slug: string, file: File): Promise<SiteImageUploadResult> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await Api.post<SiteImageUploadResult>(`/site-institucional/paginas/${slug}/upload`, form);
    return data;
  },
};
