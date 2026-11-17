import { Api } from '@/utils/Api';
import { enviarAnexo, baixarAnexo } from '@/stores/anexos/service';
import type { AtendimentoSac, PessoaSac, AcaoSac, MinhaTarefaSac } from '@/types/atendimento-sac.types';
async function requisitarSac<T>(token: string, caminho: string, metodo = "GET", dados?: unknown) {
  const { data } = await Api.request<T>({ url: `/atendimento-sac${caminho}`, method: metodo, data: dados, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
export const enviarAnexoSac = (token: string, id: string, arquivo: File, etapa: string, comentario: string) => enviarAnexo(token, '/atendimento-sac/' + id + '/anexos', arquivo, etapa, comentario);
export const baixarAnexoSac = (token: string, id: string, anexoId: string, nome: string) => baixarAnexo(token, '/atendimento-sac/' + id + '/anexos/' + anexoId, nome);
export const listarSac = (token: string, filtros: URLSearchParams) => requisitarSac<{
  itens: AtendimentoSac[];
  total: number;
}>(token, `?${filtros}`);
export const getParticipantesSac = (token: string) => requisitarSac<PessoaSac[]>(token, '/participantes');
export const getAtendimentoSac = (token: string, id: string) => requisitarSac<AtendimentoSac>(token, `/${id}`);
export const listarMinhasAcoesSac = (token: string) => requisitarSac<MinhaTarefaSac[]>(token, '/minhas-acoes');
export const getMinhaAcaoSac = (token: string, id: string) => requisitarSac<AcaoSac>(token, `/minhas-acoes/${id}`);
export const executarAcaoSac = (token: string, id: string, acao: string, dados?: unknown) => requisitarSac(token, `/${id}/${acao}`, 'POST', dados);
export const caminhoAnexosSac = (id: string) => `/atendimento-sac/${id}/anexos`;
export function salvarPlanoAcaoSac(token: string, id: string, dados: unknown, concluir: boolean, primeiroPlano: boolean) {
  return requisitarSac(token, `/${id}/acao${concluir ? '/concluir' : primeiroPlano ? '/iniciar' : ''}`, concluir || primeiroPlano ? 'POST' : 'PUT', dados);
}
