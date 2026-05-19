"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Search,
  UserCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import {
  assumirEntrada,
  createEntradaQuote,
  finalizarEntrada,
  getEntrada,
  getProspectSuggestions,
  linkOrCreateProspect,
  marcarEntradaPerdida,
} from "@/services/entradas.service";
import type {
  CreateEntradaQuotePayload,
  EntradaTicket,
  LinkProspectPayload,
  ProspectSuggestions,
} from "@/types/entradas";

const statusLabels: Record<string, string> = {
  NOVO: "Novo",
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em atendimento",
  CONVERTIDO_EM_PROSPECT: "Convertido",
  COTACAO_CRIADA: "Cotação criada",
  FINALIZADO: "Finalizado",
  PERDIDO: "Perdido",
  TRANSFERIDO: "Transferido",
};

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

const emptyProspectForm: LinkProspectPayload = {
  nomeRazaoSocial: "",
  nomeContato: "",
  email: "",
  telefone: "",
  document: "",
  cidade: "",
  estado: "",
};

const emptyQuoteForm: CreateEntradaQuotePayload = {
  origin: "",
  destination: "",
  serviceType: "",
  requestType: "",
  pickupAddress: "",
  deliveryAddress: "",
  cargoDescription: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  desiredDeadline: "",
  notes: "",
};

