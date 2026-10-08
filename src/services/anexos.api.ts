import { API_BASE_URL } from "./api";
async function respostaAnexo(resposta: Response) {
  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => null);
    throw new Error(
      Array.isArray(dados?.message)
        ? dados.message.join(", ")
        : dados?.message || "Não foi possível acessar o anexo.",
    );
  }
}
export async function enviarAnexo(
  token: string,
  caminho: string,
  arquivo: File,
  etapa: string,
  comentario: string,
) {
  const dados = new FormData();
  dados.set("arquivo", arquivo);
  dados.set("etapa", etapa);
  dados.set("comentario", comentario);
  await respostaAnexo(
    await fetch(API_BASE_URL + caminho, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: dados,
    }),
  );
}
export async function baixarAnexo(
  token: string,
  caminho: string,
  nome: string,
) {
  const resposta = await fetch(API_BASE_URL + caminho, {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store",
  });
  await respostaAnexo(resposta);
  const url = URL.createObjectURL(await resposta.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
