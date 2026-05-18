"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import {
  deleteQuote,
  getQuoteById,
  respondQuote,
  updateQuote,
  updateQuoteStatus,
} from "@/services/quotes.service";
import type { CreateQuotePayload, Quote } from "@/types/quotes";

type QuoteFormState = {
  origin: string;
  destination: string;
  serviceType: string;
  requestType: string;
  pickupAddress: string;
  deliveryAddress: string;
  cargoDescription: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  weight: string;
  volume: string;
  quantity: string;
  merchandiseValue: string;
  desiredDeadline: string;
  notes: string;
};

const emptyFormState: QuoteFormState = {
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
  weight: "",
  volume: "",
  quantity: "",
  merchandiseValue: "",
  desiredDeadline: "",
  notes: "",
};

function formatCurrency(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
}

function formatDateInput(date?: string | null) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toISOString().slice(0, 10);
}

function getQuoteResponseValue(quote?: Quote | null) {
  if (!quote) {
    return null;
  }

  return (
    quote.price ??
    quote.propostas?.find(
      (proposta) => proposta.valor !== null && proposta.valor !== undefined,
    )?.valor ??
    null
  );
}

function getQuoteRequesterName(quote: Quote) {
  return (
    quote.client?.companyName ||
    quote.client?.user?.name ||
    quote.prospect?.nomeRazaoSocial ||
    "Prospect"
  );
}

function getStatusLabel(status: Quote["status"]) {
  const map: Record<Quote["status"], string> = {
    RECEIVED: "Recebida",
    IN_ANALYSIS: "Em analise",
    ANSWERED: "Respondida",
    APPROVED: "Aprovada",
    REJECTED: "Rejeitada",
  };

  return map[status];
}

function quoteToFormState(quote: Quote): QuoteFormState {
  return {
    origin: quote.origin,
    destination: quote.destination,
    serviceType: quote.serviceType,
    requestType: quote.requestType ?? "",
    pickupAddress: quote.pickupAddress ?? "",
    deliveryAddress: quote.deliveryAddress ?? "",
    cargoDescription: quote.cargoDescription ?? "",
    contactName: quote.contactName ?? "",
    contactPhone: quote.contactPhone ?? "",
    contactEmail: quote.contactEmail ?? "",
    weight: quote.weight?.toString() ?? "",
    volume: quote.volume?.toString() ?? "",
    quantity: quote.quantity?.toString() ?? "",
    merchandiseValue: quote.merchandiseValue?.toString() ?? "",
    desiredDeadline: formatDateInput(quote.desiredDeadline),
    notes: quote.notes ?? "",
  };
}

function buildUpdatePayload(form: QuoteFormState): Partial<CreateQuotePayload> {
  return {
    origin: form.origin.trim(),
    destination: form.destination.trim(),
    serviceType: form.serviceType.trim(),
    requestType: form.requestType.trim() || undefined,
    pickupAddress: form.pickupAddress.trim() || undefined,
    deliveryAddress: form.deliveryAddress.trim() || undefined,
    cargoDescription: form.cargoDescription.trim() || undefined,
    contactName: form.contactName.trim() || undefined,
    contactPhone: form.contactPhone.trim() || undefined,
    contactEmail: form.contactEmail.trim() || undefined,
    weight: form.weight ? Number(form.weight.replace(",", ".")) : undefined,
    volume: form.volume ? Number(form.volume.replace(",", ".")) : undefined,
    quantity: form.quantity ? Number(form.quantity) : undefined,
    merchandiseValue: form.merchandiseValue
      ? Number(form.merchandiseValue.replace(",", "."))
      : undefined,
    desiredDeadline: form.desiredDeadline || undefined,
    notes: form.notes.trim() || undefined,
  };
}

