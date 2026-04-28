"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  History,
  Lock,
  MessageSquare,
  PlayCircle,
  PlusCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  TicketIcon,
  UserRound,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import { getCrmClientSummaries } from "@/services/crm.service";
import {
  addInternalTicketNote,
  createTicket,
  getAllTickets,
  getMyTickets,
  getTicket,
  getTicketPropostas,
  managementTicketDecision,
  approveTicketPropostaByClient,
  rejectTicketPropostaByClient,
  replyTicket,
  requestTicketPropostaAdjustmentByClient,
  sendPreProposal,
  sendTicketToManagement,
  startTicket,
  updateTicketStatus,
} from "@/services/tickets.service";
import type { LeadSummary } from "@/types/crm";
import type {
  Proposta,
  StatusProposta,
  Ticket,
  TicketStatus,
  TicketType,
} from "@/types/tickets";

const internalStatusLabels: Record<TicketStatus, string> = {
  NOVO: "Novo",
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  AGUARDANDO_COMERCIAL: "Aguardando comercial",
  AGUARDANDO_GESTAO: "Aguardando Gestao",
  RESPONDIDO: "Respondido",
  APROVADO_CLIENTE: "Aprovado pelo cliente",
  APROVADO_GESTAO: "Aprovado pela Gestao",
  AJUSTE_SOLICITADO: "Ajuste solicitado",
  REPROVADO: "Reprovado",
  FECHADO: "Fechado",
  CANCELADO: "Cancelado",
};

const clientStatusLabels: Record<TicketStatus, string> = {
  NOVO: "Aberto",
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em analise",
  AGUARDANDO_CLIENTE: "Aguardando sua resposta",
  AGUARDANDO_COMERCIAL: "Em analise",
  AGUARDANDO_GESTAO: "Em validacao interna",
  RESPONDIDO: "Respondido",
  APROVADO_CLIENTE: "Aprovado",
  APROVADO_GESTAO: "Aprovado",
  AJUSTE_SOLICITADO: "Ajuste solicitado",
  REPROVADO: "Recusado",
  FECHADO: "Concluido",
  CANCELADO: "Cancelado",
};

const ticketTypeLabels: Record<TicketType, string> = {
  COTACAO: "Cotacao",
  LEAD: "Lead",
  PRE_NEGOCIACAO: "Pre-negociacao",
  APROVACAO_GESTAO: "Aprovacao Gestao",
  AJUSTE_CLIENTE: "Ajuste Cliente",
  AJUSTE_GESTAO: "Ajuste Gestao",
  SUPORTE: "Suporte",
  DOCUMENTACAO: "Documentacao",
  OPERACIONAL: "Operacional",
};

const ticketTypes: Array<TicketType | "TODOS"> = [
  "TODOS",
  "COTACAO",
  "LEAD",
  "PRE_NEGOCIACAO",
  "APROVACAO_GESTAO",
  "AJUSTE_CLIENTE",
  "AJUSTE_GESTAO",
  "SUPORTE",
  "DOCUMENTACAO",
  "OPERACIONAL",
];

const propostaStatusLabels: Record<StatusProposta, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA_AO_CLIENTE: "Disponivel para analise",
  APROVADA_PELO_CLIENTE: "Aprovada pelo cliente",
  RECUSADA_PELO_CLIENTE: "Recusada pelo cliente",
  AJUSTE_SOLICITADO_PELO_CLIENTE: "Ajuste solicitado pelo cliente",
  ENVIADA_PARA_GESTAO: "Enviada para Gestao",
  APROVADA_PELA_GESTAO: "Aprovada pela Gestao",
  RECUSADA_PELA_GESTAO: "Recusada pela Gestao",
  AJUSTE_SOLICITADO_PELA_GESTAO: "Ajuste solicitado pela Gestao",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada",
};

const filterStatuses: Array<TicketStatus | "TODOS"> = [
  "TODOS",
  "ABERTO",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "AGUARDANDO_COMERCIAL",
  "AGUARDANDO_GESTAO",
  "RESPONDIDO",
  "APROVADO_CLIENTE",
  "APROVADO_GESTAO",
  "AJUSTE_SOLICITADO",
  "REPROVADO",
  "FECHADO",
  "CANCELADO",
  
];

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getClientName(ticket: Ticket) {
  return (
    ticket.client?.companyName ||
    ticket.client?.user?.name ||
    ticket.lead?.company ||
    ticket.lead?.name ||
    "Sem cliente vinculado"
  );
}

