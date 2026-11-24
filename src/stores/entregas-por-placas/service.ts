import { Api } from "@/utils/Api";
import type {
  DetalheManifestoSswResponse,
  EntregasPorPlacaResponse,
  ListaManifestosSswResponse,
  MonitoramentoEntregasPorPlacasFilters,
  MonitoramentoEntregasPorPlacasResponse,
} from "@/types/entregas-por-placas";
export async function getEntregasPorPlaca(placa: string, token: string) {
  const params = new URLSearchParams({ placa });
  const { data } = await Api.get<EntregasPorPlacaResponse>(
    `/entregas-por-placas?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    },
  );
  return data;
}
export async function getMonitoramentoEntregasPorPlacas(
  filters: MonitoramentoEntregasPorPlacasFilters,
  token: string,
) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    const text = value?.trim();
    if (text) {
      params.set(key, text);
    }
  });
  const queryString = params.toString();
  const { data } = await Api.get<MonitoramentoEntregasPorPlacasResponse>(
    `/entregas-por-placas/monitoramento${queryString ? `?${queryString}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    },
  );
  return data;
}
export async function getManifestosSsw(token: string, data?: string) {
  const params = new URLSearchParams();
  if (data) {
    params.set("data", data);
  }
  const query = params.toString();
  const url = `/teste-manifesto-ssw${query ? `?${query}` : ""}`;
  const { data: manifestos } = await Api.get<ListaManifestosSswResponse>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    },
  });
  return manifestos;
}
export async function getManifestoSswPorCodigo(
  manifesto: string,
  token: string,
) {
  const { data } = await Api.get<DetalheManifestoSswResponse>(
    `/teste-manifesto-ssw/${encodeURIComponent(manifesto)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    },
  );
  return data;
}
