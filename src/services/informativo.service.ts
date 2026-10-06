import { apiFetch } from "@/services/api";
import type {
  ListagemInformativo,
  StatusInformativo,
} from "@/types/informativo";

export function listarAssinantesInformativo(
  token: string,
  filtros: { q?: string; status?: StatusInformativo } = {},
  signal?: AbortSignal,
) {
  const params = new URLSearchParams();
  if (filtros.q?.trim()) params.set("q", filtros.q.trim());
  if (filtros.status) params.set("status", filtros.status);
  const query = params.toString();
  return apiFetch<ListagemInformativo>(
    `/informativo${query ? `?${query}` : ""}`,
    { signal, cache: "no-store" },
    token,
  );
}