function getStatusLabel(status: TicketStatus, isClient: boolean) {
  return isClient ? clientStatusLabels[status] : internalStatusLabels[status];
}

function getStatusClass(status: TicketStatus) {
  if (["FECHADO", "CLOSED", "APROVADO_GESTAO"].includes(status)) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (
    ["AGUARDANDO_CLIENTE", "RESPONDIDO", "WAITING_CUSTOMER"].includes(status)
  ) {
    return "bg-violet-100 text-violet-700";
  }

  if (["AGUARDANDO_GESTAO"].includes(status)) {
    return "bg-indigo-100 text-indigo-700";
  }

  if (["AJUSTE_SOLICITADO", "REPROVADO", "CANCELADO"].includes(status)) {
    return "bg-rose-100 text-rose-700";
  }

  if (["EM_ANDAMENTO", "IN_PROGRESS"].includes(status)) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-blue-100 text-blue-700";
}

function getActionBadge(ticket: Ticket, role?: string | null) {
  if (role === "CLIENTE") {
    if (["AGUARDANDO_CLIENTE", "RESPONDIDO"].includes(ticket.status))
      return "Aguardando sua resposta";
    if (ticket.type === "PRE_NEGOCIACAO") return "Proposta disponivel";
    if (ticket.status === "APROVADO_GESTAO") return "Aprovado";
    return null;
  }

  if (role === "GESTAO" || role === "ADMIN") {
    if (ticket.status === "AGUARDANDO_GESTAO") return "Aguardando aprovacao";
    if (ticket.type === "APROVACAO_GESTAO") return "Reenviado para aprovacao";
  }

  if (role === "COMERCIAL" || role === "ADMIN") {
    if (ticket.status === "AGUARDANDO_COMERCIAL") return "Aguardando comercial";
    if (
      ticket.type === "COTACAO" &&
      ["ABERTO", "AGUARDANDO_COMERCIAL"].includes(ticket.status)
    )
      return "Nova cotacao";
    if (ticket.type === "LEAD") return "Novo lead";
    if (
      ticket.type === "AJUSTE_GESTAO" ||
      ticket.status === "AJUSTE_SOLICITADO"
    )
      return "Ajuste solicitado";
    if (ticket.status === "APROVADO_CLIENTE") return "Cliente aprovou";
  }

  return null;
}

function isClosedStatus(status: TicketStatus) {
  return ["FECHADO", "CANCELADO", "CLOSED"].includes(status);
}

function canClientAct(status: TicketStatus) {
  const statuses: TicketStatus[] = ["AGUARDANDO_CLIENTE", "RESPONDIDO"];
  return statuses.includes(status);
}