export default function EntradaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token, user } = useAuth();
  const [entradaId, setEntradaId] = useState("");
  const [entrada, setEntrada] = useState<EntradaTicket | null>(null);
  const [suggestions, setSuggestions] = useState<ProspectSuggestions | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [prospectForm, setProspectForm] =
    useState<LinkProspectPayload>(emptyProspectForm);
  const [quoteForm, setQuoteForm] =
    useState<CreateEntradaQuotePayload>(emptyQuoteForm);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const canManage = useMemo(
    () => Boolean(user?.role && ["ADMIN", "GESTAO", "COMERCIAL"].includes(user.role)),
    [user?.role],
  );
  const hasAccountLink = Boolean(entrada?.prospectId || entrada?.clientId);
  const canCreateQuote = hasAccountLink && !entrada?.quoteId;

  async function loadEntrada(idOverride?: string) {
    if (!token || !canManage) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError("");
      const id = idOverride || entradaId || (await params).id;
      setEntradaId(id);
      const data = await getEntrada(id, token);
      setEntrada(data);
      setProspectForm({
        nomeRazaoSocial:
          data.prospect?.nomeRazaoSocial ?? data.nomeSolicitante ?? "",
        nomeContato: data.prospect?.nomeContato ?? data.nomeSolicitante ?? "",
        email: data.prospect?.email ?? data.emailSolicitante ?? "",
        telefone: data.prospect?.telefone ?? data.telefoneSolicitante ?? "",
        document: data.prospect?.document ?? "",
        cidade: data.prospect?.cidade ?? "",
        estado: data.prospect?.estado ?? "",
      });
      setQuoteForm((prev) => ({
        ...prev,
        contactName: prev.contactName || data.nomeSolicitante || "",
        contactEmail: prev.contactEmail || data.emailSolicitante || "",
        contactPhone: prev.contactPhone || data.telefoneSolicitante || "",
        notes: prev.notes || data.mensagem || "",
      }));

      if (!data.prospectId && !data.clientId) {
        const suggestionData = await getProspectSuggestions(id, token);
        setSuggestions(suggestionData);
      }
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Erro ao carregar entrada.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntrada();
  }, [token, canManage]);

  async function runAction(
    action: () => Promise<EntradaTicket | unknown>,
    successTitle: string,
    successMessage: string,
  ) {
    try {
      setActionLoading(true);
      await action();
      await loadEntrada();
      setToast({
        title: successTitle,
        message: successMessage,
        variant: "success",
      });
    } catch (error) {
      setToast({
        title: "Ação não concluída",
        message: error instanceof Error ? error.message : "Erro na operação.",
        variant: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function cleanProspectPayload(payload: LinkProspectPayload) {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value && String(value).trim()),
    ) as LinkProspectPayload;
  }

  function cleanQuotePayload(payload: CreateEntradaQuotePayload) {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined),
    ) as CreateEntradaQuotePayload;
  }

  async function handleCreateProspect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !entrada) {
      return;
    }

    await runAction(
      () =>
        linkOrCreateProspect(
          entrada.id,
          cleanProspectPayload(prospectForm),
          token,
        ),
      "Cadastro vinculado",
      "A entrada já pode seguir para criação de cotação.",
    );
  }

  async function handleCreateQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !entrada) {
      return;
    }

    await runAction(
      () => createEntradaQuote(entrada.id, cleanQuotePayload(quoteForm), token),
      "Cotação criada",
      "A cotação foi vinculada ao ticket de entrada.",
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/entradas"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Central de Entradas
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              {entrada?.protocolo ?? "Entrada"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Origem site, tratamento comercial e conversao em cliente.
            </p>
          </div>

          {entrada ? (
            <div className="flex flex-wrap gap-2">
              {!entrada.assignedToId ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    runAction(
                      () => assumirEntrada(entrada.id, token ?? ""),
                      "Entrada assumida",
                      "O ticket foi atribuído ao seu usuário.",
                    )
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <UserCheck className="h-4 w-4" />
                  Assumir
                </button>
              ) : null}

              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  runAction(
                    () => finalizarEntrada(entrada.id, "Entrada finalizada.", token ?? ""),
                    "Entrada finalizada",
                    "O atendimento foi finalizado.",
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-300 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finalizar
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  runAction(
                    () => marcarEntradaPerdida(entrada.id, "Entrada perdida.", token ?? ""),
                    "Entrada perdida",
                    "A entrada foi marcada como perdida.",
                  )
                }
                className="inline-flex h-10 items-center gap-2 rounded-md border border-red-300 px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Perdido
              </button>
            </div>
          ) : null}
        </div>

        {pageError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Carregando entrada...
          </div>
        ) : entrada ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <div className="flex flex-col gap-5">
              <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Dados da entrada
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      {entrada.nomeSolicitante ?? entrada.subject}
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {statusLabels[entrada.status] ?? entrada.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <Info label="Protocolo" value={entrada.protocolo ?? entrada.id} />
                  <Info label="Criado em" value={formatDate(entrada.createdAt)} />
                  <Info label="Responsável" value={entrada.assignedTo?.name ?? "Sem responsável"} />
                  <Info label="Email" value={entrada.emailSolicitante ?? "-"} />
                  <Info label="Telefone" value={entrada.telefoneSolicitante ?? "-"} />
                  <Info label="Origem" value={entrada.origem ?? "SITE"} />
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mensagem
                  </p>
                  <p className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm text-slate-700">
                    {entrada.mensagem ?? entrada.description}
                  </p>
                </div>

                {entrada.formPayload ? (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dados extras do formulario
                    </p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {Object.entries(entrada.formPayload).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-slate-700">{key}</span>
                          <p className="mt-1 break-words text-slate-600">
                            {stringifyValue(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Histórico
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      Ações registradas
                    </h2>
                  </div>
                </div>

                <div className="mt-4 divide-y divide-slate-100">
                  {entrada.history?.length ? (
                    entrada.history.map((event) => (
                      <div key={event.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-slate-900">
                            {event.title}
                          </p>
                          <span className="text-xs text-slate-500">
                            {formatDate(event.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {event.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="py-6 text-sm text-slate-500">
                      Nenhum histórico registrado.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside className="flex flex-col gap-5">
              <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Cliente
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      Vinculo comercial
                    </h2>
                  </div>
                  <UserPlus className="h-5 w-5 text-slate-500" />
                </div>

                {entrada.prospect ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <Info label="Nome/Razao social" value={entrada.prospect.nomeRazaoSocial} />
                    <Info label="Contato" value={entrada.prospect.nomeContato ?? "-"} />
                    <Info label="Email" value={entrada.prospect.email ?? "-"} />
                    <Info label="Telefone" value={entrada.prospect.telefone ?? "-"} />
                    <Info label="Status cadastral" value={entrada.prospect.statusCadastral} />
                    <Info label="Acesso ao portal" value={entrada.prospect.portalAccessStatus} />
                  </div>
                ) : entrada.client ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <Info label="Cliente ativo" value={entrada.client.companyName ?? entrada.client.user?.name ?? entrada.client.id} />
                    <Info label="Email" value={entrada.client.user?.email ?? "-"} />
                    <Info label="Telefone" value={entrada.client.phone ?? "-"} />
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Vincule ou crie um cadastro antes de criar cotação.
                    </div>

                    {suggestions ? (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Search className="h-4 w-4" />
                          Registros encontrados
                        </div>
                        {suggestions.prospects.map((prospect) => (
                          <button
                            key={prospect.id}
                            type="button"
                            disabled={actionLoading}
                            onClick={() =>
                              runAction(
                                () =>
                                  linkOrCreateProspect(
                                    entrada.id,
                                    { prospectId: prospect.id },
                                    token ?? "",
                                  ),
                                "Cadastro vinculado",
                                "A entrada foi vinculada a um cadastro existente.",
                              )
                            }
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="font-medium text-slate-900">
                              {prospect.nomeRazaoSocial}
                            </span>
                            <span className="block text-slate-500">
                              {prospect.email ?? prospect.telefone ?? "Sem contato"}
                            </span>
                          </button>
                        ))}
                        {suggestions.clients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            disabled={actionLoading}
                            onClick={() =>
                              runAction(
                                () =>
                                  linkOrCreateProspect(
                                    entrada.id,
                                    { clientId: client.id },
                                    token ?? "",
                                  ),
                                "Cliente vinculado",
                                "A entrada foi vinculada a um cliente ativo existente.",
                              )
                            }
                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <span className="font-medium text-slate-900">
                              {client.companyName ?? client.user?.name ?? client.id}
                            </span>
                            <span className="block text-slate-500">
                              Cliente ativo: {client.user?.email ?? "-"}
                            </span>
                          </button>
                        ))}
                        {!suggestions.prospects.length && !suggestions.clients.length ? (
                          <p className="text-sm text-slate-500">
                            Nenhuma correspondencia encontrada.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <form onSubmit={handleCreateProspect} className="mt-4 space-y-3">
                      <TextInput
                        label="Nome/Razao social"
                        value={prospectForm.nomeRazaoSocial ?? ""}
                        onChange={(value) =>
                          setProspectForm((prev) => ({ ...prev, nomeRazaoSocial: value }))
                        }
                        required
                      />
                      <TextInput
                        label="Nome do contato"
                        value={prospectForm.nomeContato ?? ""}
                        onChange={(value) =>
                          setProspectForm((prev) => ({ ...prev, nomeContato: value }))
                        }
                      />
                      <TextInput
                        label="Email"
                        value={prospectForm.email ?? ""}
                        onChange={(value) =>
                          setProspectForm((prev) => ({ ...prev, email: value }))
                        }
                      />
                      <TextInput
                        label="Telefone"
                        value={prospectForm.telefone ?? ""}
                        onChange={(value) =>
                          setProspectForm((prev) => ({ ...prev, telefone: value }))
                        }
                      />
                      <TextInput
                        label="CNPJ/Documento"
                        value={prospectForm.document ?? ""}
                        onChange={(value) =>
                          setProspectForm((prev) => ({ ...prev, document: value }))
                        }
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <TextInput
                          label="Cidade"
                          value={prospectForm.cidade ?? ""}
                          onChange={(value) =>
                            setProspectForm((prev) => ({ ...prev, cidade: value }))
                          }
                        />
                        <TextInput
                          label="Estado"
                          value={prospectForm.estado ?? ""}
                          onChange={(value) =>
                            setProspectForm((prev) => ({ ...prev, estado: value }))
                          }
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        <UserPlus className="h-4 w-4" />
                        Criar/Vincular cadastro
                      </button>
                    </form>
                  </div>
                )}
              </section>

              <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Cotação
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      Próxima etapa
                    </h2>
                  </div>
                  <FileText className="h-5 w-5 text-slate-500" />
                </div>

                {entrada.quote ? (
                  <div className="mt-4 rounded-md border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">
                      {entrada.quote.code}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {entrada.quote.origin} - {entrada.quote.destination}
                    </p>
                    <Link
                      href={`/quotes/${entrada.quote.id}`}
                      className="mt-3 inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Abrir cotação
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleCreateQuote} className="mt-4 space-y-3">
                    {!hasAccountLink ? (
                      <div className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
                        Crie ou vincule um cadastro para liberar a cotação.
                      </div>
                    ) : null}
                    <TextInput
                      label="Origem"
                      value={quoteForm.origin}
                      onChange={(value) =>
                        setQuoteForm((prev) => ({ ...prev, origin: value }))
                      }
                      required
                    />
                    <TextInput
                      label="Destino"
                      value={quoteForm.destination}
                      onChange={(value) =>
                        setQuoteForm((prev) => ({ ...prev, destination: value }))
                      }
                      required
                    />
                    <TextInput
                      label="Tipo de serviço"
                      value={quoteForm.serviceType}
                      onChange={(value) =>
                        setQuoteForm((prev) => ({ ...prev, serviceType: value }))
                      }
                      required
                    />
                    <TextInput
                      label="Valor da mercadoria"
                      type="number"
                      value={quoteForm.merchandiseValue?.toString() ?? ""}
                      onChange={(value) =>
                        setQuoteForm((prev) => ({
                          ...prev,
                          merchandiseValue: value ? Number(value) : undefined,
                        }))
                      }
                    />
                    <TextInput
                      label="Prazo desejado"
                      value={quoteForm.desiredDeadline ?? ""}
                      onChange={(value) =>
                        setQuoteForm((prev) => ({ ...prev, desiredDeadline: value }))
                      }
                    />
                    <label className="block text-sm">
                      <span className="font-medium text-slate-700">Observações</span>
                      <textarea
                        value={quoteForm.notes ?? ""}
                        onChange={(event) =>
                          setQuoteForm((prev) => ({ ...prev, notes: event.target.value }))
                        }
                        rows={3}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={!canCreateQuote || actionLoading}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FileText className="h-4 w-4" />
                      Criar cotação
                    </button>
                  </form>
                )}
              </section>
            </aside>
          </div>
        ) : null}
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-slate-800">{value}</p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
      />
    </label>
  );
}
