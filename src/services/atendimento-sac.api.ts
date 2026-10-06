import { API_BASE_URL, apiFetch } from "@/services/api";
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
export async function enviarAnexoSac(
  token: string,
  id: string,
  arquivo: File,
  etapa: string,
  comentario: string,
) {
  const dados = new FormData();
  dados.set("arquivo", arquivo);
  dados.set("etapa", etapa);
  dados.set("comentario", comentario);
  const resposta = await fetch(`${API_BASE_URL}/atendimento-sac/${id}/anexos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: dados,
  });
  const resultado = await resposta.json().catch(() => null);
  if (!resposta.ok)
    throw new Error(resultado?.message || "Não foi possível enviar o anexo.");
}
export async function baixarAnexoSac(
  token: string,
  id: string,
  anexoId: string,
  nome: string,
) {
  const resposta = await fetch(
    `${API_BASE_URL}/atendimento-sac/${id}/anexos/${anexoId}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!resposta.ok) throw new Error("Não foi possível baixar o anexo.");
  const url = URL.createObjectURL(await resposta.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
