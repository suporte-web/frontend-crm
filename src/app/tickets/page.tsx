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
  Paperclip,
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
import { ChatBox } from "@/components/chat/ChatBox";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import { API_BASE_URL } from "@/services/api";
import { getCrmClientSummaries } from "@/services/crm.service";
import {
  addInternalTicketNote,
  createTicketProposta,
  createTicket,
  getAllTickets,
  getMyTickets,
  getTicket,
  getTicketPropostas,
  managementTicketDecision,
  approveTicketPropostaByClient,
  approveTicketPropostaByManagement,
  rejectTicketPropostaByClient,
  rejectTicketPropostaByManagement,
  replyTicket,
  requestTicketPropostaAdjustmentByClient,
  requestTicketPropostaAdjustmentByManagement,
  sendPreProposal,
  sendTicketPropostaToClient,
  sendTicketPropostaToManagement,
  sendTicketToManagement,
  startTicket,
  updateTicketStatus,
  updateTicketProposta,
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

const propostaEditableStatuses: StatusProposta[] = [
  "RASCUNHO",
  "AJUSTE_SOLICITADO_PELO_CLIENTE",
  "AJUSTE_SOLICITADO_PELA_GESTAO",
];

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

function formatCurrency(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "Nao informado";
  }

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatFileSize(value?: number | null) {
  if (!value) {
    return "";
  }

  if (value < 1024 * 1024) {
    return `${Math.ceil(value / 1024)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getUploadUrl(path?: string | null) {
  if (!path) {
    return "#";
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `${new URL(API_BASE_URL).origin}${path}`;
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

function getPropostaStatusClass(status: StatusProposta) {
  if (["APROVADA_PELO_CLIENTE", "APROVADA_PELA_GESTAO"].includes(status)) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (
    ["RECUSADA_PELO_CLIENTE", "RECUSADA_PELA_GESTAO", "CANCELADA"].includes(
      status,
    )
  ) {
    return "bg-rose-100 text-rose-700";
  }

  if (
    [
      "AJUSTE_SOLICITADO_PELO_CLIENTE",
      "AJUSTE_SOLICITADO_PELA_GESTAO",
    ].includes(status)
  ) {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "ENVIADA_PARA_GESTAO") {
    return "bg-indigo-100 text-indigo-700";
  }

  if (status === "ENVIADA_AO_CLIENTE") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
}

type ProposalFormState = {
  titulo: string;
  descricao: string;
  descricaoServico: string;
  origem: string;
  destino: string;
  valor: string;
  condicoesPagamento: string;
  condicoesComerciais: string;
  observacoes: string;
  validadeDias: string;
};

const emptyProposalFormState: ProposalFormState = {
  titulo: "",
  descricao: "",
  descricaoServico: "",
  origem: "",
  destino: "",
  valor: "",
  condicoesPagamento: "",
  condicoesComerciais: "",
  observacoes: "",
  validadeDias: "7",
};

function propostaToFormState(proposta?: Proposta | null): ProposalFormState {
  if (!proposta) {
    return emptyProposalFormState;
  }

  return {
    titulo: proposta.titulo ?? "",
    descricao: proposta.descricao ?? "",
    descricaoServico: proposta.descricaoServico ?? "",
    origem: proposta.origem ?? "",
    destino: proposta.destino ?? "",
    valor:
      proposta.valor !== null && proposta.valor !== undefined
        ? String(proposta.valor)
        : "",
    condicoesPagamento: proposta.condicoesPagamento ?? "",
    condicoesComerciais: proposta.condicoesComerciais ?? "",
    observacoes: proposta.observacoes ?? "",
    validadeDias:
      proposta.validadeDias !== null && proposta.validadeDias !== undefined
        ? String(proposta.validadeDias)
        : "7",
  };
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
  const [selectedPropostaId, setSelectedPropostaId] = useState("");
  const [proposalForm, setProposalForm] = useState<ProposalFormState>(
    emptyProposalFormState,
  );
  const [proposalFile, setProposalFile] = useState<File | null>(null);
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
  const selectedProposta = useMemo(() => {
    if (selectedPropostaId === "new") {
      return null;
    }

    return (
      propostas.find((proposta) => proposta.id === selectedPropostaId) ??
      propostas[0] ??
      null
    );
  }, [propostas, selectedPropostaId]);
  const activeClientProposta = useMemo(
    () =>
      propostas.find((proposta) => proposta.status === "ENVIADA_AO_CLIENTE") ??
      propostas[0] ??
      null,
    [propostas],
  );
  const canSendCurrentProposalToManagement =
    isCommercial &&
    (selectedTicket?.status === "APROVADO_CLIENTE" ||
      (!!selectedProposta &&
        selectedProposta.status === "APROVADA_PELO_CLIENTE"));
  const canEditSelectedProposal =
    isCommercial &&
    (selectedPropostaId === "new" ||
      !selectedProposta ||
      propostaEditableStatuses.includes(selectedProposta.status));

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

  useEffect(() => {
    if (selectedPropostaId === "new") {
      setProposalFile(null);
      return;
    }

    const proposta = propostas.find((item) => item.id === selectedPropostaId);
    const fallback = proposta ?? propostas[0] ?? null;

    if (!fallback) {
      setSelectedPropostaId("");
      setProposalForm(emptyProposalFormState);
      return;
    }

    if (!proposta) {
      setSelectedPropostaId(fallback.id);
    }

    setProposalForm(propostaToFormState(fallback));
    setProposalFile(null);
  }, [propostas, selectedPropostaId]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      if (!query) {
        return true;
      }

      return [
        ticket.id,
        ticket.subject,
        ticket.description,
        getClientName(ticket),
        ticket.quote?.code,
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
    setProposalFile(null);
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

  async function reloadSelectedTicketData(ticketId: string) {
    if (!token) {
      return;
    }

    const [updatedTicket, updatedPropostas] = await Promise.all([
      getTicket(ticketId, token),
      getTicketPropostas(ticketId, token),
    ]);

    await refreshSelected(updatedTicket);
    setPropostas(updatedPropostas);
  }

  function buildProposalPayload() {
    return {
      titulo: proposalForm.titulo.trim(),
      descricao: proposalForm.descricao.trim() || undefined,
      descricaoServico: proposalForm.descricaoServico.trim() || undefined,
      origem: proposalForm.origem.trim() || undefined,
      destino: proposalForm.destino.trim() || undefined,
      valor: proposalForm.valor.trim()
        ? Number(proposalForm.valor.replace(",", "."))
        : undefined,
      condicoesPagamento: proposalForm.condicoesPagamento.trim() || undefined,
      condicoesComerciais: proposalForm.condicoesComerciais.trim() || undefined,
      observacoes: proposalForm.observacoes.trim() || undefined,
      validadeDias: proposalForm.validadeDias.trim()
        ? Number(proposalForm.validadeDias)
        : undefined,
    };
  }

  async function handleProposalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !selectedTicket || !proposalForm.titulo.trim()) {
      setToast({
        title: "Dados incompletos",
        message: "Informe pelo menos o titulo da proposta.",
        variant: "error",
      });
      return;
    }

    if (!canEditSelectedProposal) {
      setToast({
        title: "Edicao bloqueada",
        message:
          "O valor so pode ser ajustado em rascunho ou quando cliente/Gestao solicitarem ajuste.",
        variant: "error",
      });
      return;
    }

    const payload = buildProposalPayload();

    try {
      setSaving(true);

      const proposta =
        selectedPropostaId === "new" || !selectedProposta
          ? await createTicketProposta(
              selectedTicket.id,
              payload,
              token,
              proposalFile,
            )
          : await updateTicketProposta(
              selectedTicket.id,
              selectedProposta.id,
              payload,
              token,
              proposalFile,
            );

      await reloadSelectedTicketData(selectedTicket.id);
      setSelectedPropostaId(proposta.id);
      setProposalFile(null);
      setToast({
        title:
          selectedPropostaId === "new" || !selectedProposta
            ? "Proposta criada"
            : "Proposta atualizada",
        message:
          selectedPropostaId === "new" || !selectedProposta
            ? "A proposta foi registrada no ticket."
            : "As alteracoes da proposta foram salvas.",
        variant: "success",
      });
    } catch (error) {
      setToast({
        title: "Falha ao salvar proposta",
        message:
          error instanceof Error ? error.message : "Erro ao salvar proposta.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendProposalToClient() {
    if (!token || !selectedTicket || !selectedProposta) {
      return;
    }

    try {
      setSaving(true);
      const result = await sendTicketPropostaToClient(
        selectedTicket.id,
        selectedProposta.id,
        token,
        buildProposalPayload(),
      );
      await reloadSelectedTicketData(selectedTicket.id);
      setToast({
        title: "Proposta enviada",
        message: result.mensagem || "A proposta foi enviada ao cliente.",
        variant: "success",
      });
    } catch (error) {
      setToast({
        title: "Falha ao enviar proposta",
        message:
          error instanceof Error ? error.message : "Erro ao enviar proposta.",
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
              placeholder="Buscar por assunto, ID, codigo da cotacao, cliente, lead ou oportunidade"
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
                          {ticket.quote.code || "Cotacao vinculada"}
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
                    setSelectedPropostaId("");
                    setProposalForm(emptyProposalFormState);
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

                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <FileText className="h-4 w-4 text-slate-500" />
                          Pre-contrato / Proposta
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Comercial monta e envia a proposta. Cliente visualiza
                          e responde. Gestao revisa valores e trecho quando a
                          negociacao segue para aprovacao.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {propostas.length > 0 ? (
                          <select
                            value={selectedPropostaId || propostas[0]?.id || ""}
                            onChange={(event) =>
                              setSelectedPropostaId(event.target.value)
                            }
                            className="crm-input min-w-[220px] bg-white"
                          >
                            {propostas.map((proposta) => (
                              <option key={proposta.id} value={proposta.id}>
                                {proposta.code} | v{proposta.versao} |{" "}
                                {proposta.titulo}
                              </option>
                            ))}
                          </select>
                        ) : null}

                        {isCommercial ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPropostaId("new");
                              setProposalFile(null);
                              setProposalForm({
                                ...emptyProposalFormState,
                                titulo: selectedTicket.quote
                                  ? `Proposta ${selectedTicket.quote.serviceType}`
                                  : "",
                                origem: selectedTicket.quote?.origin ?? "",
                                destino:
                                  selectedTicket.quote?.destination ?? "",
                                valor:
                                  selectedTicket.quote?.price !== null &&
                                  selectedTicket.quote?.price !== undefined
                                    ? String(selectedTicket.quote.price)
                                    : "",
                              });
                            }}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Nova proposta
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {selectedProposta ? (
                      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
                        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                                  {selectedProposta.code} · v
                                  {selectedProposta.versao}
                                </p>
                                <h4 className="mt-2 text-xl font-semibold">
                                  {selectedProposta.titulo}
                                </h4>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-white/40 ${getPropostaStatusClass(selectedProposta.status)}`}
                              >
                                {propostaStatusLabels[selectedProposta.status]}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="grid gap-4 border-b border-slate-100 bg-slate-50 p-5 sm:grid-cols-3">
                              <div className="sm:col-span-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Valor negociado
                                </p>
                                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                                  {formatCurrency(selectedProposta.valor)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Origem
                                </p>
                                <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                                  {selectedProposta.origem || "Nao informada"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Destino
                                </p>
                                <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                                  {selectedProposta.destino || "Nao informado"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Validade
                                </p>
                                <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                                  {selectedProposta.validaAte
                                    ? formatDate(selectedProposta.validaAte)
                                    : selectedProposta.validadeDias
                                      ? `${selectedProposta.validadeDias} dia(s)`
                                      : "Nao informada"}
                                </p>
                              </div>
                            </div>

                            <div className="p-5">
                              <div className="grid gap-4 2xl:grid-cols-2">
                                <section className="rounded-2xl border border-slate-200 bg-white p-4 2xl:col-span-2">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    Servico
                                  </p>
                                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                    {selectedProposta.descricaoServico ||
                                      selectedProposta.descricao ||
                                      "Sem descricao detalhada informada."}
                                  </p>
                                </section>
                                <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                  <p className="text-sm font-semibold text-slate-950">
                                    Condicoes comerciais
                                  </p>
                                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                    {selectedProposta.condicoesComerciais ||
                                      "Nao informadas"}
                                  </p>
                                </section>
                                <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                  <p className="text-sm font-semibold text-slate-950">
                                    Pagamento
                                  </p>
                                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                    {selectedProposta.condicoesPagamento ||
                                      "Pagamento nao informado"}
                                  </p>
                                </section>
                              </div>

                              {selectedProposta.observacoes ||
                              selectedProposta.motivoRecusaCliente ? (
                                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                                  <p className="font-semibold text-slate-950">
                                    Observacoes
                                  </p>
                                  {selectedProposta.observacoes ? (
                                    <p className="mt-2 whitespace-pre-wrap leading-6">
                                      {selectedProposta.observacoes}
                                    </p>
                                  ) : null}
                                  {selectedProposta.motivoRecusaCliente ? (
                                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-rose-50 px-3 py-2 leading-6 text-rose-700">
                                      Recusa do cliente:{" "}
                                      {selectedProposta.motivoRecusaCliente}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}

                              {selectedProposta.arquivoUrl ? (
                                <a
                                  href={getUploadUrl(
                                    selectedProposta.arquivoUrl,
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    {selectedProposta.arquivoNome ||
                                      "Arquivo da proposta"}
                                  </span>
                                  <span className="text-xs font-medium text-blue-600">
                                    {formatFileSize(
                                      selectedProposta.arquivoTamanho,
                                    )}
                                  </span>
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </article>

                        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <p className="text-sm font-semibold text-slate-900">
                            Linha de aprovacao
                          </p>
                          <div className="mt-5 space-y-4 text-sm">
                            {[
                              ["Cliente", getClientName(selectedTicket)],
                              [
                                "Enviada ao cliente",
                                selectedProposta.enviadaEm
                                  ? formatDate(selectedProposta.enviadaEm)
                                  : "Ainda nao enviada",
                              ],
                              [
                                "Resposta do cliente",
                                selectedProposta.aprovadaPeloClienteEm
                                  ? formatDate(
                                      selectedProposta.aprovadaPeloClienteEm,
                                    )
                                  : selectedProposta.recusadaPeloClienteEm
                                    ? formatDate(
                                        selectedProposta.recusadaPeloClienteEm,
                                      )
                                    : "Pendente",
                              ],
                              [
                                "Gestao",
                                selectedProposta.status ===
                                "APROVADA_PELA_GESTAO"
                                  ? "Aprovada"
                                  : selectedProposta.status ===
                                      "RECUSADA_PELA_GESTAO"
                                    ? "Recusada"
                                    : selectedTicket.status ===
                                          "AGUARDANDO_GESTAO" ||
                                        selectedProposta.status ===
                                          "ENVIADA_PARA_GESTAO"
                                      ? "Em analise"
                                      : "Nao iniciada",
                              ],
                            ].map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                              >
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  {label}
                                </p>
                                <p className="mt-1 font-semibold text-slate-950">
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </article>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                        Nenhuma proposta formal criada para este ticket ainda.
                      </div>
                    )}

                    {isCommercial ? (
                      <form
                        onSubmit={handleProposalSubmit}
                        className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {selectedPropostaId === "new" || !selectedProposta
                                ? "Criar proposta"
                                : `Editar ${selectedProposta.code}`}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Monte o pre-contrato com valores, trecho e
                              condicoes antes de enviar ao cliente.
                            </p>
                          </div>
                          {selectedProposta ? (
                            <button
                              type="button"
                              disabled={
                                saving ||
                                ![
                                  "RASCUNHO",
                                  "AJUSTE_SOLICITADO_PELO_CLIENTE",
                                  "AJUSTE_SOLICITADO_PELA_GESTAO",
                                ].includes(selectedProposta.status)
                              }
                              onClick={handleSendProposalToClient}
                              className="rounded-2xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
                            >
                              Enviar ao cliente
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <input
                            value={proposalForm.titulo}
                            onChange={(event) =>
                              setProposalForm((current) => ({
                                ...current,
                                titulo: event.target.value,
                              }))
                            }
                            className="crm-input"
                            placeholder="Titulo da proposta"
                          />
                          <input
                            value={proposalForm.valor}
                            onChange={(event) =>
                              setProposalForm((current) => ({
                                ...current,
                                valor: event.target.value,
                              }))
                            }
                            className="crm-input"
                            placeholder="Valor total em R$"
                          />
                          <input
                            value={proposalForm.origem}
                            onChange={(event) =>
                              setProposalForm((current) => ({
                                ...current,
                                origem: event.target.value,
                              }))
                            }
                            className="crm-input"
                            placeholder="Origem"
                          />
                          <input
                            value={proposalForm.destino}
                            onChange={(event) =>
                              setProposalForm((current) => ({
                                ...current,
                                destino: event.target.value,
                              }))
                            }
                            className="crm-input"
                            placeholder="Destino"
                          />
                          <input
                            value={proposalForm.validadeDias}
                            onChange={(event) =>
                              setProposalForm((current) => ({
                                ...current,
                                validadeDias: event.target.value,
                              }))
                            }
                            className="crm-input"
                            placeholder="Validade em dias"
                          />
                          <input
                            value={proposalForm.condicoesPagamento}
                            onChange={(event) =>
                              setProposalForm((current) => ({
                                ...current,
                                condicoesPagamento: event.target.value,
                              }))
                            }
                            className="crm-input"
                            placeholder="Condicoes de pagamento"
                          />
                        </div>

                        <textarea
                          value={proposalForm.descricaoServico}
                          onChange={(event) =>
                            setProposalForm((current) => ({
                              ...current,
                              descricaoServico: event.target.value,
                            }))
                          }
                          className="crm-textarea mt-3"
                          rows={3}
                          placeholder="Descricao do servico"
                        />
                        <textarea
                          value={proposalForm.condicoesComerciais}
                          onChange={(event) =>
                            setProposalForm((current) => ({
                              ...current,
                              condicoesComerciais: event.target.value,
                            }))
                          }
                          className="crm-textarea mt-3"
                          rows={3}
                          placeholder="Condicoes comerciais"
                        />
                        <textarea
                          value={proposalForm.observacoes}
                          onChange={(event) =>
                            setProposalForm((current) => ({
                              ...current,
                              observacoes: event.target.value,
                            }))
                          }
                          className="crm-textarea mt-3"
                          rows={3}
                          placeholder="Observacoes do pre-contrato"
                        />

                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                            <span className="inline-flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-slate-500" />
                              Arquivo da proposta
                            </span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                              disabled={!canEditSelectedProposal || saving}
                              onChange={(event) =>
                                setProposalFile(event.target.files?.[0] ?? null)
                              }
                              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                            />
                          </label>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {proposalFile ? (
                              <span>{proposalFile.name}</span>
                            ) : selectedProposta?.arquivoUrl ? (
                              <a
                                href={getUploadUrl(selectedProposta.arquivoUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-blue-700"
                              >
                                {selectedProposta.arquivoNome ||
                                  "Arquivo atual"}
                              </a>
                            ) : (
                              <span>Nenhum arquivo anexado.</span>
                            )}
                          </div>
                        </div>

                        {!canEditSelectedProposal ? (
                          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Edicao bloqueada. Para alterar valor ou arquivo, o
                            cliente precisa solicitar ajuste ou receber uma nova
                            versao para aprovar.
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          {selectedPropostaId === "new" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPropostaId(propostas[0]?.id ?? "");
                                setProposalFile(null);
                                setProposalForm(
                                  propostaToFormState(propostas[0] ?? null),
                                );
                              }}
                              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Cancelar
                            </button>
                          ) : null}
                          <button
                            type="submit"
                            disabled={saving || !canEditSelectedProposal}
                            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                          >
                            {saving
                              ? "Salvando..."
                              : selectedPropostaId === "new" ||
                                  !selectedProposta
                                ? "Criar proposta"
                                : "Salvar proposta"}
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <MessageSquare className="h-4 w-4 text-slate-500" />
                        Conversa
                      </h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {selectedTicket.messages?.length ?? 0} mensagem(ns)
                      </span>
                    </div>
                    <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3">
                      {(selectedTicket.messages ?? []).length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                          Nenhuma mensagem registrada neste ticket.
                        </div>
                      ) : null}

                      {(selectedTicket.messages ?? []).map((message) => {
                        const isClientMessage =
                          message.senderType === "CLIENTE" ||
                          message.senderType === "CLIENT";

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isClientMessage ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`w-full max-w-3xl rounded-2xl border p-4 ${
                                message.isInternal
                                  ? "border-amber-200 bg-amber-50"
                                  : isClientMessage
                                    ? "border-slate-200 bg-white"
                                    : "border-blue-200 bg-blue-50"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                                  <MessageSquare className="h-4 w-4 text-slate-400" />
                                  {isClientMessage
                                    ? "Cliente"
                                    : "Comercial / interno"}
                                  {message.createdBy?.name ? (
                                    <span className="text-xs font-medium text-slate-500">
                                      {message.createdBy.name}
                                    </span>
                                  ) : null}
                                  {message.isInternal ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs text-amber-700">
                                      <Lock className="h-3 w-3" />
                                      Interna
                                    </span>
                                  ) : null}
                                </div>
                                <span className="text-xs text-slate-400">
                                  {formatDate(message.createdAt)}
                                </span>
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {message.message}
                              </p>
                              {message.attachments?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.attachments.map(
                                    (attachment, index) =>
                                      attachment.url ? (
                                        <a
                                          key={`${attachment.url}-${index}`}
                                          href={getUploadUrl(attachment.url)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                          <Paperclip className="h-3.5 w-3.5" />
                                          {attachment.name || "Anexo"}
                                        </a>
                                      ) : null,
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
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

                  <ChatBox
                    entityType="TICKET"
                    entityId={selectedTicket.id}
                    title={selectedTicket.subject}
                  />

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
                            saving || !canSendCurrentProposalToManagement
                          }
                          onClick={() =>
                            token &&
                            (selectedProposta
                              ? executePropostaAction(
                                  () =>
                                    sendTicketPropostaToManagement(
                                      selectedTicket.id,
                                      selectedProposta.id,
                                      token,
                                    ),
                                  "Proposta enviada para Gestao.",
                                )
                              : executeTicketAction(
                                  () =>
                                    sendTicketToManagement(
                                      selectedTicket.id,
                                      {},
                                      token,
                                    ),
                                  "Negociacao enviada para Gestao.",
                                ))
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Enviar para Gestao
                        </button>
                        {selectedProposta ? (
                          <p className="text-xs leading-5 text-slate-500">
                            A proposta {selectedProposta.code} precisa estar
                            aprovada pelo cliente para seguir para a Gestao.
                          </p>
                        ) : null}
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
                          disabled={
                            saving ||
                            (selectedProposta?.status ===
                              "ENVIADA_PARA_GESTAO" &&
                              !managementMessage.trim())
                          }
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
                          disabled={
                            saving ||
                            (selectedProposta?.status ===
                              "ENVIADA_PARA_GESTAO" &&
                              !managementMessage.trim())
                          }
                          onClick={() =>
                            token &&
                            (selectedProposta?.status === "ENVIADA_PARA_GESTAO"
                              ? executePropostaAction(
                                  () =>
                                    approveTicketPropostaByManagement(
                                      selectedTicket.id,
                                      selectedProposta.id,
                                      token,
                                    ),
                                  "Aprovacao da Gestao registrada.",
                                )
                              : executeTicketAction(
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
                                ))
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
                            (selectedProposta?.status === "ENVIADA_PARA_GESTAO"
                              ? executePropostaAction(
                                  () =>
                                    requestTicketPropostaAdjustmentByManagement(
                                      selectedTicket.id,
                                      selectedProposta.id,
                                      managementMessage.trim(),
                                      token,
                                    ),
                                  "Ajuste solicitado ao Comercial.",
                                )
                              : executeTicketAction(
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
                                ))
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
                            (selectedProposta?.status === "ENVIADA_PARA_GESTAO"
                              ? executePropostaAction(
                                  () =>
                                    rejectTicketPropostaByManagement(
                                      selectedTicket.id,
                                      selectedProposta.id,
                                      managementMessage.trim(),
                                      token,
                                    ),
                                  "Reprovacao registrada.",
                                )
                              : executeTicketAction(
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
                                ))
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                        >
                          <XCircle className="h-4 w-4" />
                          Reprovar
                        </button>
                        {selectedProposta?.status === "ENVIADA_PARA_GESTAO" ? (
                          <p className="text-xs leading-5 text-slate-500">
                            A decisao formal da Gestao sobre a proposta cai
                            apenas para o Comercial neste fluxo.
                          </p>
                        ) : null}
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
