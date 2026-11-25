import { Api } from '@/utils/Api';

export const RastreamentosService = {
  consultarRastreamento: async <T>(payload: unknown): Promise<T> => {
    const { data } = await Api.post<T>('/trackings/public-query', payload);
    return data;
  },
};
