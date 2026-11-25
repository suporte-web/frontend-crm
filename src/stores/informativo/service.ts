import { Api } from '@/utils/Api';
import type { ListagemInformativo, StatusInformativo, } from "@/types/informativo";

export const InformativoService = {
  listarAssinantesInformativo: async (filtros: {
    q?: string;
    status?: StatusInformativo;
  } = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (filtros.q?.trim())
      params.set("q", filtros.q.trim());
    if (filtros.status)
      params.set("status", filtros.status);
    const query = params.toString();
    const { data } = await Api.get<ListagemInformativo>(`/informativo${query ? `?${query}` : ""}`, { signal });
    return data;
  },
};
