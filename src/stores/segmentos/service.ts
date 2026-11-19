import { Api } from '@/utils/Api';
export type Segmento = { id: string; nome: string; codigo?: string; aliases?: string[] };
export async function listarSegmentos(signal?: AbortSignal) { return (await Api.get<Segmento[]>('/segmentos', { signal })).data; }
export async function classificarSegmento(cnae: string, signal?: AbortSignal) { return (await Api.get<{ cnae: string; segmento: (Segmento & { prefixo: string }) | null }>('/segmentos/classificar', { params: { cnae }, signal })).data; }
