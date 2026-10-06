import { API_BASE_URL } from "./api";
export type LeadAnexo = {
  id: string;
  leadId: string;
  nome: string;
  tipo: string;
  tamanho: number;
  comentario: string | null;
  criadoEm: string;
  usuario: { id: string; name: string } | null;
};
async function resposta(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message || "Erro ao acessar anexos.",
    );
  return data;
}
export async function listarAnexosLead(
  token: string,
  id: string,
): Promise<LeadAnexo[]> {
  return resposta(
    await fetch(`${API_BASE_URL}/leads/${id}/anexos`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  );
}
export async function enviarAnexoLead(
  token: string,
  id: string,
  arquivo: File,
  comentario: string,
) {
  const body = new FormData();
  body.append("arquivo", arquivo);
  if (comentario.trim()) body.append("comentario", comentario.trim());
  return resposta(
    await fetch(`${API_BASE_URL}/leads/${id}/anexos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    }),
  );
}
export async function baixarAnexoLead(
  token: string,
  id: string,
  anexo: LeadAnexo,
) {
  const response = await fetch(
    `${API_BASE_URL}/leads/${id}/anexos/${anexo.id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    await resposta(response);
    return;
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = anexo.nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
