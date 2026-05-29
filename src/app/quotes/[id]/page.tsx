"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Box,
  CalendarDays,
  ClipboardList,
  DollarSign,
  Edit3,
  FileText,
  History,
  MapPin,
  MessageSquareText,
  Package,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
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
    "Cliente"
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

function getStatusClasses(status: Quote["status"]) {
  const map: Record<Quote["status"], string> = {
    RECEIVED: "bg-sky-100 text-sky-800 border-sky-200",
    IN_ANALYSIS: "bg-amber-100 text-amber-800 border-amber-200",
    ANSWERED: "bg-violet-100 text-violet-800 border-violet-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
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
  const isClient = user?.role === "CLIENTE";
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
      <div className="mx-auto flex w-full flex-col gap-5">
        <section className="crm-shell-card rounded-[20px] p-6 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_1px_.85fr] xl:items-center">
              <div>
                <p className="crm-eyebrow">Pipeline comercial</p>
                <h1 className="crm-page-title">Detalhe da cotação</h1>
                <p className="crm-page-copy">
                  Todos os detalhes, histórico, valores e retorno comercial.
                </p>
              </div>
              <div className="hidden h-20 w-px bg-slate-200 xl:block" />
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Código da cotação
                </p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  {quote?.code ?? "Carregando..."}
                </h2>
              </div>
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
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Edit3 className="h-4 w-4" />
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
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                </>
              ) : null}

              <Link
                href="/quotes"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
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
              {[
                {
                  label: "Código",
                  value: quote.code,
                  Icon: FileText,
                  iconClass: "bg-[#fff0f1] text-[#ec3139]",
                },
                ...(!isClient
                  ? [
                      {
                        label: "Solicitante",
                        value: getQuoteRequesterName(quote),
                        Icon: UserRound,
                        iconClass: "bg-[#fff7df] text-[#343434]",
                      },
                    ]
                  : []),
                {
                  label: "Status",
                  value: getStatusLabel(quote.status),
                  Icon: MessageSquareText,
                  iconClass: "bg-[#eee7ff] text-[#6d42e8]",
                },
                {
                  label: "Valor respondido",
                  value: formatCurrency(getQuoteResponseValue(quote)),
                  Icon: DollarSign,
                  iconClass: "bg-[#eaf8e9] text-[#3c9a35]",
                },
                {
                  label: "Valor da mercadoria",
                  value: formatCurrency(quote.merchandiseValue),
                  Icon: Box,
                  iconClass: "bg-[#fff7df] text-[#343434]",
                },
                {
                  label: "Prazo desejado",
                  value: formatDate(quote.desiredDeadline),
                  Icon: CalendarDays,
                  iconClass: "bg-[#fff0f1] text-[#ec3139]",
                },
              ].map(({ label, value, Icon, iconClass }) => {
                return (
                  <article
                    key={label}
                    className="crm-kpi-card rounded-[18px] p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconClass}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500">{label}</p>
                        {label === "Status" ? (
                          <p
                            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                              quote.status,
                            )}`}
                          >
                            {value}
                          </p>
                        ) : (
                          <h2 className="mt-2 truncate text-lg font-bold text-slate-950">
                            {value}
                          </h2>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
              <article className="crm-shell-card rounded-[18px] p-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-slate-900" />
                  <h2 className="text-xl font-bold text-slate-950">
                    1. Rota da cotação
                  </h2>
                </div>

                <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f1] text-[#ec3139]">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm text-slate-500">Origem</p>
                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {quote.origin || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-[140px] items-center justify-center gap-3 text-slate-400">
                    <span className="hidden h-px flex-1 border-t border-dashed border-slate-300 md:block" />
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff2bf] text-[#343434]">
                      <Truck className="h-6 w-6" />
                    </span>
                    <span className="hidden h-px flex-1 border-t border-dashed border-slate-300 md:block" />
                  </div>

                  <div className="flex items-center justify-end gap-4 text-right">
                    <div>
                      <p className="text-sm text-slate-500">Destino</p>
                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {quote.destination || "-"}
                      </p>
                    </div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0f1] text-[#ec3139]">
                      <MapPin className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </article>

              <article className="crm-shell-card rounded-[18px] p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2bf] text-[#343434]">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <h2 className="text-xl font-bold text-slate-950">
                    2. Detalhes da solicitação
                  </h2>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
                    <p className="text-sm text-slate-500">
                      Tipo de solicitação
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {quote.requestType || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
                    <p className="text-sm text-slate-500">Peso</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {quote.weight ? `${quote.weight} kg` : "-"}
                    </p>
                  </div>
                </div>
              </article>
            </section>

            <section className="grid gap-5">
              <article className="crm-shell-card rounded-[18px] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-[#ec3139]" />
                    <h2 className="text-xl font-bold text-slate-950">
                      Cadastro completo da cotação
                    </h2>
                  </div>

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
                      className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
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
                  ]
                    .filter(
                      ([, field]) =>
                        !isClient ||
                        ![
                          "contactName",
                          "contactPhone",
                          "contactEmail",
                        ].includes(field),
                    )
                    .map(([label, field]) => (
                      <div
                        key={field}
                        className="rounded-2xl border border-slate-200 bg-white/80 p-4"
                      >
                        <p className="text-sm text-slate-500">{label}</p>
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
                          <p className="mt-1 font-semibold text-slate-900">
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
                      className="rounded-2xl border border-slate-200 bg-white/80 p-4 md:col-span-2"
                    >
                      <p className="text-sm text-slate-500">{label}</p>
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
                        <p className="mt-1 font-semibold text-slate-900">
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

              <article className="crm-shell-card rounded-[18px] p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff2bf] text-[#343434]">
                    <History className="h-5 w-5" />
                  </span>
                  <h2 className="text-xl font-bold text-slate-950">
                    3. Histórico e observações
                  </h2>
                </div>

                <div className="mt-6 space-y-3">
                  {quote.history?.length ? (
                    quote.history.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClasses(entry.status)}`}
                          >
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
                          Enviar proposta ao cliente
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
                            placeholder="Observacoes comerciais para o cliente"
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
                                  "Proposta enviada e registrada na cotação.",
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
                            {saving ? "Salvando..." : "Enviar proposta"}
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
