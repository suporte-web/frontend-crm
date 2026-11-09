import { validarPerda } from "@/lib/perda-oportunidade";
import { apiFetch } from "@/services/api";
import type { MotivoPerda } from "@/lib/perda-oportunidade";

export function consultarMotivosPerda(token: string) {
  return apiFetch<MotivoPerda[]>("/opportunities/motivos-perda", {}, token);
}

/** Validação local com o mesmo catálogo usado nos campos e no BI. */
export async function validarDadosPerda(
  token: string,
  motivoPerda?: string | null,
  observacaoPerda?: string | null,
) {
  const catalogo = await consultarMotivosPerda(token);
  const mensagem = validarPerda(
    catalogo,
    motivoPerda || "",
    observacaoPerda || "",
  );
  if (mensagem) throw new Error(mensagem);
}
