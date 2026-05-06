"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCcw, Search, UserCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import { assumirEntrada, getEntradas } from "@/services/entradas.service";
import type {
  EntradaFilters,
  EntradaStatus,
  EntradaTicket,
  EntradaTipo,
} from "@/types/entradas";

const statusOptions: Array<{ value: EntradaStatus | "TODOS"; label: string }> = [
  { value: "TODOS", label: "Todos" },
  { value: "NOVO", label: "Novo" },
  { value: "EM_ANDAMENTO", label: "Em atendimento" },
  { value: "CONVERTIDO_EM_PROSPECT", label: "Convertido em prospect" },
  { value: "COTACAO_CRIADA", label: "Cotacao criada" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "PERDIDO", label: "Perdido" },
  { value: "TRANSFERIDO", label: "Transferido" },
];

const tipoOptions: Array<{ value: EntradaTipo | "TODOS"; label: string }> = [
  { value: "TODOS", label: "Todos" },
  { value: "COTACAO", label: "Cotacao" },
  { value: "FORNECEDOR", label: "Fornecedor" },
  { value: "AGREGADO", label: "Agregado" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "FISCAL", label: "Fiscal" },
  { value: "JURIDICO", label: "Juridico" },
  { value: "MARKETING", label: "Marketing" },
  { value: "FROTA", label: "Frota" },
];

const statusLabels: Record<string, string> = Object.fromEntries(
  statusOptions.map((item) => [item.value, item.label]),
);

const tipoLabels: Record<string, string> = Object.fromEntries(
  tipoOptions.map((item) => [item.value, item.label]),
);

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function EntradasPage() {
  const { token, user } = useAuth();
  const [entradas, setEntradas] = useState<EntradaTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [filters, setFilters] = useState<EntradaFilters>({
    status: "TODOS",
    tipo: "COTACAO",
    origem: "SITE",
    q: "",
  });
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const canUsePage = useMemo(
    () => Boolean(user?.role && ["ADMIN", "GESTAO", "COMERCIAL"].includes(user.role)),
    [user?.role],
  );

  async function loadEntradas() {
    if (!token || !canUsePage) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError("");
      const data = await getEntradas(token, filters);
      setEntradas(data);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Erro ao carregar entradas.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntradas();
  }, [token, canUsePage]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadEntradas();
  }

  async function handleAssumir(id: string) {
    if (!token) {
      return;
    }

    try {
      const updated = await assumirEntrada(id, token);
      setEntradas((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setToast({
        title: "Entrada assumida",
        message: "O ticket foi atribuido ao seu usuario.",
        variant: "success",
      });
    } catch (error) {
      setToast({
        title: "Falha ao assumir",
        message:
          error instanceof Error ? error.message : "Erro ao assumir entrada.",
        variant: "error",
      });
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Comercial
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Central de Entradas
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Tickets criados pelo formulario publico antes de virarem prospect
              e cotacao.
            </p>
          </div>

          <button
            type="button"
            onClick={loadEntradas}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
        </div>

        <form
          onSubmit={handleSearch}
          className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]"
        >
          <input
            value={filters.q ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, q: event.target.value }))
            }
            placeholder="Buscar por protocolo, nome, email ou telefone"
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
          />

          <select
            value={filters.status ?? "TODOS"}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value as EntradaStatus | "TODOS",
              }))
            }
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.tipo ?? "TODOS"}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                tipo: event.target.value as EntradaTipo | "TODOS",
              }))
            }
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
          >
            {tipoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, dateFrom: event.target.value }))
            }
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
          />

          <input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, dateTo: event.target.value }))
            }
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
          />

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Search className="h-4 w-4" />
            Filtrar
          </button>
        </form>

        {pageError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Protocolo</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Responsavel</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      Carregando entradas...
                    </td>
                  </tr>
                ) : entradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      Nenhuma entrada encontrada.
                    </td>
                  </tr>
                ) : (
                  entradas.map((entrada) => (
                    <tr key={entrada.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {entrada.protocolo ?? entrada.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(entrada.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        {entrada.nomeSolicitante ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{entrada.emailSolicitante ?? "-"}</div>
                        <div className="text-xs text-slate-500">
                          {entrada.telefoneSolicitante ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {tipoLabels[entrada.type] ?? entrada.type}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {statusLabels[entrada.status] ?? entrada.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {entrada.assignedTo?.name ?? "Sem responsavel"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {!entrada.assignedToId ? (
                            <button
                              type="button"
                              onClick={() => handleAssumir(entrada.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                              title="Assumir entrada"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          ) : null}

                          <Link
                            href={`/entradas/${entrada.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white hover:bg-slate-800"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast ? (
        <FeedbackToast
          open={Boolean(toast)}
          title={toast.title}
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      ) : null}
    </AppLayout>
  );
}
