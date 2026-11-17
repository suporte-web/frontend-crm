import { Api } from '@/utils/Api';
import { validarPerda } from "@/lib/perda-oportunidade";
import type { MotivoPerda } from "@/lib/perda-oportunidade";
export async function consultarMotivosPerda(token: string) {
  const { data } = await Api.get<MotivoPerda[]>("/opportunities/motivos-perda", { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  return data;
}
/** Validação local com o mesmo catálogo usado nos campos e no BI. */
export async function validarDadosPerda(token: string, motivoPerda?: string | null, observacaoPerda?: string | null) {
  const catalogo = await consultarMotivosPerda(token);
  const mensagem = validarPerda(catalogo, motivoPerda || "", observacaoPerda || "");
  if (mensagem)
    throw new Error(mensagem);
}
