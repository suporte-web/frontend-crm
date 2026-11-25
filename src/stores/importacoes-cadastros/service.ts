import { Api } from '@/utils/Api';
export type ResponsavelImportacao = { id: string; name: string; empresaConsultoraId: string | null; empresaConsultora: { id: string; nome: string } | null };
export type LinhaImportacao = {
  numero: number; nome: string; contato: string; emailOriginal?: string; emails: string[]; telefone: string;
  funilOriginal: string; segmentoOriginal: string; etapaSugerida: string | null;
  segmentoId: string | null; segmentoNome: string | null; cnae: string;
  segmentoPorCnae?: boolean;
  erros: string[]; avisos: string[]; duplicidades: Array<{ id?: string; nome: string; motivo: string }>;
  selecionavel: boolean; prioridade: string; proximaAcao: string;
};
export type ResultadoImportacao = { criados: Array<{ numero: number; id: string; nome: string }>; ignorados: Array<{ numero: number; nome: string; motivo: string }> };
export type ImportacaoCadastro = {
  id: string; arquivo: string; aba: string; status: string; createdAt: string; expiresAt: string;
  responsavelId: string; empresaConsultoraId: string | null;
  linhas: { linhas: LinhaImportacao[]; prioridadesNaoAssociadas: Array<Record<string, string>> };
  resultado: ResultadoImportacao | null;
};
const rota = '/importacoes-cadastros';

export const ImportacoesCadastrosService = {
  listarOpcoesImportacao: async (signal?: AbortSignal) => { return (await Api.get<ResponsavelImportacao[]>(`${rota}/opcoes`, { signal })).data; },

  listarImportacoesCadastros: async () => { return (await Api.get<Array<Pick<ImportacaoCadastro, 'id' | 'arquivo' | 'status' | 'createdAt' | 'resultado'>>>(rota)).data; },

  obterImportacaoCadastro: async (id: string) => { return (await Api.get<ImportacaoCadastro>(`${rota}/${id}`)).data; },

  prepararImportacaoCadastro: async (arquivo: File, responsavelId: string, empresaConsultoraId: string | null) => {
    const form = new FormData(); form.append('arquivo', arquivo); form.append('responsavelId', responsavelId);
    if (empresaConsultoraId) form.append('empresaConsultoraId', empresaConsultoraId);
    return (await Api.post<ImportacaoCadastro>(`${rota}/previa`, form, { timeout: 60000 })).data;
  },

  confirmarImportacaoCadastro: async (id: string, linhas: Array<{ numero: number; etapa: string; segmentoId: string | null; segmentoAutomatico: boolean }>) => {
    return (await Api.post<ImportacaoCadastro>(`${rota}/${id}/confirmar`, { linhas }, { timeout: 70000 })).data;
  },
};
