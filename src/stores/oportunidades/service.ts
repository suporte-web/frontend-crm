import { Api } from '@/utils/Api';

export const OportunidadesService = {
  listarOportunidades: async <T>(): Promise<T> => {
    return (await Api.get<T>('/opportunities')).data;
  },

  listarCadastrosOportunidade: async <T>(): Promise<T> => {
    return (await Api.get<T>('/opportunities/clients')).data;
  },
};
