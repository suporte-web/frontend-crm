import { Api } from '@/utils/Api';
import { enviarAnexo, baixarAnexo } from "@/stores/anexos/service";
import type { EtapaVisita, Visita, ListaVisitas, OpcoesVisitas } from "@/types/visitas";
async function requisitarVisitas<T>(token: string, caminho = "", metodo = "GET", dados?: unknown) {
  const { data } = await Api.request<T>({ url: "/visitas" + caminho, method: metodo, data: dados, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export const enviarAnexoVisita = (token: string, id: string, arquivo: File, etapa: EtapaVisita, comentario: string) => enviarAnexo(token, "/visitas/" + id + "/anexos", arquivo, etapa, comentario);
export const baixarAnexoVisita = (token: string, id: string, anexoId: string, nome: string) => baixarAnexo(token, "/visitas/" + id + "/anexos/" + anexoId, nome);
export const listarVisitas = (token: string, filtros: URLSearchParams) => requisitarVisitas<ListaVisitas>(token, `?${filtros}`);
export const getOpcoesVisitas = (token: string) => requisitarVisitas<OpcoesVisitas>(token, '/opcoes');
export const getVisita = (token: string, id: string) => requisitarVisitas<Visita>(token, `/${id}`);
export const criarVisita = (token: string, dados: unknown) => requisitarVisitas<Visita>(token, '', 'POST', dados);
export const atualizarVisita = (token: string, id: string, dados: unknown) => requisitarVisitas<Visita>(token, `/${id}`, 'PUT', dados);
export const executarAcaoVisita = (token: string, id: string, acao: string, dados?: unknown) => requisitarVisitas(token, `/${id}/${acao}`, 'POST', dados);
export const caminhoAnexosVisita = (id: string) => `/visitas/${id}/anexos`;
