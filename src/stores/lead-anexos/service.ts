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
export async function listarAnexosLead(token: string, id: string): Promise<LeadAnexo[]> {
  const { data } = await Api.get<LeadAnexo[]>(`/leads/${id}/anexos`, { headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } });
  return data;
}
export async function enviarAnexoLead(token: string, id: string, arquivo: File, comentario: string): Promise<LeadAnexo> {
  const form = new FormData();
  form.append('arquivo', arquivo);
  if (comentario.trim())
    form.append('comentario', comentario.trim());
  const { data } = await Api.post<LeadAnexo>(`/leads/${id}/anexos`, form, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
export async function baixarAnexoLead(token: string, id: string, anexo: LeadAnexo) {
  const url = URL.createObjectURL(await obterArquivoAnexoLead(token, id, anexo));
  const link = document.createElement("a");
  link.href = url;
  link.download = anexo.nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function obterArquivoAnexoLead(token: string, id: string, anexo: LeadAnexo): Promise<Blob> {
  const { data } = await Api.get<Blob>(`/leads/${id}/anexos/${anexo.id}`, { responseType: 'blob', headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } });
  return data;
}