export default function QuoteDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token, user } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responseForm, setResponseForm] = useState({
    price: "",
    commercialNotes: "",
  });
  const [statusNotes, setStatusNotes] = useState("");
  const [form, setForm] = useState<QuoteFormState>(emptyFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const canRespond =
    !!user?.role && ["ADMIN", "GESTAO", "COMERCIAL"].includes(user.role);
  const isProspectQuote = Boolean(quote?.prospectId && !quote.clientId);
  const canEdit = useMemo(() => {
    if (!quote || !user?.role) return false;
    if (["ADMIN", "GESTAO", "COMERCIAL"].includes(user.role)) return true;
    if (user.role === "CLIENTE") {
      return ["RECEIVED", "IN_ANALYSIS"].includes(quote.status);
    }
    return false;
  }, [quote, user?.role]);

  useEffect(() => {
    let active = true;

    async function loadQuote() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const { id } = await params;
        const data = await getQuoteById(id, token);

        if (active) {
          setQuote(data);
          setForm(quoteToFormState(data));
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Erro ao carregar a cotação.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQuote();

    return () => {
      active = false;
    };
  }, [params, token]);

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Detalhe da cotação
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
                {quote?.code ?? "Carregando..."}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Todos os detalhes, histórico, valores e retorno comercial em uma
                unica tela.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canEdit && quote ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing((current) => !current);
                      setForm(quoteToFormState(quote));
                      setActionMessage("");
                    }}
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                  >
                    {isEditing ? "Cancelar edição" : "Editar cotação"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!token || !quote) return;
                      const confirmed = window.confirm(
                        `Deseja excluir a cotação ${quote.code}?`,
                      );
                      if (!confirmed) return;

                      try {
                        setSaving(true);
                        const result = await deleteQuote(quote.id, token);
                        setActionMessage(result.message);
                        window.location.href = "/quotes";
                      } catch (deleteError) {
                        setActionMessage(
                          deleteError instanceof Error
                            ? deleteError.message
                            : "Erro ao excluir cotação.",
                        );
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Excluir
                  </button>
                </>
              ) : null}

              <Link
                href="/quotes"
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Voltar para cotações
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
            Carregando cotação...
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700 shadow-sm">
            {error}
          </section>
        ) : quote ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Código</p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                  {quote.code}
                </h2>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Solicitante</p>
                <h2 className="mt-2 text-xl font-bold text-zinc-900">
                  {getQuoteRequesterName(quote)}
                </h2>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Status</p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                  {getStatusLabel(quote.status)}
                </h2>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Valor respondido</p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                  {formatCurrency(getQuoteResponseValue(quote))}
                </h2>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Valor da mercadoria</p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                  {formatCurrency(quote.merchandiseValue)}
                </h2>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-zinc-500">Prazo desejado</p>
                <h2 className="mt-2 text-2xl font-bold text-zinc-900">
                  {formatDate(quote.desiredDeadline)}
                </h2>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
              <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-zinc-900">
                    Dados da solicitação
                  </h2>

                  {isEditing ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={async () => {
                        if (!token || !quote) return;

                        try {
                          setSaving(true);
                          const updated = await updateQuote(
                            quote.id,
                            buildUpdatePayload(form),
                            token,
                          );
                          setQuote(updated);
                          setForm(quoteToFormState(updated));
                          setIsEditing(false);
                          setActionMessage("Cotação atualizada com sucesso.");
                        } catch (saveError) {
                          setActionMessage(
                            saveError instanceof Error
                              ? saveError.message
                              : "Erro ao atualizar cotação.",
                          );
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {saving ? "Salvando..." : "Salvar alterações"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    ["Origem", "origin"],
                    ["Destino", "destination"],
                    ["Serviço", "serviceType"],
                    ["Tipo", "requestType"],
                    ["Contato", "contactName"],
                    ["Telefone", "contactPhone"],
                    ["E-mail", "contactEmail"],
                    ["Peso (kg)", "weight"],
                    ["Volume (m3)", "volume"],
                    ["Quantidade", "quantity"],
                    ["Valor da mercadoria", "merchandiseValue"],
                    ["Prazo desejado", "desiredDeadline"],
                  ].map(([label, field]) => (
                    <div key={field} className="rounded-2xl bg-zinc-50 p-4">
                      <p className="text-sm text-zinc-500">{label}</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={form[field as keyof QuoteFormState]}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...(current ?? emptyFormState),
                              [field]: event.target.value,
                            }))
                          }
                          className="crm-input mt-3"
                        />
                      ) : (
                        <p className="mt-1 font-semibold text-zinc-900">
                          {field === "merchandiseValue"
                            ? formatCurrency(quote.merchandiseValue)
                            : field === "desiredDeadline"
                              ? formatDate(quote.desiredDeadline)
                              : (
                                  quote[field as keyof Quote] as
                                    | string
                                    | number
                                    | null
                                    | undefined
                                )?.toString() || "-"}
                        </p>
                      )}
                    </div>
                  ))}

                  {[
                    ["Endereco de coleta", "pickupAddress"],
                    ["Endereco de entrega", "deliveryAddress"],
                    ["Descrição da carga / serviço", "cargoDescription"],
                    ["Observações", "notes"],
                  ].map(([label, field]) => (
                    <div
                      key={field}
                      className="rounded-2xl bg-zinc-50 p-4 md:col-span-2"
                    >
                      <p className="text-sm text-zinc-500">{label}</p>
                      {isEditing ? (
                        <textarea
                          value={form[field as keyof QuoteFormState]}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...(current ?? emptyFormState),
                              [field]: event.target.value,
                            }))
                          }
                          rows={field === "notes" ? 4 : 3}
                          className="crm-textarea mt-3"
                        />
                      ) : (
                        <p className="mt-1 font-semibold text-zinc-900">
                          {(
                            quote[field as keyof Quote] as
                              | string
                              | number
                              | null
                              | undefined
                          )?.toString() || "-"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-zinc-900">
                  Histórico e retorno
                </h2>

                <div className="mt-6 space-y-3">
                  {quote.history?.length ? (
                    quote.history.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-900">
                            {getStatusLabel(entry.status)}
                          </p>
                          <span className="text-xs text-zinc-400">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-zinc-700">
                          {entry.notes || "Sem observações registradas."}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                      Nenhum histórico registrado.
                    </div>
                  )}

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Retorno comercial
                    </p>
                    <p className="mt-3 text-sm leading-6 text-blue-800">
                      {quote.commercialNotes ||
                        "Ainda não ha retorno comercial registrado."}
                    </p>
                  </div>

                  {canRespond ? (
                    <>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {isProspectQuote
                            ? "Registrar retorno comercial"
                            : "Enviar proposta ao cliente"}
                        </p>
                        <div className="mt-4 space-y-3">
                          <input
                            type="text"
                            value={responseForm.price}
                            onChange={(event) =>
                              setResponseForm((current) => ({
                                ...current,
                                price: event.target.value,
                              }))
                            }
                            className="crm-input"
                            placeholder="Valor da proposta"
                          />
                          <textarea
                            rows={4}
                            value={responseForm.commercialNotes}
                            onChange={(event) =>
                              setResponseForm((current) => ({
                                ...current,
                                commercialNotes: event.target.value,
                              }))
                            }
                            className="crm-textarea"
                            placeholder={
                              isProspectQuote
                                ? "Observações comerciais internas"
                                : "Observações comerciais para o cliente"
                            }
                          />
                          <button
                            type="button"
                            disabled={saving}
                            onClick={async () => {
                              if (!token || !quote) return;
                              const price = Number(
                                responseForm.price.replace(",", "."),
                              );
                              if (!Number.isFinite(price) || price <= 0) {
                                setActionMessage(
                                  "Informe um valor valido para a proposta.",
                                );
                                return;
                              }

                              try {
                                setSaving(true);
                                const updated = await respondQuote(
                                  quote.id,
                                  {
                                    price,
                                    commercialNotes:
                                      responseForm.commercialNotes.trim() ||
                                      undefined,
                                  },
                                  token,
                                );
                                setQuote(updated);
                                setActionMessage(
                                  isProspectQuote
                                    ? "Retorno comercial registrado na cotação do prospect."
                                    : "Proposta enviada e registrada na cotação.",
                                );
                                setResponseForm({
                                  price: "",
                                  commercialNotes: "",
                                });
                              } catch (saveError) {
                                setActionMessage(
                                  saveError instanceof Error
                                    ? saveError.message
                                    : "Erro ao responder cotação.",
                                );
                              } finally {
                                setSaving(false);
                              }
                            }}
                            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                          >
                            {saving
                              ? "Salvando..."
                              : isProspectQuote
                                ? "Registrar resposta"
                                : "Enviar proposta"}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Atualizar status
                        </p>
                        <div className="mt-4 grid gap-3">
                          <select
                            value={quote.status}
                            onChange={async (event) => {
                              if (!token || !quote) return;
                              const nextStatus = event.target
                                .value as Quote["status"];
                              try {
                                setSaving(true);
                                const updated = await updateQuoteStatus(
                                  quote.id,
                                  {
                                    status: nextStatus,
                                    notes: statusNotes.trim() || undefined,
                                  },
                                  token,
                                );
                                setQuote(updated);
                                setStatusNotes("");
                                setActionMessage(
                                  "Status atualizado com sucesso.",
                                );
                              } catch (statusError) {
                                setActionMessage(
                                  statusError instanceof Error
                                    ? statusError.message
                                    : "Erro ao atualizar status.",
                                );
                              } finally {
                                setSaving(false);
                              }
                            }}
                            className="crm-input"
                          >
                            <option value="RECEIVED">Recebida</option>
                            <option value="IN_ANALYSIS">Em analise</option>
                            <option value="ANSWERED">Respondida</option>
                            <option value="APPROVED">Aprovada</option>
                            <option value="REJECTED">Rejeitada</option>
                          </select>
                          <input
                            value={statusNotes}
                            onChange={(event) =>
                              setStatusNotes(event.target.value)
                            }
                            className="crm-input"
                            placeholder="Nota opcional para histórico"
                          />
                          {isProspectQuote ? (
                            <p className="text-xs leading-5 text-slate-500">
                              Ao aprovar uma cotação de prospect, o cadastro vai
                              para aguardando cadastro. Contrato e operação só
                              ficam liberados após virar cliente ativo.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {actionMessage ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {actionMessage}
                    </div>
                  ) : null}
                </div>
              </article>
            </section>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
