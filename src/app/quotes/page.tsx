"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileStack,
  FileText,
  LayoutDashboard,
  Package,
  PlusCircle,
  Search,
  UsersRound,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import {
  createQuote,
  getAllQuotes,
  getMyQuotes,
} from "@/services/quotes.service";
import type { CreateQuotePayload, Quote, QuoteStatus } from "@/types/quotes";

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

const initialFormState: QuoteFormState = {
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
  }).format(parsedDate);
}

function getStatusLabel(status: QuoteStatus) {
  const map: Record<QuoteStatus, string> = {
    RECEIVED: "Recebida",
    IN_ANALYSIS: "Em analise",
    ANSWERED: "Respondida",
    APPROVED: "Aprovada",
    REJECTED: "Rejeitada",
  };

  return map[status];
}

function getStatusClasses(status: QuoteStatus) {
  const map: Record<QuoteStatus, string> = {
    RECEIVED: "bg-sky-100 text-sky-800 border-sky-200",
    IN_ANALYSIS: "bg-amber-100 text-amber-800 border-amber-200",
    ANSWERED: "bg-violet-100 text-violet-800 border-violet-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  };

  return map[status];
}

function getClientName(quote: Quote) {
  return (
    quote.client?.companyName ||
    quote.client?.user?.name ||
    quote.prospect?.nomeRazaoSocial ||
    "Cliente"
  );
}

export default function QuotesPage() {
  const { user, token } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | QuoteStatus>(
    "TODOS",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorToastMessage, setErrorToastMessage] = useState("");
  const [form, setForm] = useState<QuoteFormState>(initialFormState);

  const isClient = user?.role === "CLIENTE";

  async function loadQuotes() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError("");
      const data = isClient
        ? await getMyQuotes(token)
        : await getAllQuotes(token);
      setQuotes(data);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Erro ao carregar cotações.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes();
  }, [token, isClient]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!errorToastMessage) return;
    const timer = setTimeout(() => setErrorToastMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [errorToastMessage]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const haystack = [
        quote.code,
        quote.origin,
        quote.destination,
        quote.serviceType,
        quote.requestType ?? "",
        getClientName(quote),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "TODOS" || quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: quotes.length,
      answered: quotes.filter((q) => q.status === "ANSWERED").length,
      pending: quotes.filter(
        (q) => q.status === "RECEIVED" || q.status === "IN_ANALYSIS",
      ).length,
      totalValue: quotes.reduce(
        (acc, item) => acc + Number(item.price ?? 0),
        0,
      ),
    };
  }, [quotes]);

  function resetForm() {
    setForm(initialFormState);
    setFormError("");
  }

  function validateForm() {
    if (!form.origin.trim()) return "Informe a origem.";
    if (!form.destination.trim()) return "Informe o destino.";
    if (!form.serviceType.trim()) return "Informe o tipo de serviço.";
    if (!form.requestType.trim())
      return "Informe se e cotação avulsa ou contrato.";
    if (!form.cargoDescription.trim()) return "Descreva a carga ou serviço.";
    if (!form.contactName.trim()) return "Informe o nome do contato.";
    if (!form.contactPhone.trim()) return "Informe o telefone do contato.";
    if (!form.contactEmail.trim()) return "Informe o e-mail do contato.";
    if (!form.merchandiseValue.trim()) return "Informe o valor da mercadoria.";
    const merchandiseValue = Number(form.merchandiseValue.replace(",", "."));
    if (!Number.isFinite(merchandiseValue) || merchandiseValue <= 0) {
      return "Informe um valor de mercadoria valido.";
    }
    return "";
  }

  async function handleCreateQuote() {
    if (!token) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      setErrorToastMessage(validationError);
      return;
    }

    const payload: CreateQuotePayload = {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      serviceType: form.serviceType.trim(),
      requestType: form.requestType.trim(),
      pickupAddress: form.pickupAddress.trim() || undefined,
      deliveryAddress: form.deliveryAddress.trim() || undefined,
      cargoDescription: form.cargoDescription.trim(),
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
      weight: form.weight ? Number(form.weight.replace(",", ".")) : undefined,
      volume: form.volume ? Number(form.volume.replace(",", ".")) : undefined,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      merchandiseValue: Number(form.merchandiseValue.replace(",", ".")),
      desiredDeadline: form.desiredDeadline || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      setSaving(true);
      setFormError("");
      const created = await createQuote(payload, token);
      setQuotes((prev) => [created, ...prev]);
      setSuccessMessage("Cotação enviada com sucesso.");
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao enviar cotação.";
      setFormError(message);
      setErrorToastMessage(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full flex-col gap-5">
        <section className="crm-shell-card rounded-[20px] p-6 md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="crm-eyebrow">
                {isClient ? "Solicitações" : "Pipeline comercial"}
              </p>
              <h1 className="crm-page-title">Cotações</h1>
              <p className="mt-2 text-sm text-slate-500">
                {isClient
                  ? "Acompanhe o status das suas solicitações de cotação e visualize os detalhes de cada resposta comercial."
                  : "Gerencie as cotações enviadas pelos clientes."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!isClient ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/clients"
                    className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                  >
                    <UsersRound className="h-4 w-4" />
                    Clientes
                  </Link>
                </>
              ) : null}

              {isClient ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(true);
                    setFormError("");
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <PlusCircle className="h-4 w-4" />
                  Nova cotação
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total de cotações",
              value: stats.total,
              Icon: FileText,
              iconClass: "bg-[#fff0f1] text-[#ec3139]",
            },
            {
              label: "Respondidas",
              value: stats.answered,
              Icon: CheckCircle2,
              iconClass: "bg-[#fff0f1] text-[#ec3139]",
            },
            {
              label: "Em andamento",
              value: stats.pending,
              Icon: Clock3,
              iconClass: "bg-[#fff7df] text-[#b87900]",
            },
            {
              label: "Valor respondido",
              value: formatCurrency(stats.totalValue),
              Icon: Banknote,
              iconClass: "bg-[#eaf8e9] text-[#3c9a35]",
            },
          ].map(({ label, value, Icon, iconClass }) => {
            return (
              <article key={label} className="crm-kpi-card rounded-[18px] p-6">
                <div className="flex items-center gap-5">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {label}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-950">
                      {value}
                    </h2>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="crm-shell-card rounded-[18px] p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar cotação
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por código, cliente, origem, destino ou serviço..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="crm-input h-14 rounded-2xl pl-11"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filtrar por status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "TODOS" | QuoteStatus)
                }
                className="crm-input h-14 rounded-2xl"
              >
                <option value="TODOS">Todos</option>
                <option value="RECEIVED">Recebida</option>
                <option value="IN_ANALYSIS">Em analise</option>
                <option value="ANSWERED">Respondida</option>
                <option value="APPROVED">Aprovada</option>
                <option value="REJECTED">Rejeitada</option>
              </select>
            </div>
          </div>
        </section>

        <section className="crm-shell-card overflow-hidden rounded-[18px]">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-xl font-bold text-slate-900">
              Lista de cotações
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filteredQuotes.length} registro(s) encontrado(s)
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Carregando cotações...
            </div>
          ) : pageError ? (
            <div className="p-10 text-center text-sm text-rose-600">
              {pageError}
            </div>
          ) : (
            <div className="grid gap-4 p-4">
              {filteredQuotes.map((quote) => (
                <article
                  key={quote.id}
                  className="rounded-[18px] border border-[#ffb8bd] bg-white/88 p-4 shadow-sm md:p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            quote.status,
                          )}`}
                        >
                          {getStatusLabel(quote.status)}
                        </span>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {formatDate(quote.createdAt)}
                        </span>
                      </div>

                      <h4 className="mt-3 text-2xl font-bold text-slate-950">
                        {quote.code}
                      </h4>
                      <p className="mt-1 text-sm text-slate-600">
                        {quote.origin}{" "}
                        <span className="font-bold text-[#ec3139]">-&gt;</span>{" "}
                        {quote.destination}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Building2 className="h-3.5 w-3.5" />
                        {isClient
                          ? "Solicitação enviada"
                          : getClientName(quote)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#ff9da4] bg-white px-5 text-sm font-semibold text-[#ec3139] transition hover:bg-[#fff0f1]"
                      >
                        Ver detalhes
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {[
                      {
                        label: "Tipo de solicitação",
                        value: quote.requestType || "-",
                        Icon: FileStack,
                        iconClass: "text-[#ec3139] bg-[#fff0f1]",
                      },
                      {
                        label: "Peso",
                        value: quote.weight ? `${quote.weight} kg` : "-",
                        Icon: Package,
                        iconClass: "text-[#b87900] bg-[#fff7df]",
                      },
                      {
                        label: "Valor da mercadoria",
                        value: formatCurrency(quote.merchandiseValue),
                        Icon: Banknote,
                        iconClass: "text-[#3c9a35] bg-[#eaf8e9]",
                      },
                      {
                        label: "Valor respondido",
                        value: formatCurrency(quote.price),
                        Icon: Banknote,
                        iconClass: "text-[#ec3139] bg-[#fff0f1]",
                      },
                      {
                        label: "Prazo desejado",
                        value: formatDate(quote.desiredDeadline),
                        Icon: CalendarDays,
                        iconClass: "text-[#b87900] bg-[#fff7df]",
                      },
                    ].map(({ label, value, Icon, iconClass }) => {
                      return (
                        <div
                          key={label}
                          className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">{label}</p>
                              <p className="mt-1 font-bold text-slate-900">
                                {value}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}

              {filteredQuotes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Nenhuma cotação encontrada com os filtros atuais.
                </div>
              ) : null}
            </div>
          )}
        </section>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
            <div className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_32px_90px_rgba(15,23,42,0.16)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="crm-eyebrow">Nova solicitação</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-950">
                    Nova cotação
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Quanto mais contexto operacional entrar aqui, melhor fica a
                    resposta comercial.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError("");
                  }}
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {formError ? (
                  <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Origem
                  </label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, origin: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Destino
                  </label>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        destination: e.target.value,
                      }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo de serviço
                  </label>
                  <input
                    type="text"
                    value={form.serviceType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        serviceType: e.target.value,
                      }))
                    }
                    placeholder="Ex: Transporte fracionado"
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo de solicitação
                  </label>
                  <select
                    value={form.requestType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        requestType: e.target.value,
                      }))
                    }
                    className="crm-input"
                  >
                    <option value="">Selecione</option>
                    <option value="Avulsa">Avulsa</option>
                    <option value="Contrato">Contrato</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Endereco de coleta
                  </label>
                  <input
                    type="text"
                    value={form.pickupAddress}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pickupAddress: e.target.value,
                      }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Endereco de entrega
                  </label>
                  <input
                    type="text"
                    value={form.deliveryAddress}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        deliveryAddress: e.target.value,
                      }))
                    }
                    className="crm-input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Descrição da carga / serviço
                  </label>
                  <textarea
                    value={form.cargoDescription}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        cargoDescription: e.target.value,
                      }))
                    }
                    rows={3}
                    className="crm-textarea"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Contato responsável
                  </label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        contactName: e.target.value,
                      }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Telefone do contato
                  </label>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        contactPhone: e.target.value,
                      }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    E-mail do contato
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        contactEmail: e.target.value,
                      }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Peso estimado (kg)
                  </label>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, weight: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Volume (m3)
                  </label>
                  <input
                    type="text"
                    value={form.volume}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, volume: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Valor da mercadoria *
                  </label>
                  <input
                    type="text"
                    value={form.merchandiseValue}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        merchandiseValue: e.target.value,
                      }))
                    }
                    className="crm-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Prazo desejado
                  </label>
                  <input
                    type="text"
                    value={form.desiredDeadline}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        desiredDeadline: e.target.value,
                      }))
                    }
                    placeholder="Ex: 30 dias, 10 dias úteis, conforme negociação"
                    className="crm-input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Observações adicionais
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={4}
                    className="crm-textarea"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError("");
                  }}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCreateQuote}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  <FileStack className="h-4 w-4" />
                  {saving ? "Enviando..." : "Salvar cotação"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <FeedbackToast
          open={!!successMessage}
          title="Sucesso"
          message={successMessage}
          variant="success"
          onClose={() => setSuccessMessage("")}
        />

        <FeedbackToast
          open={!!errorToastMessage}
          title="Atenção"
          message={errorToastMessage}
          variant="error"
          onClose={() => setErrorToastMessage("")}
          bottomClassName="bottom-24"
        />
      </div>
    </AppLayout>
  );
}