export default function TicketsPage() {
  const { user, token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | TicketStatus>(
    "TODOS",
  );
  const [typeFilter, setTypeFilter] = useState<"TODOS" | TicketType>("TODOS");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [preProposal, setPreProposal] = useState("");
  const [proposalDecisionReason, setProposalDecisionReason] = useState("");
  const [managementMessage, setManagementMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    type: "SUPORTE" as TicketType,
    subject: "",
    description: "",
  });
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const isClient = user?.role === "CLIENTE";
  const isManagement = user?.role === "GESTAO" || user?.role === "ADMIN";
  const isCommercial = user?.role === "COMERCIAL" || user?.role === "ADMIN";
  const isInternal = user?.role
    ? ["ADMIN", "GESTAO", "COMERCIAL"].includes(user.role)
    : false;
  const activeClientProposta = useMemo(
    () =>
      propostas.find((proposta) => proposta.status === "ENVIADA_AO_CLIENTE") ??
      propostas[0] ??
      null,
    [propostas],
  );

  async function loadTickets() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError("");
      const [ticketData, clientData] = await Promise.all([
        isClient
          ? getMyTickets(token, { status: statusFilter, type: typeFilter })
          : getAllTickets(token, { status: statusFilter, type: typeFilter }),
        isInternal ? getCrmClientSummaries(token) : Promise.resolve([]),
      ]);
      setTickets(ticketData);
      setClients(clientData);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Erro ao carregar tickets.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, [token, isClient, isInternal, statusFilter, typeFilter]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const ticketId = params.get("ticket");

    if (ticketId) {
      Promise.all([
        getTicket(ticketId, token),
        getTicketPropostas(ticketId, token),
      ])
        .then(([ticket, ticketPropostas]) => {
          setSelectedTicket(ticket);
          setPropostas(ticketPropostas);
        })
        .catch(() => undefined);
    }
  }, [token]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (!query) {
        return true;
      }

      return [
        ticket.subject,
        ticket.description,
        getClientName(ticket),
        ticket.quote?.serviceType,
        ticket.quote?.origin,
        ticket.quote?.destination,
        ticket.lead?.name,
        ticket.lead?.email,
        ticket.opportunity?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [search, tickets]);

  const summary = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => !isClosedStatus(ticket.status)).length,
      inProgress: tickets.filter((ticket) => ticket.status === "EM_ANDAMENTO")
        .length,
      closed: tickets.filter((ticket) => isClosedStatus(ticket.status)).length,
    }),
    [tickets],
  );

  async function refreshSelected(updated: Ticket) {
    setTickets((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelectedTicket(updated);
  }

  async function openDetails(ticket: Ticket) {
    if (!token) {
      setSelectedTicket(ticket);
      setPropostas([]);
      return;
    }

    const [fullTicket, ticketPropostas] = await Promise.all([
      getTicket(ticket.id, token),
      getTicketPropostas(ticket.id, token),
    ]);
    setSelectedTicket(fullTicket);
    setPropostas(ticketPropostas);
  }

  async function handleCreateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.subject.trim() || !form.description.trim()) {
      setToast({
        title: "Campos obrigatorios",
        message: "Informe assunto e descricao.",
        variant: "error",
      });
      return;
    }

    if (isInternal && !form.clientId) {
      setToast({
        title: "Cliente obrigatorio",
        message: "Selecione o cliente do ticket.",
        variant: "error",
      });
      return;
    }

    if (!token) {
      return;
    }

    try {
      setSaving(true);
      const created = await createTicket(
        {
          clientId: isInternal ? form.clientId : undefined,
          type: form.type,
          subject: form.subject.trim(),
          description: form.description.trim(),
        },
        token,
      );
      setTickets((current) => [created, ...current]);
      setForm({ clientId: "", type: "SUPORTE", subject: "", description: "" });
      setIsModalOpen(false);
      setToast({
        title: "Ticket criado",
        message: "Chamado registrado com sucesso.",
        variant: "success",
      });
    } catch (error) {
      setToast({
        title: "Falha ao criar ticket",
        message:
          error instanceof Error ? error.message : "Erro ao criar ticket.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function executeTicketAction(
    action: () => Promise<Ticket>,
    successMessage: string,
  ) {
    try {
      setSaving(true);
      const updated = await action();
      await refreshSelected(updated);
      setReply("");
      setInternalNote("");
      setPreProposal("");
      setProposalDecisionReason("");
      setManagementMessage("");
      setToast({
        title: "Ticket atualizado",
        message: successMessage,
        variant: "success",
      });
    } catch (error) {
      setToast({
        title: "Falha ao atualizar ticket",
        message:
          error instanceof Error ? error.message : "Erro ao atualizar ticket.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function executePropostaAction(
    action: () => Promise<{ mensagem: string }>,
    successMessage: string,
  ) {
    if (!token || !selectedTicket) {
      return;
    }

    try {
      setSaving(true);
      const result = await action();
      const [updatedTicket, updatedPropostas] = await Promise.all([
        getTicket(selectedTicket.id, token),
        getTicketPropostas(selectedTicket.id, token),
      ]);
      await refreshSelected(updatedTicket);
      setPropostas(updatedPropostas);
      setReply("");
      setProposalDecisionReason("");
      setToast({
        title: "Proposta atualizada",
        message: result.mensagem || successMessage,
        variant: "success",
      });
    } catch (error) {
      setToast({
        title: "Falha ao atualizar proposta",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar proposta.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !selectedTicket || !reply.trim()) {
      return;
    }

    await executeTicketAction(
      () => replyTicket(selectedTicket.id, reply.trim(), token),
      "Resposta enviada.",
    );
  }

  async function handleInternalNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !selectedTicket || !internalNote.trim()) {
      return;
    }

    await executeTicketAction(
      () =>
        addInternalTicketNote(selectedTicket.id, internalNote.trim(), token),
      "Observacao interna registrada.",
    );
  }

  async function handleStatusChange(ticket: Ticket, status: TicketStatus) {
    if (!token) {
      return;
    }

    await executeTicketAction(
      () => updateTicketStatus(ticket.id, status, token),
      "Status atualizado.",
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="crm-shell-card p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="crm-eyebrow">Central de atendimento</p>
              <h1 className="crm-page-title">Tickets do CRM</h1>
              <p className="crm-page-copy">
                Comunicacao entre Cliente, Comercial e Gestao com historico e
                notificacoes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <PlusCircle className="h-4 w-4" />
              Novo ticket
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total de tickets", summary.total, "text-slate-950"],
            ["Em aberto", summary.open, "text-blue-600"],
            ["Em andamento", summary.inProgress, "text-amber-600"],
            ["Fechados", summary.closed, "text-emerald-600"],
          ].map(([label, value, color]) => (
            <article key={label} className="crm-kpi-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <h2 className={`mt-2 text-3xl font-bold ${color}`}>
                    {value}
                  </h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <TicketIcon className="h-5 w-5" />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="crm-shell-card p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por assunto, cliente, cotacao, lead ou oportunidade"
              className="crm-input"
            />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "TODOS" | TicketStatus)
              }
              className="crm-input"
            >
              {filterStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === "TODOS"
                    ? "Todos os status"
                    : getStatusLabel(status, !!isClient)}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "TODOS" | TicketType)
              }
              className="crm-input"
            >
              {ticketTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "TODOS" ? "Todos os tipos" : ticketTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="crm-shell-card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Tickets recentes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredTickets.length} demanda(s) encontrada(s)
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Carregando tickets...
            </div>
          ) : pageError ? (
            <div className="p-10 text-center text-sm text-rose-600">
              {pageError}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredTickets.map((ticket) => {
                const badge = getActionBadge(ticket, user?.role);

                return (
                  <article
                    key={ticket.id}
                    className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 lg:grid-cols-[1.35fr_.9fr_.85fr_.85fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">
                          {ticket.subject}
                        </p>
                        {badge ? (
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            {badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {getClientName(ticket)}
                      </p>
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {ticketTypeLabels[ticket.type]}
                      </span>
                      {ticket.quote ? (
                        <Link
                          href={`/quotes/${ticket.quote.id}`}
                          className="flex items-center gap-1 font-semibold text-blue-700"
                        >
                          Cotacao vinculada
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : ticket.lead ? (
                        <span>{ticket.lead.name}</span>
                      ) : null}
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(ticket.status)}`}
                      >
                        {getStatusLabel(ticket.status, !!isClient)}
                      </span>
                    </div>

                    <div className="text-sm text-slate-600">
                      {formatDate(ticket.lastInteractionAt ?? ticket.updatedAt)}
                    </div>

                    <div className="flex justify-start lg:justify-end">
                      <button
                        type="button"
                        onClick={() => openDetails(ticket)}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </article>
                );
              })}

              {filteredTickets.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  Nenhum ticket encontrado.
                </div>
              ) : null}
            </div>
          )}
        </section>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
            <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.16)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="crm-eyebrow">Novo ticket</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Abrir atendimento
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="mt-6 space-y-4">
                {isInternal ? (
                  <select
                    value={form.clientId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        clientId: event.target.value,
                      }))
                    }
                    className="crm-input"
                  >
                    <option value="">Selecione o cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company}
                      </option>
                    ))}
                  </select>
                ) : null}

                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as TicketType,
                    }))
                  }
                  className="crm-input"
                >
                  {ticketTypes
                    .filter((type) => type !== "TODOS")
                    .map((type) => (
                      <option key={type} value={type}>
                        {ticketTypeLabels[type as TicketType]}
                      </option>
                    ))}
                </select>

                <input
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  className="crm-input"
                  placeholder="Assunto"
                />
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="crm-textarea"
                  rows={5}
                  placeholder="Descricao do atendimento"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Abrir ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {selectedTicket ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
            <div className="max-h-[calc(100vh-2rem)] w-full max-w-6xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_32px_90px_rgba(15,23,42,0.16)]">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="crm-eyebrow">Detalhe do ticket</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(selectedTicket.status)}`}
                    >
                      {getStatusLabel(selectedTicket.status, !!isClient)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {ticketTypeLabels[selectedTicket.type]}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    {selectedTicket.subject}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {getClientName(selectedTicket)} | Aberto em{" "}
                    {formatDate(selectedTicket.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTicket(null);
                    setPropostas([]);
                  }}
                  className="rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_330px]">
                <div className="space-y-5">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <FileText className="h-4 w-4 text-slate-500" />
                      Dados vinculados
                    </h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                        <p className="font-semibold text-slate-950">Cliente</p>
                        <p className="mt-1">{getClientName(selectedTicket)}</p>
                        {selectedTicket.clientId ? (
                          <Link
                            href={`/clients/${selectedTicket.clientId}`}
                            className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-700"
                          >
                            Abrir cliente
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : null}
                      </div>

                      <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                        <p className="font-semibold text-slate-950">
                          Responsavel
                        </p>
                        <p className="mt-1">
                          {selectedTicket.assignedTo?.name ??
                            "Disponivel para atendimento"}
                        </p>
                      </div>

                      {selectedTicket.quote ? (
                        <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-950">
                            Cotacao
                          </p>
                          <p className="mt-1">
                            {selectedTicket.quote.origin} para{" "}
                            {selectedTicket.quote.destination}
                          </p>
                          <Link
                            href={`/quotes/${selectedTicket.quote.id}`}
                            className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-700"
                          >
                            Abrir cotacao
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      ) : null}

                      {selectedTicket.lead ? (
                        <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-950">Lead</p>
                          <p className="mt-1">{selectedTicket.lead.name}</p>
                          <p className="mt-1 text-xs">
                            {selectedTicket.lead.email ||
                              selectedTicket.lead.phone ||
                              "Sem contato informado"}
                          </p>
                        </div>
                      ) : null}

                      {selectedTicket.opportunity ? (
                        <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-950">
                            Oportunidade
                          </p>
                          <p className="mt-1">
                            {selectedTicket.opportunity.title}
                          </p>
                          <p className="mt-1 text-xs">
                            Etapa: {selectedTicket.opportunity.stage}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </section>

                  {propostas.length > 0 ? (
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <FileText className="h-4 w-4 text-slate-500" />
                        Propostas
                      </h3>
                      <div className="mt-3 space-y-3">
                        {propostas.map((proposta) => (
                          <div
                            key={proposta.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-950">
                                  v{proposta.versao} - {proposta.titulo}
                                </p>
                                <p className="mt-1 text-slate-500">
                                  {proposta.descricaoServico ||
                                    proposta.descricao ||
                                    "Sem descricao informada"}
                                </p>
                              </div>
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {propostaStatusLabels[proposta.status]}
                              </span>
                            </div>
                            <dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                              <div>
                                <dt className="font-semibold text-slate-700">
                                  Valor
                                </dt>
                                <dd>
                                  {proposta.valor
                                    ? Number(proposta.valor).toLocaleString(
                                        "pt-BR",
                                        { style: "currency", currency: "BRL" },
                                      )
                                    : "Nao informado"}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-semibold text-slate-700">
                                  Validade
                                </dt>
                                <dd>
                                  {proposta.validaAte
                                    ? formatDate(proposta.validaAte)
                                    : "Nao informada"}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-semibold text-slate-700">
                                  Envio
                                </dt>
                                <dd>
                                  {proposta.enviadaEm
                                    ? formatDate(proposta.enviadaEm)
                                    : "Nao enviada"}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <MessageSquare className="h-4 w-4 text-slate-500" />
                      Conversa
                    </h3>
                    <div className="mt-3 space-y-3">
                      {(selectedTicket.messages ?? []).map((message) => (
                        <div
                          key={message.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <MessageSquare className="h-4 w-4 text-slate-400" />
                              {message.senderType === "CLIENTE" ||
                              message.senderType === "CLIENT"
                                ? "Cliente"
                                : "Equipe interna"}
                              {message.isInternal ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                  <Lock className="h-3 w-3" />
                                  Interna
                                </span>
                              ) : null}
                            </div>
                            <span className="text-xs text-slate-400">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {message.message}
                          </p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleReply} className="mt-5 space-y-3">
                      <textarea
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        className="crm-textarea"
                        rows={4}
                        placeholder={
                          isClient
                            ? "Responder atendimento"
                            : "Responder ao cliente"
                        }
                      />
                      <button
                        type="submit"
                        disabled={saving || !reply.trim()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        <Send className="h-4 w-4" />
                        Enviar resposta
                      </button>
                    </form>
                  </section>

                  {isInternal ? (
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Lock className="h-4 w-4 text-slate-500" />
                        Observacao interna
                      </h3>
                      <form
                        onSubmit={handleInternalNote}
                        className="mt-3 space-y-3"
                      >
                        <textarea
                          value={internalNote}
                          onChange={(event) =>
                            setInternalNote(event.target.value)
                          }
                          className="crm-textarea bg-white"
                          rows={3}
                          placeholder="Visivel apenas para Comercial e Gestao"
                        />
                        <button
                          type="submit"
                          disabled={saving || !internalNote.trim()}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          Registrar observacao
                        </button>
                      </form>
                    </section>
                  ) : null}

                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <History className="h-4 w-4 text-slate-500" />
                      Historico
                    </h3>
                    <div className="mt-3 space-y-2">
                      {(selectedTicket.history ?? []).map((event) => (
                        <div
                          key={event.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {event.title}
                            </p>
                            <span className="text-xs text-slate-400">
                              {formatDate(event.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {event.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <aside className="space-y-4">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Acoes
                    </h3>

                    {isInternal ? (
                      <div className="mt-3 space-y-3">
                        <button
                          type="button"
                          disabled={
                            saving || isClosedStatus(selectedTicket.status)
                          }
                          onClick={() =>
                            token &&
                            executeTicketAction(
                              () => startTicket(selectedTicket.id, token),
                              "Atendimento iniciado.",
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Iniciar atendimento
                        </button>

                        <select
                          value={selectedTicket.status}
                          onChange={(event) =>
                            handleStatusChange(
                              selectedTicket,
                              event.target.value as TicketStatus,
                            )
                          }
                          className="crm-input bg-white"
                        >
                          {filterStatuses
                            .filter((status) => status !== "TODOS")
                            .map((status) => (
                              <option key={status} value={status}>
                                {getStatusLabel(status as TicketStatus, false)}
                              </option>
                            ))}
                        </select>
                      </div>
                    ) : null}

                    {isCommercial ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={preProposal}
                          onChange={(event) =>
                            setPreProposal(event.target.value)
                          }
                          className="crm-textarea bg-white"
                          rows={4}
                          placeholder="Pre-proposta ou pre-contrato"
                        />
                        <button
                          type="button"
                          disabled={saving || !preProposal.trim()}
                          onClick={() =>
                            token &&
                            executeTicketAction(
                              () =>
                                sendPreProposal(
                                  selectedTicket.id,
                                  { message: preProposal.trim() },
                                  token,
                                ),
                              "Pre-proposta enviada ao cliente.",
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                        >
                          <FileText className="h-4 w-4" />
                          Enviar pre-proposta
                        </button>

                        <button
                          type="button"
                          disabled={
                            saving ||
                            selectedTicket.status !== "APROVADO_CLIENTE"
                          }
                          onClick={() =>
                            token &&
                            executeTicketAction(
                              () =>
                                sendTicketToManagement(
                                  selectedTicket.id,
                                  {},
                                  token,
                                ),
                              "Negociacao enviada para Gestao.",
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Enviar para Gestao
                        </button>
                      </div>
                    ) : null}

                    {isClient &&
                    canClientAct(selectedTicket.status) &&
                    activeClientProposta ? (
                      <div className="mt-3 grid gap-2">
                        <textarea
                          value={proposalDecisionReason}
                          onChange={(event) =>
                            setProposalDecisionReason(event.target.value)
                          }
                          className="crm-textarea bg-white"
                          rows={3}
                          placeholder="Motivo para ajuste ou recusa"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            token &&
                            executePropostaAction(
                              () =>
                                approveTicketPropostaByClient(
                                  selectedTicket.id,
                                  activeClientProposta.id,
                                  token,
                                ),
                              "Proposta aprovada com sucesso.",
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          disabled={saving || !proposalDecisionReason.trim()}
                          onClick={() =>
                            token &&
                            executePropostaAction(
                              () =>
                                requestTicketPropostaAdjustmentByClient(
                                  selectedTicket.id,
                                  activeClientProposta.id,
                                  proposalDecisionReason.trim(),
                                  token,
                                ),
                              "Solicitacao de ajuste enviada com sucesso.",
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Solicitar ajuste
                        </button>
                        <button
                          type="button"
                          disabled={saving || !proposalDecisionReason.trim()}
                          onClick={() =>
                            token &&
                            executePropostaAction(
                              () =>
                                rejectTicketPropostaByClient(
                                  selectedTicket.id,
                                  activeClientProposta.id,
                                  proposalDecisionReason.trim(),
                                  token,
                                ),
                              "Proposta recusada com sucesso.",
                            )
                          }
                          className="flex items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <XCircle className="h-4 w-4" />
                          Recusar
                        </button>
                      </div>
                    ) : null}

                    {isManagement &&
                    selectedTicket.status === "AGUARDANDO_GESTAO" ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={managementMessage}
                          onChange={(event) =>
                            setManagementMessage(event.target.value)
                          }
                          className="crm-textarea bg-white"
                          rows={3}
                          placeholder="Observacao da Gestao"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            token &&
                            executeTicketAction(
                              () =>
                                managementTicketDecision(
                                  selectedTicket.id,
                                  {
                                    action: "APPROVE",
                                    message:
                                      managementMessage.trim() || undefined,
                                  },
                                  token,
                                ),
                              "Aprovacao da Gestao registrada.",
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            token &&
                            executeTicketAction(
                              () =>
                                managementTicketDecision(
                                  selectedTicket.id,
                                  {
                                    action: "REQUEST_ADJUSTMENT",
                                    message:
                                      managementMessage.trim() || undefined,
                                  },
                                  token,
                                ),
                              "Ajuste solicitado ao Comercial.",
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Solicitar ajuste
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            token &&
                            executeTicketAction(
                              () =>
                                managementTicketDecision(
                                  selectedTicket.id,
                                  {
                                    action: "REJECT",
                                    message:
                                      managementMessage.trim() || undefined,
                                  },
                                  token,
                                ),
                              "Reprovacao registrada.",
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <XCircle className="h-4 w-4" />
                          Reprovar
                        </button>
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <UserRound className="h-4 w-4 text-slate-500" />
                      Resumo
                    </h3>
                    <dl className="mt-3 space-y-3 text-sm">
                      <div>
                        <dt className="text-slate-500">Ultima atualizacao</dt>
                        <dd className="font-semibold text-slate-900">
                          {formatDate(
                            selectedTicket.lastInteractionAt ??
                              selectedTicket.updatedAt,
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Acao pendente</dt>
                        <dd className="font-semibold text-slate-900">
                          {selectedTicket.requiresActionRole ?? "Nenhuma"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Mensagens</dt>
                        <dd className="font-semibold text-slate-900">
                          {selectedTicket.messages?.length ?? 0}
                        </dd>
                      </div>
                    </dl>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <FeedbackToast
        open={!!toast}
        title={toast?.title ?? ""}
        message={toast?.message ?? ""}
        variant={toast?.variant ?? "success"}
        onClose={() => setToast(null)}
      />
    </AppLayout>
  );
}
