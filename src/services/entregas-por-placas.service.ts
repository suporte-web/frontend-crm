import { API_BASE_URL } from "@/services/api";
import type {
  DetalheManifestoSswResponse,
  EntregasPorPlacaResponse,
  ListaManifestosSswResponse,
  MonitoramentoEntregasPorPlacasFilters,
  MonitoramentoEntregasPorPlacasResponse,
} from "@/types/entregas-por-placas";

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || data?.error;

    throw new Error(
      message || `Nao foi possivel consultar a placa. Codigo: ${response.status}`,
    );
  }

  return data as T;
}

export async function getEntregasPorPlaca(placa: string, token: string) {
  const params = new URLSearchParams({ placa });

  const response = await fetch(
    `${API_BASE_URL}/entregas-por-placas?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  return parseResponse<EntregasPorPlacaResponse>(response);
  
}

export async function getMonitoramentoEntregasPorPlacas(
  filters: MonitoramentoEntregasPorPlacasFilters,
  token: string,
)

{
  
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    const text = value?.trim();

    if (text) {
      params.set(key, text);
    }
  });

  

  const queryString = params.toString();
  const response = await fetch(
    `${API_BASE_URL}/entregas-por-placas/monitoramento${
      queryString ? `?${queryString}` : ""
    }`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  

  return parseResponse<MonitoramentoEntregasPorPlacasResponse>(response);

  
}
export async function getManifestosSsw(
  token: string,
  data?: string,
) {
  const params =
    new URLSearchParams();

  if (data) {
    params.set("data", data);
  }

  const query =
    params.toString();

  const url =
    `${API_BASE_URL}/teste-manifesto-ssw${
      query ? `?${query}` : ""
    }`;

  const response = await fetch(
    url,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
        Authorization:
          `Bearer ${token}`,
      },

      cache: "no-store",
    },
  );

  return parseResponse<ListaManifestosSswResponse>(
    response,
  );
}

export async function getManifestoSswPorCodigo(
  manifesto: string,
  token: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/teste-manifesto-ssw/${encodeURIComponent(
      manifesto,
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  return parseResponse<DetalheManifestoSswResponse>(
    response,
  );
}