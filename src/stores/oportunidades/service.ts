import { Api } from '@/utils/Api';
export async function listarOportunidades<T>(token: string): Promise<T> {
  return (await Api.get<T>('/opportunities', { headers: { Authorization: `Bearer ${token}` } })).data;
}
export async function listarCadastrosOportunidade<T>(token: string): Promise<T> {
  return (await Api.get<T>('/opportunities/clients', { headers: { Authorization: `Bearer ${token}` } })).data;
}
