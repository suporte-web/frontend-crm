import { Api } from "@/utils/Api";

export const AnexosService = {
  solicitarAnexoRelatoSite: async (
    atendimentoId: string,
    anexoId: string,
  ): Promise<Blob> => {
    const { data } = await Api.get<Blob>(
      `/atendimentos/site/relatos/${atendimentoId}/anexos/${anexoId}`,
      {
        responseType: "blob",
        headers: {
          "Cache-Control": "no-cache",
        },
      },
    );
    return data;
  },

  enviarAnexo: async (
    caminho: string,
    arquivo: File,
    etapa: string,
    comentario: string,
  ) => {
    const form = new FormData();
    form.set("arquivo", arquivo);
    form.set("etapa", etapa);
    form.set("comentario", comentario);
    await Api.post(caminho, form);
  },

  baixarAnexo: async (caminho: string, nome: string) => {
    const url = URL.createObjectURL(await AnexosService.obterArquivoAnexo(caminho));
    const link = document.createElement("a");
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  obterArquivoAnexo: async (caminho: string): Promise<Blob> => {
    const { data } = await Api.get<Blob>(caminho, {
      responseType: "blob",
      headers: { "Cache-Control": "no-cache" },
    });
    return data;
  },
};
