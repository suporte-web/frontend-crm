import { apiFetch } from "./api";
import { enviarAnexo, baixarAnexo } from "./anexos.api";
import type { EtapaVisita } from "@/types/visitas";
export function requisitarVisitas<T>(
  token: string,
  caminho = "",
  metodo = "GET",
  dados?: unknown,
) {
  return apiFetch<T>(
    "/visitas" + caminho,
    {
      method: metodo,
      cache: "no-store",
      ...(dados === undefined ? {} : { body: JSON.stringify(dados) }),
    },
    token,
  );
}
export const enviarAnexoVisita = (
  token: string,
  id: string,
  arquivo: File,
  etapa: EtapaVisita,
  comentario: string,
) =>
  enviarAnexo(token, "/visitas/" + id + "/anexos", arquivo, etapa, comentario);
export const baixarAnexoVisita = (
  token: string,
  id: string,
  anexoId: string,
  nome: string,
) => baixarAnexo(token, "/visitas/" + id + "/anexos/" + anexoId, nome);
