import { Api } from '@/utils/Api';
export async function solicitarAnexoRelatoSite(atendimentoId: string, anexoId: string, token: string): Promise<Blob> {
  const { data } = await Api.get<Blob>(`/atendimentos/site/relatos/${atendimentoId}/anexos/${anexoId}`, { responseType: 'blob', headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } });
  return data;
}
export async function enviarAnexo(token: string, caminho: string, arquivo: File, etapa: string, comentario: string) {
  const form = new FormData();
  form.set('arquivo', arquivo);
  form.set('etapa', etapa);
  form.set('comentario', comentario);
  await Api.post(caminho, form, { headers: { Authorization: `Bearer ${token}` } });
}
export async function baixarAnexo(token: string, caminho: string, nome: string) {
  const url = URL.createObjectURL(await obterArquivoAnexo(token, caminho));
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function obterArquivoAnexo(token: string, caminho: string): Promise<Blob> {
  const { data } = await Api.get<Blob>(caminho, { responseType: 'blob', headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } });
  return data;
}
