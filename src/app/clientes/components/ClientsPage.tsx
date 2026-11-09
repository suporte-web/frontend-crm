"use client";

import { getCadastrosResumos as getCrmClientSummaries, criarCadastro, type ModalidadeCadastro } from "@/services/cadastros.service";

import { IdentificacaoProspeccao } from "@/components/crm/prospeccao-consultora";
import { CamposComplementaresCadastro } from "@/components/cadastros/campos-complementares-cadastro";
import { type LeadFunnelStage } from "@/constants/lead-funnel";
import { hasAnyRole } from "@/lib/user-roles";
import { useCnpjLookup } from "@/hooks/use-cnpj-lookup";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  CrmKpiCard,
  CrmPageShell,
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";

import {
  ClientForm,
  emptyClientContact,
  type ClientContactForm,
  type ClientFormData,
} from "@/components/clientes/client-form";
import {
  Download,
  ArrowRight,
  PlusCircle,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import {
  decideClientDeletionRequest,
  getClientDeletionRequests,
  requestClientDeletion,
  uploadClientDocuments,
} from "@/services/crm.service";
import { formatLeadStatus } from "@/services/crm.service";
import type {
  ClientDeletionRequest,
  ClientDeletionRequestStatus,
  LeadStatus,
  LeadSummary,
} from "@/types/crm";

const statusStyles: Record<LeadStatus, object> = {
  ATIVO: {
    bgcolor: "#ecfdf5",
    color: "#047857",
    borderColor: "#bbf7d0",
  },
  PENDENTE: {
    bgcolor: "#fffbeb",
    color: "#b45309",
    borderColor: "#fde68a",
  },
  INATIVO: {
    bgcolor: "#fef2f2",
    color: "#b91c1c",
    borderColor: "#fecaca",
  },
};

function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

const initialClientForm: ClientFormData = {
  companyName: "",
  legalName: "",
  tradeName: "",
  phone: "",
  document: "",
  cnae: "",
  stateRegistration: "",
  businessActivity: "",
  taxRegime: "",
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  address: "",
  bankDetails: "",
  modality: "",
  registrationDate: todayDateValue(),
  segment: "",
  notes: "",
  status: "PENDENTE" as LeadStatus,
};

const deletionStatusLabels: Record<ClientDeletionRequestStatus, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  CANCELADA: "Cancelada",
};

const deletionStatusStyles: Record<ClientDeletionRequestStatus, object> = {
  PENDENTE: {
    bgcolor: "#fffbeb",
    color: "#b45309",
    borderColor: "#fde68a",
  },
  APROVADA: {
    bgcolor: "#ecfdf5",
    color: "#047857",
    borderColor: "#bbf7d0",
  },
  RECUSADA: {
    bgcolor: "#fef2f2",
    color: "#b91c1c",
    borderColor: "#fecaca",
  },
  CANCELADA: {
    bgcolor: "#f8fafc",
    color: "#475569",
    borderColor: "#e2e8f0",
  },
};

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 36,
    borderRadius: "8px",
    bgcolor: "#ffffff",
  },

  "& .MuiInputBase-input": {
    py: "7px",
    fontSize: 13,
  },

  "& .MuiInputBase-inputMultiline": {
    py: 0,
  },

  "& .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 700,
  },
};

