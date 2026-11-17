import { Api } from '@/utils/Api';
import type { BuscarSolicitacaoSiteResponse, ListarSolicitacoesSiteFiltros, ListarSolicitacoesSiteResponse, } from "@/types/solicitacao-site";
export async function listarSolicitacoesSite(filtros: ListarSolicitacoesSiteFiltros = {}): Promise<ListarSolicitacoesSiteResponse> {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([key, value]) => { if (value)
    params.set(key, value); });
  const { data } = await Api.get<ListarSolicitacoesSiteResponse>('/integracoes/site/solicitacoes', { params });
  return data;
}
export async function buscarSolicitacaoSitePorId(id: string): Promise<BuscarSolicitacaoSiteResponse> {
  const { data } = await Api.get<BuscarSolicitacaoSiteResponse>(`/integracoes/site/solicitacoes/${id}`);
  return data;
}
export async function buscarAnexoSolicitacaoSite(solicitacaoId: string, anexoId: string): Promise<Blob> {
  const { data } = await Api.get<Blob>(`/integracoes/site/solicitacoes/${solicitacaoId}/anexos/${anexoId}/download`, { responseType: 'blob' });
  return data;
}
async function acaoCotacaoSite<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
  const { data } = await Api.request<T>({ url: `/integracoes/site/solicitacoes/${path}`, method, data: payload });
  return data;
}
export function listarComerciaisCotacaoSite() { return acaoCotacaoSite<Array<{
  id: string;
  name: string;
}>>('responsaveis-comerciais'); }
export function direcionarCotacaoSite(id: string, responsavelId: string) { return acaoCotacaoSite<BuscarSolicitacaoSiteResponse>(`${id}/direcionar`, 'POST', { responsavelId }); }
export function atualizarCotacaoSite(id: string, payload: import('@/types/solicitacao-site').AtualizarCotacaoSitePayload) { return acaoCotacaoSite<BuscarSolicitacaoSiteResponse>(`${id}/prospect`, 'PATCH', payload); }
export function converterCotacaoSiteCliente(id: string, document: string) { return acaoCotacaoSite<BuscarSolicitacaoSiteResponse>(`${id}/converter-cliente`, 'POST', { document }); }
export function reprovarCotacaoSite(id: string, motivo: string) {
  return acaoCotacaoSite<BuscarSolicitacaoSiteResponse>(`${id}/reprovar`, 'POST', { motivo });
}
