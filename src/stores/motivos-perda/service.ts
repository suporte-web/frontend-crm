import { Api } from '@/utils/Api';
import { validarPerda } from "@/lib/perda-oportunidade";
import type { MotivoPerda } from "@/lib/perda-oportunidade";

export const MotivosPerdaService = {
  consultarMotivosPerda: async () => {
    const { data } = await Api.get<MotivoPerda[]>("/opportunities/motivos-perda");
    return data;
  },

  /** Validação local com o mesmo catálogo usado nos campos e no BI. */
  validarDadosPerda: async (motivoPerda?: string | null, observacaoPerda?: string | null) => {
    const catalogo = await MotivosPerdaService.consultarMotivosPerda();
    const mensagem = validarPerda(catalogo, motivoPerda || "", observacaoPerda || "");
    if (mensagem)
      throw new Error(mensagem);
  },
};
