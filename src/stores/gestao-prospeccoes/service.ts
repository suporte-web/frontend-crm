import { Api } from '@/utils/Api';
export async function getOpcoesProspeccoes<T>(token: string): Promise<T> {
  return (await Api.get<T>('/gestao-prospeccoes/opcoes', { headers: { Authorization: `Bearer ${token}` } })).data;
}
export async function getProspeccoes<T>(params: URLSearchParams, token: string): Promise<T> {
  return (await Api.get<T>('/gestao-prospeccoes', { params, headers: { Authorization: `Bearer ${token}` } })).data;
}
export async function getHistoricoProspeccao<T>(tipo: string, id: string, token: string): Promise<T> {
  return (await Api.get<T>(`/gestao-prospeccoes/${tipo}/${id}/historico`, { headers: { Authorization: `Bearer ${token}` } })).data;
}