const filterFieldSx = {
  width: '100%', minWidth: 0,
  '& .MuiOutlinedInput-root': { height: 40, borderRadius: '8px', bgcolor: '#fff', '& fieldset': { borderColor: '#cbd5e1' }, '&.Mui-focused fieldset': { borderColor: '#ff5805' } },
  '& .MuiInputLabel-root': { fontSize: 13, fontWeight: 400 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#ff5805' },
  '& .MuiInputBase-input, & .MuiSelect-select': { fontSize: 13.5, fontWeight: 400 },
};

const superficieCadastrosSx = { p: { xs: 2, md: 2.5 }, minWidth: 0, border: '1px solid #e2e8f0', borderRadius: '12px', bgcolor: '#fff', boxShadow: 'none' };
const acaoCadastroSx = { height: 40, minHeight: 40, minWidth: 0, px: 1.5, borderRadius: '8px', fontSize: 13, fontWeight: 600, lineHeight: 1.3, textTransform: 'none', whiteSpace: 'nowrap', boxShadow: 'none' };
const acaoSecundariaCadastroSx = { ...acaoCadastroSx, color: '#475569', borderColor: '#cbd5e1', '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' } };

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function buildFullAddress(formData: {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}) {
  const streetAndNumber = [formData.street.trim(), formData.number.trim()]
    .filter(Boolean)
    .join(", ");

  const cityAndState = [formData.city.trim(), formData.state.trim()]
    .filter(Boolean)
    .join(" - ");

  return [
    streetAndNumber,
    formData.complement.trim(),
    formData.neighborhood.trim(),
    cityAndState,
    formData.zipCode.trim() ? `CEP: ${formData.zipCode.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(date));
}

function getClientInitial(client: LeadSummary) {
  return (client.company || client.name || client.email || "C")
    .trim()
    .charAt(0)
    .toUpperCase();
}

function getClientDisplayName(client: LeadSummary) {
  return (
    client.tradeName ||
    client.company ||
    client.name ||
    client.email ||
    "Cliente"
  ).trim();
}

function exportClients(clients: LeadSummary[]) {
  const headers = [
    "Cliente",
    "Email",
    "Empresa",
    "CNPJ",
    "Telefone",
    "Segmento",
    "Responsável",
    "Status",
    "Criado em",
  ];
  const csv = [
    headers,
    ...clients.map((client) => [
      client.name,
      client.email,
      client.company,
      client.document ?? "",
      client.phone ?? "",
      client.segment,
      client.owner,
      client.status,
      formatDate(client.createdAt),
    ]),
  ]
    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";"),
    )
    .join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ClientsPage() {
  const { token, user } = useAuth();
  const [clients, setClients] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("");
  const [responsavelFiltro, setResponsavelFiltro] = useState("");
  const [modalidadeNovo, setModalidadeNovo] = useState<ModalidadeCadastro>("CLIENTE");
  const [etapaNovo, setEtapaNovo] = useState<LeadFunnelStage>("venda_efetivada");
  const [fotoNovo, setFotoNovo] = useState("");
  const [comerciaisNovo, setComerciaisNovo] = useState({ proximaAcao: "", responsavel: "", volumeMensalEstimado: "" });
  const [statusFilter, setStatusFilter] = useState<"TODOS" | LeadStatus>(
    "TODOS",
  );
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deletionRequests, setDeletionRequests] = useState<
    ClientDeletionRequest[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletionModalClient, setDeletionModalClient] =
    useState<LeadSummary | null>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [decisionRequest, setDecisionRequest] =
    useState<ClientDeletionRequest | null>(null);
  const [decisionMessage, setDecisionMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialClientForm);
  const { searchingCnpj, cnpjError, searchCnpj: handleSearchCnpj, clearCnpjError } = useCnpjLookup(token, form, setForm);
  const [contacts, setContacts] = useState<ClientContactForm[]>([
    emptyClientContact(),
  ]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const canDeleteDirectly = hasAnyRole(user, ["ADMIN", "GESTAO", "COMERCIAL"]);
  const canDecideDeletion = ["ADMIN", "GESTAO", "COMERCIAL"].includes(user?.role ?? "");
  const canManageClients = user?.role
    ? hasAnyRole(user, ["ADMIN", "GESTAO", "COMERCIAL", "CONSULTORA"])
    : false;

  async function loadClients() {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPageError("");
      const [data, requests] = await Promise.all([
        getCrmClientSummaries(token, user?.role === 'CONSULTORA'),
        canManageClients && user?.role !== 'CONSULTORA'
          ? getClientDeletionRequests(token).catch(() => [])
          : Promise.resolve([]),
      ]);
      setClients(data);
      setDeletionRequests(requests);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Erro ao carregar clientes.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, [token, canManageClients]);

  const responsaveisDisponiveis = useMemo(
    () => Array.from(new Set(clients.map((client) => client.responsavel?.trim() || "Sem responsável")))
      .filter(Boolean)
      .sort((primeiro, segundo) => primeiro.localeCompare(segundo, "pt-BR", { sensitivity: "base" })),
    [clients],
  );

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients
      .filter((client) => {
        const matchesStatus =
          statusFilter === "TODOS" || client.status === statusFilter;
        const matchesSearch =
          !query ||
          [
            client.name,
            client.email,
            client.company,
            client.document,
            client.phone,
            client.segment,
            client.owner,
            client.responsavel,
            client.city,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchesStatus && matchesSearch
          && (!modalidadeFiltro || client.modalidadeCadastro === modalidadeFiltro)
          && (!responsavelFiltro || (client.responsavel?.trim() || "Sem responsável") === responsavelFiltro);
      })
      .sort((first, second) =>
        getClientDisplayName(first).localeCompare(
          getClientDisplayName(second),
          "pt-BR",
          { sensitivity: "base" },
        ),
      );
  }, [clients, search, statusFilter, modalidadeFiltro, responsavelFiltro]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredClients.length / rowsPerPage),
  );

  const paginatedClients = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return filteredClients.slice(start, start + rowsPerPage);
  }, [filteredClients, page, rowsPerPage]);

  const paginationStart =
    filteredClients.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;

  const paginationEnd = Math.min(
    page * rowsPerPage,
    filteredClients.length,
  );

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage, search, statusFilter, modalidadeFiltro, responsavelFiltro]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const summary = useMemo(() => {
    const active = clients.filter((client) => client.status === "ATIVO" && client.modalidadeCadastro !== "LEAD").length;
    const pending = clients.filter(
      (client) => client.status === "PENDENTE",
    ).length;
    const month = new Date().toISOString().slice(0, 7);
    const newThisMonth = clients.filter((client) =>
      client.createdAt.startsWith(month),
    ).length;

    return {
      total: clients.length,
      active,
      pending,
      newThisMonth,
    };
  }, [clients]);

  const pendingDeletionRequests = useMemo(
    () => deletionRequests.filter((request) => request.status === "PENDENTE"),
    [deletionRequests],
  );

  const pendingDeletionByClientId = useMemo(
    () =>
      new Map(
        deletionRequests
          .filter(
            (request) => request.status === "PENDENTE" && request.clientId,
          )
          .map((request) => [request.clientId as string, request]),
      ),
    [deletionRequests],
  );

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const displayName =
      form.tradeName.trim() ||
      form.legalName.trim() ||
      form.companyName.trim() ||
      form.document.trim();

    if (!displayName) {
      setToast({
        title: "Campos obrigatórios",
        message: "Informe razão social, nome fantasia, empresa ou CNPJ.",
        variant: "error",
      });
      return;
    }

    const validContacts = contacts
      .map((contact) => ({
        name: contact.name.trim(),
        role: contact.role.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        notes: contact.notes.trim(),
      }))
      .filter(
        (contact) =>
          contact.name ||
          contact.role ||
          contact.email ||
          contact.phone ||
          contact.notes,
      )
      .map((contact, index) => ({
        name: contact.name || undefined,
        role: contact.role || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        notes: contact.notes || undefined,
        isPrimary: index === 0,
      }));

    const primaryContact = validContacts[0];

    const fullAddress = buildFullAddress({
      street: form.street,
      number: form.number,
      complement: form.complement,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      zipCode: form.zipCode,
    });

    if (!token) {
      setToast({
        title: "Sessão expirada",
        message: "Faça login novamente para cadastrar o cliente.",
        variant: "error",
      });
      return;
    }

    try {
      setSaving(true);
      const createdClient = await criarCadastro(
        {
          name: displayName,
          notes: form.notes.trim() || undefined,
          address: fullAddress || form.address.trim() || undefined,
          companyName:
            form.companyName.trim() ||
            form.tradeName.trim() ||
            form.legalName.trim() ||
            displayName,
          legalName: form.legalName.trim() || undefined,
          tradeName: form.tradeName.trim() || undefined,
          phone: primaryContact?.phone || form.phone.trim() || undefined,
          document: form.document.trim() || undefined,
          cnae: form.cnae.trim() || undefined,
          stateRegistration: form.stateRegistration.trim() || undefined,
          businessActivity: form.businessActivity.trim() || undefined,
          taxRegime: form.taxRegime.trim() || undefined,
          city: form.city.trim() || undefined,
          bankDetails: form.bankDetails.trim() || undefined,
          modality: form.modality.trim() || undefined,
          registrationDate: form.registrationDate || undefined,
          segment:
            form.segment.trim() || form.businessActivity.trim() || undefined,
          status: form.status,
          etapaFunil: etapaNovo,
          fotoUrl: fotoNovo,
          ...comerciaisNovo,
          internalOwnerId: user?.id,
          contacts: validContacts,
        },
        token,
        modalidadeNovo,
      );

      const clientId =
        createdClient.clientProfile?.id ??
        createdClient.client?.id ??
        createdClient.id;

      let documentUploadFailed = false;

      if (documentFiles.length > 0) {
        if (!clientId) {
          documentUploadFailed = true;
        } else {
          try {
            await uploadClientDocuments(
              clientId,
              documentFiles,
              token,
              "Documento cadastral",
            );
          } catch {
            documentUploadFailed = true;
          }
        }
      }

      setToast({
        title: documentUploadFailed
          ? "Cadastro criado com aviso"
          : "Cadastro criado",
        message: documentUploadFailed
          ? "O cliente foi criado, mas um ou mais documentos não foram anexados."
          : "Novo cadastro registrado na base com os documentos.",
        variant: documentUploadFailed ? "error" : "success",
      });

      setForm(initialClientForm);
      setFotoNovo("");
      setComerciaisNovo({ proximaAcao: "", responsavel: "", volumeMensalEstimado: "" });
      setContacts([emptyClientContact()]);
      setDocumentFiles([]);
      setIsModalOpen(false);
      await loadClients();
    } catch (error) {
      setToast({
        title: "Falha ao criar cliente",
        message:
          error instanceof Error ? error.message : "Erro ao criar cliente.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestDeletion(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token || !deletionModalClient) {
      return;
    }

    try {
      setSaving(true);
      const result = await requestClientDeletion(
        deletionModalClient.id,
        { reason: deletionReason.trim() || undefined },
        token,
      );
      setToast({
        title: result.status === "APROVADA" ? "Cliente excluído" : "Solicitação enviada",
        message: result.status === "APROVADA"
          ? "Cliente excluído com sucesso."
          : "A exclusão do cliente foi enviada para aprovação do Comercial ou Gestão.",
        variant: "success",
      });
      setDeletionModalClient(null);
      setDeletionReason("");
      await loadClients();
    } catch (error) {
      setToast({
        title: canDeleteDirectly ? "Falha ao excluir cliente" : "Falha ao solicitar exclusão",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível concluir a exclusão do cliente.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletionDecision(action: "APPROVE" | "REJECT") {
    if (!token || !decisionRequest) {
      return;
    }

    try {
      setSaving(true);
      const result = await decideClientDeletionRequest(
        decisionRequest.id,
        {
          action,
          message: decisionMessage.trim() || undefined,
        },
        token,
      );
      setToast({
        title:
          action === "APPROVE" ? "Exclusão aprovada" : "Solicitação recusada",
        message: result.message,
        variant: "success",
      });
      if (action === "APPROVE") {
        const removedClientId =
          decisionRequest.clientId ?? result.request.clientId;

        if (removedClientId) {
          setClients((current) =>
            current.filter((client) => client.id !== removedClientId),
          );
        }
      }
      setDecisionRequest(null);
      setDecisionMessage("");
      await loadClients();
    } catch (error) {
      setToast({
        title: "Falha ao analisar solicitação",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao analisar solicitação.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <CrmPageShell sx={{ minWidth: 0, gap: 2, containerType: "inline-size", containerName: "cadastros-clientes" }}>
        <CrmSection sx={superficieCadastrosSx}>
          <Box data-cabecalho-cadastros sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', '@container cadastros-clientes (max-width: 960px)': { flexDirection: 'column', alignItems: 'stretch' } }}>
            <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, alignItems: 'flex-start', flex: '1 1 auto' }}>
              <Box sx={{ width: 42, height: 42, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '10px', bgcolor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}><UsersRound size={22} /></Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: '#64748b', fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', mb: 0.25 }}>CRM</Typography>
                <Typography component="h1" sx={{ color: '#1f2937', fontSize: { xs: 22, md: 25 }, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em' }}>Cadastros</Typography>
                <Typography sx={{ mt: 0.75, color: '#64748b', fontSize: 13, lineHeight: 1.6, overflowWrap: 'anywhere' }}>Clientes e Leads em uma única base, com contatos, documentos e acompanhamento comercial.</Typography>
              </Box>
            </Stack>
            <Box data-acoes-cadastros sx={{ display: 'flex', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1, '&& .MuiButton-root': acaoCadastroSx, '@container cadastros-clientes (max-width: 480px)': { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', width: '100%', '& .MuiButton-contained': { gridColumn: '1 / -1' }, '&& .MuiButton-root': { ...acaoCadastroSx, px: 1, fontSize: 12.5 } } }}>
              <Button variant="outlined" startIcon={<RefreshCcw size={16} />} onClick={() => loadClients()} disabled={loading} sx={acaoSecundariaCadastroSx}>Atualizar</Button>
              <Button variant="outlined" startIcon={<Download size={16} />} onClick={() => exportClients(filteredClients)} disabled={filteredClients.length === 0} sx={acaoSecundariaCadastroSx}>Exportar lista</Button>
              {canManageClients ? <Button variant="contained" startIcon={<PlusCircle size={16} />} onClick={() => { clearCnpjError(); setIsModalOpen(true); }} sx={{ ...acaoCadastroSx, bgcolor: '#ff5805', color: '#fff', '&:hover': { bgcolor: '#e94f00', boxShadow: 'none' } }}>Novo cadastro</Button> : null}
            </Box>
          </Box>
        </CrmSection>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
            '@container cadastros-clientes (max-width: 960px)': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))' },
            gap: 1.5,
            alignItems: "stretch",
          }}
        >
          <CrmKpiCard
            title="Total de cadastros"
            value={summary.total}
            icon={<UsersRound size={22} />}
            accent="#ff5805"
            softColor="#ff58051a"
            sx={{
              minHeight: 104,
              borderRadius: "12px",
              "& [data-cartao-valor]": { fontSize: 28 },
              height: "100%",
            }}
          />

          <CrmKpiCard
            title="Clientes ativos"
            value={summary.active}
            icon={<UsersRound size={22} />}
            accent="#f59e0b"
            softColor="#f59e0b1a"
            sx={{
              minHeight: 104,
              borderRadius: "12px",
              "& [data-cartao-valor]": { fontSize: 28 },
              height: "100%",
            }}
          />

          <CrmKpiCard
            title="Pendentes"
            value={summary.pending}
            icon={<UsersRound size={22} />}
            accent="#f97316"
            softColor="#f973161a"
            sx={{
              minHeight: 104,
              borderRadius: "12px",
              "& [data-cartao-valor]": { fontSize: 28 },
              height: "100%",
            }}
          />

          <CrmKpiCard
            title="Novos no mês"
            value={summary.newThisMonth}
            icon={<PlusCircle size={22} />}
            accent="#ef4444"
            softColor="#ef44441a"
            sx={{
              minHeight: 104,
              borderRadius: "12px",
              "& [data-cartao-valor]": { fontSize: 28 },
              height: "100%",
            }}
          />
        </Box>

        {canDecideDeletion && pendingDeletionRequests.length > 0 ? (
          <CrmSection
            sx={{
              overflow: "hidden",
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                px: { xs: 2, md: 2.5 },
                py: 2,
                alignItems: "center",
                justifyContent: "flex-start",
                flexWrap: "nowrap",
                borderBottom: `1px solid ${crmPalette.border}`,
              }}
            >
              <Box>
                <Typography
                  component="h2"
                  sx={{
                    color: crmPalette.text,
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  Solicitações de exclusão
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color: crmPalette.muted,
                    fontSize: 13,
                  }}
                >
                  Comercial, Gestão ou Admin aprovam ou recusam a remoção definitiva de clientes.
                </Typography>
              </Box>

              <Chip
                label={`${pendingDeletionRequests.length} ${pendingDeletionRequests.length === 1
                  ? "solicitação"
                  : "solicitações"
                  }`}
                size="small"
                sx={{
                  height: 28,
                  borderRadius: "8px",
                  bgcolor: "#fff0e8",
                  color: crmPalette.orangeDark,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              />
            </Stack>

            <Stack divider={<Divider flexItem />}>
              {pendingDeletionRequests.slice(0, 6).map((request) => (
                <Box
                  key={request.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "minmax(0, 1.2fr) minmax(0, 1fr)",
                      lg: "minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) auto",
                    },
                    gap: 2,
                    px: { xs: 2, md: 2.5 },
                    py: 2.25,
                    alignItems: "center",

                    "&:hover": {
                      bgcolor: "#fafafa",
                    },
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: crmPalette.text,
                        fontSize: 14,
                        fontWeight: 900,
                      }}
                    >
                      {request.client?.companyName ||
                        request.client?.user?.name ||
                        request.clientNameSnapshot ||
                        "Cliente"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.4,
                        color: crmPalette.muted,
                        fontSize: 13,
                      }}
                    >
                      {request.client?.user?.email ||
                        request.clientEmailSnapshot ||
                        "Sem e-mail"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color: crmPalette.text,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      Solicitado por
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: crmPalette.muted,
                        fontSize: 13,
                      }}
                    >
                      {request.requestedBy?.name || "Time interno"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: "#94a3b8",
                        fontSize: 12,
                      }}
                    >
                      {formatDate(request.createdAt)}
                    </Typography>
                  </Box>

                  <Box>
                    <Chip
                      label={deletionStatusLabels[request.status]}
                      size="small"
                      variant="outlined"
                      sx={{
                        ...deletionStatusStyles[request.status],
                        height: 28,
                        borderRadius: "8px",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    />

                    <Typography
                      sx={{
                        mt: 0.8,
                        color: crmPalette.muted,
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      {request.reason || "Sem justificativa informada."}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: {
                        xs: "flex-start",
                        lg: "flex-end",
                      },
                    }}
                  >
                    {request.status === "PENDENTE" ? (
                      <Button
                        type="button"
                        variant="outlined"
                        startIcon={<ShieldCheck size={16} />}
                        onClick={() => setDecisionRequest(request)}
                        sx={{
                          minHeight: 38,
                          borderRadius: "9px",
                          borderColor: crmPalette.border,
                          color: crmPalette.text,
                          fontWeight: 800,

                          "&:hover": {
                            borderColor: crmPalette.orange,
                            bgcolor: "#fff7f2",
                            color: crmPalette.orangeDark,
                          },
                        }}
                      >
                        Analisar
                      </Button>
                    ) : (
                      <Typography
                        sx={{
                          color: crmPalette.muted,
                          fontSize: 12,
                          textAlign: { xs: "left", lg: "right" },
                        }}
                      >
                        {request.approvedBy?.name
                          ? `Analisado por ${request.approvedBy.name}`
                          : "Concluído"}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          </CrmSection>
        ) : null}

        <CrmSection
          sx={superficieCadastrosSx}
        >
          <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
            <Box>
              <Typography component="h2" sx={{ color: "#1f2937", fontSize: 14, fontWeight: 600 }}>Base comercial</Typography>

            </Box>

            <Box
              sx={{
                width: "100%",
                display: "grid",
                gap: 1.5,

                gridTemplateColumns: 'minmax(0,2fr) repeat(3,minmax(0,1fr))',
                '@container cadastros-clientes (max-width: 1000px)': { gridTemplateColumns: 'repeat(3,minmax(0,1fr))', '& > :first-child': { gridColumn: '1 / -1' } },
                '@container cadastros-clientes (max-width: 760px)': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))', '& > :first-child, & > :last-child': { gridColumn: '1 / -1' } },
                '@container cadastros-clientes (max-width: 420px)': { gridTemplateColumns: 'minmax(0,1fr)' },
                alignItems: "center",

              }}
            >
              <TextField
                size="small"
                fullWidth
                label="Buscar cliente"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, e-mail, empresa, CNPJ ou segmento"
                sx={filterFieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={18} color={crmPalette.muted} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                select
                size="small"
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "TODOS" | LeadStatus)
                }
                sx={filterFieldSx}
              >
                <MenuItem value="TODOS">Todos</MenuItem>
                <MenuItem value="ATIVO">Ativo</MenuItem>
                <MenuItem value="PENDENTE">Pendente</MenuItem>
                <MenuItem value="INATIVO">Inativo</MenuItem>
              </TextField>


              <TextField
                select
                size="small"
                fullWidth
                label="Modalidade"
                value={modalidadeFiltro}
                onChange={(event) =>
                  setModalidadeFiltro(event.target.value)
                }
                sx={filterFieldSx}
              >
                <MenuItem value="">Todos os cadastros</MenuItem>
                <MenuItem value="CLIENTE">Clientes</MenuItem>
                <MenuItem value="LEAD">Leads</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                fullWidth
                label="Responsável"
                value={responsavelFiltro}
                onChange={(event) => setResponsavelFiltro(event.target.value)}
                sx={filterFieldSx}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
              >
                <MenuItem value="">Todos os responsáveis</MenuItem>
                {responsaveisDisponiveis.map((responsavel) => (
                  <MenuItem key={responsavel} value={responsavel}>{responsavel}</MenuItem>
                ))}
              </TextField>

            </Box>
          </Stack>
        </CrmSection>

        <CrmSection
          sx={{
            overflow: "hidden",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 2,
              alignItems: "center",
              justifyContent: "flex-start",
              flexWrap: "nowrap",
              borderBottom: `1px solid ${crmPalette.border}`,
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color: crmPalette.orangeDark,
              }}
            >
              <UsersRound size={19} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h2"
                sx={{
                  color: crmPalette.text,
                  fontSize: 17,
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                Base de cadastros
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color: crmPalette.muted,
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {filteredClients.length} cadastro(s) encontrado(s)
              </Typography>
            </Box>
          </Stack>

          {loading ? (
            <Stack
              spacing={1.5}
              sx={{
                minHeight: 180,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={30} sx={{ color: crmPalette.orange }} />

              <Typography
                sx={{
                  color: crmPalette.muted,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Carregando cadastros...
              </Typography>
            </Stack>
          ) : pageError ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">{pageError}</Alert>
            </Box>
          ) : (
            <>
              {filteredClients.length === 0 ? (
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                  <Alert severity="info">
                    Nenhum cliente encontrado com os filtros atuais.
                  </Alert>
                </Box>
              ) : (
                <Stack spacing={1.5} sx={{ p: { xs: 2, md: 2.5 } }}>
                  {paginatedClients.map((client) => {
                    return (
                      <Paper
                        key={client.id}
                        elevation={0}
                        sx={{
                          p: { xs: 2, md: 2.25 },
                          border: `1px solid ${crmPalette.border}`,
                          borderRadius: "10px",
                          bgcolor: "#ffffff",
                          transition:
                            "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",

                          "&:hover": {
                            transform: "none",
                            borderColor: "rgba(255,77,0,0.35)",
                            boxShadow: "none",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "grid",
                            gap: 2,
                            minWidth: 0,
                            gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,.9fr) minmax(0,.9fr) minmax(0,1.1fr) auto',
                            '@container cadastros-clientes (max-width: 960px)': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))', '& > :first-child': { gridColumn: '1 / -1' }, '& > :last-child': { alignSelf: 'end' } },
                            '@container cadastros-clientes (max-width: 420px)': { gridTemplateColumns: 'minmax(0,1fr)' },
                            '& > *': { minWidth: 0, overflowWrap: 'anywhere' },
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ color: "#020617", fontSize: 15, fontWeight: 600, overflowWrap: "anywhere" }}>
                              {getClientDisplayName(client)}
                            </Typography>

                            <Chip
                              label={
                                client.modalidadeCadastro === "LEAD"
                                  ? "Lead"
                                  : "Cliente"
                              }
                              size="small"
                              sx={{
                                height: 24,
                                borderRadius: "7px",
                                fontSize: 11,
                                fontWeight: 500,

                                bgcolor:
                                  client.modalidadeCadastro === "LEAD"
                                    ? "#dbeafe"
                                    : "#dcfce7",

                                color:
                                  client.modalidadeCadastro === "LEAD"
                                    ? "#1d4ed8"
                                    : "#15803d",

                                border:
                                  client.modalidadeCadastro === "LEAD"
                                    ? "1px solid #bfdbfe"
                                    : "1px solid #bbf7d0",
                              }}
                            />

                            {client.email ? (
                              <Typography
                                sx={{
                                  mt: 0.5,
                                  color: "text.secondary",
                                  fontSize: 13,
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {client.email}
                              </Typography>
                            ) : null}
                            {client.company && client.company !== getClientDisplayName(client) ? (
                              <Typography sx={{ mt: 0.25, color: "text.disabled", fontSize: 13 }}>
                                {client.company}
                              </Typography>
                            ) : null}
                          </Box>

                          <Box>
                            <Typography sx={{ color: crmPalette.muted, fontSize: 12, fontWeight: 400 }}>
                              CNPJ
                            </Typography>
                            <Typography sx={{ mt: 0.75, color: crmPalette.text, fontSize: 13, fontWeight: 500 }}>
                              {client.document || "-"}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography sx={{ color: crmPalette.muted, fontSize: 12, fontWeight: 400 }}>
                              Cidade
                            </Typography>
                            <Typography sx={{ mt: 0.75, color: crmPalette.text, fontSize: 13, fontWeight: 500 }}>
                              {client.city || "-"}
                            </Typography>
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ color: crmPalette.muted, fontSize: 12, fontWeight: 400 }}>
                              Segmento
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.75,
                                color: crmPalette.text,
                                fontSize: 13,
                                lineHeight: 1.5,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {client.segment || "-"}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                            <Button
                              component={Link}
                              href={`/cadastros/${client.id}`}
                              type="button"
                              variant="outlined"
                              endIcon={<ArrowRight size={16} />}
                              sx={acaoSecundariaCadastroSx}
                            >
                              Detalhes
                            </Button>
                          </Stack>
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
              {filteredClients.length > 0 ? (
                <Stack
                  spacing={0}
                  sx={{
                    px: 2,
                    py: 1.5,
                    gap: 1.5,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    '@container cadastros-clientes (max-width: 760px)': { flexDirection: 'column' },
                    alignItems: { xs: "stretch", md: "center" },
                    justifyContent: "space-between",
                    borderTop: `1px solid ${crmPalette.border}`,
                    bgcolor: "#ffffff",
                  }}
                >
                  <Typography
                    sx={{
                      color: crmPalette.muted,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Mostrando {paginationStart}-{paginationEnd} de{" "}
                    {filteredClients.length}
                  </Typography>

                  <Stack
                    spacing={0}
                    sx={{ minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5, '@container cadastros-clientes (max-width: 760px)': { justifyContent: 'space-between' } }}
                  >
                    <TextField
                      select
                      size="small"
                      label="Por página"
                      value={rowsPerPage}
                      onChange={(event) =>
                        setRowsPerPage(Number(event.target.value))
                      }
                      sx={{
                        minWidth: 132,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          fontSize: 13,
                          fontWeight: 500,
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: 12,
                          fontWeight: 500,
                        },
                      }}
                    >
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Pagination
                      page={page}
                      count={totalPages}
                      onChange={(_, nextPage) => setPage(nextPage)}
                      color="primary"
                      shape="rounded"
                      size="small"
                      siblingCount={1}
                      boundaryCount={1}
                    />
                  </Stack>
                </Stack>
              ) : null}
            </>
          )}
        </CrmSection>

        <Dialog
          open={isModalOpen}
          onClose={() => {
            if (!saving && !searchingCnpj) {
              setIsModalOpen(false);
            }
          }}
          fullWidth
          maxWidth="md"
          scroll="paper"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 12px 48px rgba(15,23,42,.12)",
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Box>


                <Typography
                  component="h2"
                  sx={{
                    mt: 0.5,
                    color: crmPalette.text,
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  Novo cadastro
                </Typography>

                <Typography
                  sx={{
                    mt: 0.75,
                    color: crmPalette.muted,
                    fontSize: 13,
                  }}
                >
                  Dados fiscais, cadastrais, contatos e documentos.
                </Typography>
              </Box>

              <IconButton
                type="button"
                aria-label="Fechar cadastro"
                disabled={saving || searchingCnpj}
                onClick={() => setIsModalOpen(false)}
                sx={{
                  flexShrink: 0,
                  color: crmPalette.muted,

                  "&:hover": {
                    bgcolor: "#f1f5f9",
                    color: crmPalette.text,
                  },
                }}
              >
                <XCircle size={21} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <Divider />

          <DialogContent
            sx={{
              px: { xs: 2, md: 2.5 },
              py: 2,
              bgcolor: "#fff",
              '&& .MuiTextField-root .MuiOutlinedInput-root': { borderRadius: '8px' },
              '&& .MuiTextField-root .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': { height: 40 },
              '&& .MuiInputLabel-root': { fontSize: 13, fontWeight: 400 },
              '&& .MuiInputBase-input, && .MuiSelect-select': { fontSize: 13.5, fontWeight: 400 },
              '& .MuiPaper-root': { boxShadow: 'none', borderRadius: '10px' },
              '& .MuiButton-root': { minHeight: 40, fontSize: 13, fontWeight: 600, textTransform: 'none', borderRadius: '8px' },
              '& .MuiButton-contained:not(.Mui-disabled)': { bgcolor: '#ff5805', '&:hover': { bgcolor: '#e94f00' } },
            }}
          >
            <ClientForm
              camposIniciais={<CamposComplementaresCadastro modalidade={modalidadeNovo} setModalidade={modalidade => { setModalidadeNovo(modalidade); setEtapaNovo(modalidade === "CLIENTE" ? "venda_efetivada" : "entrada_leads"); }} etapa={etapaNovo} setEtapa={setEtapaNovo} comerciais={comerciaisNovo} setComerciais={setComerciaisNovo} foto={fotoNovo} setFoto={setFotoNovo} desabilitado={saving || searchingCnpj} />}
              form={form}
              setForm={setForm}
              contacts={contacts}
              setContacts={setContacts}
              documentFiles={documentFiles}
              setDocumentFiles={setDocumentFiles}
              loading={saving}
              searchingCnpj={searchingCnpj}
              cnpjError={cnpjError}
              onSearchCnpj={handleSearchCnpj}
              onCancel={() => setIsModalOpen(false)}
              onSubmit={handleCreateClient}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!deletionModalClient}
          onClose={() => {
            if (!saving) {
              setDeletionModalClient(null);
              setDeletionReason("");
            }
          }}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 28px 80px rgba(15, 23, 42, 0.20)",
            },
          }}
        >
          <Box component="form" onSubmit={handleRequestDeletion}>
            <DialogTitle
              component="div"
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 2.5,
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#b91c1c",
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: ".16em",
                      textTransform: "uppercase",
                    }}
                  >
                    Exclusão de cliente
                  </Typography>

                  <Typography
                    component="h2"
                    sx={{
                      mt: 0.5,
                      color: crmPalette.text,
                      fontSize: { xs: 21, md: 24 },
                      fontWeight: 900,
                      lineHeight: 1.2,
                    }}
                  >
                    {canDeleteDirectly ? "Confirmar exclusão" : "Solicitar aprovação do Comercial ou Gestão"}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.75,
                      color: crmPalette.muted,
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    O cliente{" "}
                    <Box
                      component="span"
                      sx={{
                        color: crmPalette.text,
                        fontWeight: 800,
                      }}
                    >
                      {deletionModalClient?.company || "selecionado"}
                    </Box>{" "}
                    {canDeleteDirectly ? "será excluído ao confirmar esta ação." : "só será excluído após aprovação do Comercial ou Gestão."}
                  </Typography>
                </Box>

                <IconButton
                  type="button"
                  aria-label="Fechar solicitação de exclusão"
                  disabled={saving}
                  onClick={() => {
                    setDeletionModalClient(null);
                    setDeletionReason("");
                  }}
                  sx={{
                    flexShrink: 0,
                    color: crmPalette.muted,

                    "&:hover": {
                      bgcolor: "#f1f5f9",
                      color: crmPalette.text,
                    },
                  }}
                >
                  <XCircle size={21} />
                </IconButton>
              </Stack>
            </DialogTitle>

            <Divider />

            <DialogContent
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 3,
                bgcolor: "#f8fafc",
              }}
            >
              <Alert
                severity="warning"
                sx={{
                  mb: 2,
                  borderRadius: "10px",

                  "& .MuiAlert-message": {
                    fontSize: 13,
                  },
                }}
              >
                {canDeleteDirectly
                  ? "A exclusão será imediata e não poderá ser desfeita. Confirme antes de continuar."
                  : "Esta ação não exclui o cliente imediatamente. A solicitação será enviada para análise do Comercial ou Gestão."}
              </Alert>

              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Motivo da exclusão"
                value={deletionReason}
                onChange={(event) => setDeletionReason(event.target.value)}
                placeholder="Explique o motivo da solicitação"
                sx={textFieldSx}
              />
            </DialogContent>

            <Divider />

            <DialogActions
              sx={{
                px: { xs: 2.5, md: 3 },
                py: 2,
                gap: 1,
              }}
            >
              <Button
                type="button"
                variant="outlined"
                disabled={saving}
                onClick={() => {
                  setDeletionModalClient(null);
                  setDeletionReason("");
                }}
                sx={{
                  minHeight: 42,
                  borderRadius: "10px",
                  borderColor: crmPalette.border,
                  color: crmPalette.text,
                  fontWeight: 800,
                }}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="error"
                disabled={saving}
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Trash2 size={16} />
                  )
                }
                sx={{
                  minHeight: 42,
                  borderRadius: "10px",
                  px: 2.5,
                  fontWeight: 800,
                  boxShadow: "none",

                  "&:hover": {
                    boxShadow: "none",
                  },
                }}
              >
                {saving ? (canDeleteDirectly ? "Excluindo..." : "Enviando...") : (canDeleteDirectly ? "Excluir cliente" : "Solicitar exclusão")}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        <Dialog
          open={!!decisionRequest}
          onClose={() => {
            if (!saving) {
              setDecisionRequest(null);
              setDecisionMessage("");
            }
          }}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 28px 80px rgba(15, 23, 42, 0.20)",
            },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              px: { xs: 2.5, md: 3 },
              py: 2.5,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: crmPalette.orangeDark,
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: ".16em",
                    textTransform: "uppercase",
                  }}
                >
                  Análise da solicitação
                </Typography>

                <Typography
                  component="h2"
                  sx={{
                    mt: 0.5,
                    color: crmPalette.text,
                    fontSize: { xs: 21, md: 24 },
                    fontWeight: 900,
                    lineHeight: 1.2,
                  }}
                >
                  Aprovar ou recusar exclusão
                </Typography>

                <Typography
                  sx={{
                    mt: 0.75,
                    color: crmPalette.muted,
                    fontSize: 13,
                  }}
                >
                  O retorno será registrado para o time comercial.
                </Typography>
              </Box>

              <IconButton
                type="button"
                aria-label="Fechar análise"
                disabled={saving}
                onClick={() => {
                  setDecisionRequest(null);
                  setDecisionMessage("");
                }}
                sx={{
                  flexShrink: 0,
                  color: crmPalette.muted,

                  "&:hover": {
                    bgcolor: "#f1f5f9",
                    color: crmPalette.text,
                  },
                }}
              >
                <XCircle size={21} />
              </IconButton>
            </Stack>
          </DialogTitle>

          <Divider />

          <DialogContent
            sx={{
              px: { xs: 2.5, md: 3 },
              py: 3,
              bgcolor: "#f8fafc",
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                borderRadius: "12px",
                borderColor: crmPalette.border,
                bgcolor: "#ffffff",
              }}
            >
              <Typography
                sx={{
                  color: crmPalette.text,
                  fontSize: 14,
                  fontWeight: 900,
                }}
              >
                {decisionRequest?.client?.companyName ||
                  decisionRequest?.client?.user?.name ||
                  decisionRequest?.clientNameSnapshot ||
                  "Cliente"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.75,
                  color: crmPalette.muted,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {decisionRequest?.reason || "Sem motivo informado."}
              </Typography>
            </Paper>

            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Parecer"
              value={decisionMessage}
              onChange={(event) => setDecisionMessage(event.target.value)}
              placeholder="Informe o motivo da aprovação ou da recusa"
              sx={textFieldSx}
            />
          </DialogContent>

          <Divider />

          <DialogActions
            sx={{
              px: { xs: 2.5, md: 3 },
              py: 2,
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Button
              type="button"
              variant="outlined"
              color="error"
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <XCircle size={16} />
                )
              }
              onClick={() => handleDeletionDecision("REJECT")}
              sx={{
                minHeight: 42,
                borderRadius: "10px",
                fontWeight: 800,
              }}
            >
              Recusar
            </Button>

            <Button
              type="button"
              variant="contained"
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <ShieldCheck size={16} />
                )
              }
              onClick={() => handleDeletionDecision("APPROVE")}
              sx={{
                minHeight: 42,
                borderRadius: "10px",
                px: 2.5,
                bgcolor: "#059669",
                fontWeight: 800,
                boxShadow: "none",

                "&:hover": {
                  bgcolor: "#047857",
                  boxShadow: "none",
                },
              }}
            >
              Aprovar exclusão
            </Button>
          </DialogActions>
        </Dialog>
      </CrmPageShell>

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
