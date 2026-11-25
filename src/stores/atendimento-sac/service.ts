import { Api } from "@/utils/Api";
import { AnexosService } from "@/stores/anexos/service";
import type {
  AtendimentoSac,
  PessoaSac,
  AcaoSac,
  MinhaTarefaSac,
} from "@/types/atendimento-sac.types";

async function requisitarSac<T>(
  caminho: string,
  metodo = "GET",
  dados?: unknown,
) {
  const { data } = await Api.request<T>({
    url: `/atendimento-sac${caminho}`,
    method: metodo,
    data: dados,
  });
  return data;
}

export const AtendimentoSacService = {
  enviarAnexoSac: (
    id: string,
    arquivo: File,
    etapa: string,
    comentario: string,
  ) =>
    AnexosService.enviarAnexo("/atendimento-sac/" + id + "/anexos", arquivo, etapa, comentario),

  baixarAnexoSac: (id: string, anexoId: string, nome: string) =>
    AnexosService.baixarAnexo("/atendimento-sac/" + id + "/anexos/" + anexoId, nome),

  listarSac: (filtros: URLSearchParams) =>
    requisitarSac<{
      itens: AtendimentoSac[];
      total: number;
    }>(`?${filtros}`),

  getParticipantesSac: () =>
    requisitarSac<PessoaSac[]>("/participantes"),

  getAtendimentoSac: (id: string) =>
    requisitarSac<AtendimentoSac>(`/${id}`),

  listarMinhasAcoesSac: () =>
    requisitarSac<MinhaTarefaSac[]>("/minhas-acoes"),

  getMinhaAcaoSac: (id: string) =>
    requisitarSac<AcaoSac>(`/minhas-acoes/${id}`),

  executarAcaoSac: (id: string, acao: string, dados?: unknown) =>
    requisitarSac(`/${id}/${acao}`, "POST", dados),

  caminhoAnexosSac: (id: string) => `/atendimento-sac/${id}/anexos`,

  salvarPlanoAcaoSac: (
    id: string,
    dados: unknown,
    concluir: boolean,
    primeiroPlano: boolean,
  ) => {
    return requisitarSac(
      `/${id}/acao${concluir ? "/concluir" : primeiroPlano ? "/iniciar" : ""}`,
      concluir || primeiroPlano ? "POST" : "PUT",
      dados,
    );
  },
};
