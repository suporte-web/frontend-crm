import { Api } from '@/utils/Api';
import { AnexosService } from "@/stores/anexos/service";
import type { EtapaVisita, Visita, ListaVisitas, OpcoesVisitas } from "@/types/visitas";
async function requisitarVisitas<T>(caminho = "", metodo = "GET", dados?: unknown) {
  const { data } = await Api.request<T>({ url: "/visitas" + caminho, method: metodo, data: dados });
  return data;
}

export const VisitasService = {
  enviarAnexoVisita: (id: string, arquivo: File, etapa: EtapaVisita, comentario: string) => AnexosService.enviarAnexo("/visitas/" + id + "/anexos", arquivo, etapa, comentario),

  baixarAnexoVisita: (id: string, anexoId: string, nome: string) => AnexosService.baixarAnexo("/visitas/" + id + "/anexos/" + anexoId, nome),

  listarVisitas: (filtros: URLSearchParams) => requisitarVisitas<ListaVisitas>(`?${filtros}`),

  getOpcoesVisitas: () => requisitarVisitas<OpcoesVisitas>('/opcoes'),

  getVisita: (id: string) => requisitarVisitas<Visita>(`/${id}`),

  criarVisita: (dados: unknown) => requisitarVisitas<Visita>('', 'POST', dados),

  atualizarVisita: (id: string, dados: unknown) => requisitarVisitas<Visita>(`/${id}`, 'PUT', dados),

  executarAcaoVisita: (id: string, acao: string, dados?: unknown) => requisitarVisitas(`/${id}/${acao}`, 'POST', dados),

  caminhoAnexosVisita: (id: string) => `/visitas/${id}/anexos`,
};
