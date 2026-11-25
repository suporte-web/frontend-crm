import { Api } from '@/utils/Api';
export type Segmento = { id: string; nome: string; codigo?: string; aliases?: string[] };

export const SegmentosService = {
  listarSegmentos: async (signal?: AbortSignal) => { return (await Api.get<Segmento[]>('/segmentos', { signal })).data; },

  classificarSegmento: async (cnae: string, signal?: AbortSignal) => { return (await Api.get<{ cnae: string; segmento: (Segmento & { prefixo: string }) | null }>('/segmentos/classificar', { params: { cnae }, signal })).data; },
};
