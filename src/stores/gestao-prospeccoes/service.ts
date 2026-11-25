import { Api } from '@/utils/Api';

export const GestaoProspeccoesService = {
  getOpcoesProspeccoes: async <T>(): Promise<T> => {
    return (await Api.get<T>('/gestao-prospeccoes/opcoes')).data;
  },

  getProspeccoes: async <T>(params: URLSearchParams): Promise<T> => {
    return (await Api.get<T>('/gestao-prospeccoes', { params })).data;
  },

  getHistoricoProspeccao: async <T>(tipo: string, id: string): Promise<T> => {
    return (await Api.get<T>(`/gestao-prospeccoes/${tipo}/${id}/historico`)).data;
  },
};
