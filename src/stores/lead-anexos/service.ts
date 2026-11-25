import { Api } from '@/utils/Api';
export type LeadAnexo = {
  id: string;
  leadId: string;
  nome: string;
  tipo: string;
  tamanho: number;
  comentario: string | null;
  criadoEm: string;
  usuario: {
    id: string;
    name: string;
  } | null;
};

export const LeadAnexosService = {
  listarAnexosLead: async (id: string): Promise<LeadAnexo[]> => {
    const { data } = await Api.get<LeadAnexo[]>(`/leads/${id}/anexos`, { headers: { 'Cache-Control': 'no-cache' } });
    return data;
  },

  enviarAnexoLead: async (id: string, arquivo: File, comentario: string): Promise<LeadAnexo> => {
    const form = new FormData();
    form.append('arquivo', arquivo);
    if (comentario.trim())
      form.append('comentario', comentario.trim());
    const { data } = await Api.post<LeadAnexo>(`/leads/${id}/anexos`, form);
    return data;
  },

  baixarAnexoLead: async (id: string, anexo: LeadAnexo) => {
    const url = URL.createObjectURL(await LeadAnexosService.obterArquivoAnexoLead(id, anexo));
    const link = document.createElement("a");
    link.href = url;
    link.download = anexo.nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  obterArquivoAnexoLead: async (id: string, anexo: LeadAnexo): Promise<Blob> => {
    const { data } = await Api.get<Blob>(`/leads/${id}/anexos/${anexo.id}`, { responseType: 'blob', headers: { 'Cache-Control': 'no-cache' } });
    return data;
  },
};
