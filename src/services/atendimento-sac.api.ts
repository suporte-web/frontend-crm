import { enviarAnexo, baixarAnexo } from './anexos.api';
import { apiFetch } from "@/services/api";
export function requisitarSac<T>(
  token: string,
  caminho: string,
  metodo = "GET",
  dados?: unknown,
) {
  return apiFetch<T>(
    `/atendimento-sac${caminho}`,
    {
      method: metodo,
      cache: "no-store",
      ...(dados === undefined ? {} : { body: JSON.stringify(dados) }),
    },
    token,
  );
}
export const enviarAnexoSac = (token: string, id: string, arquivo: File, etapa: string, comentario: string) =>
  enviarAnexo(token, '/atendimento-sac/' + id + '/anexos', arquivo, etapa, comentario);
export const baixarAnexoSac = (token: string, id: string, anexoId: string, nome: string) =>
  baixarAnexo(token, '/atendimento-sac/' + id + '/anexos/' + anexoId, nome);
