import type {
  BuscarSolicitacaoSiteResponse,
  ListarSolicitacoesSiteFiltros,
  ListarSolicitacoesSiteResponse,
} from "@/types/solicitacao-site";

export async function listarSolicitacoesSite(
  filtros: ListarSolicitacoesSiteFiltros = {},
) {
  const token = localStorage.getItem("crm_token");
  const params = new URLSearchParams();

  Object.entries(filtros).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  const response = await fetch(
    `/api/integracoes/site/solicitacoes${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar as solicitações do site.");
  }

  return response.json() as Promise<ListarSolicitacoesSiteResponse>;
}

export async function buscarSolicitacaoSitePorId(id: string) {
  const token = localStorage.getItem("crm_token");

  const response = await fetch(`/api/integracoes/site/solicitacoes/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar a solicitação do site.");
  }

  return response.json() as Promise<BuscarSolicitacaoSiteResponse>;
}
export async function buscarAnexoSolicitacaoSite(
  solicitacaoId: string,
  anexoId: string,
) {
  const token = localStorage.getItem("crm_token");

  const response = await fetch(
    `/api/integracoes/site/solicitacoes/${solicitacaoId}/anexos/${anexoId}/download`,
    {
      method: "GET",

      headers: {
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível abrir o anexo.");
  }

  return response.blob();
}
