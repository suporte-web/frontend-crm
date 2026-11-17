import { Api } from '@/utils/Api';
export async function consultarRastreamento<T>(payload: unknown): Promise<T> {
  const { data } = await Api.post<T>('/trackings/public-query', payload);
  return data;
}
