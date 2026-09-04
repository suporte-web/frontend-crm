"use client";

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
  CrmPageHeader,
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
  getCrmClientSummaries,
  createClient,
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

type ReceitaCnpjResponse = {
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  descricao_tipo_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  descricao_situacao_cadastral?: string;
  opcao_pelo_simples?: boolean | null;
  message?: string;
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
  "& .MuiOutlinedInput-root": {
    height: 44,
    borderRadius: "10px",
    bgcolor: "#ffffff",
  },

  "& .MuiInputLabel-root": {
    fontWeight: 700,
  },
};

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

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCep(value?: string) {
  const digits = onlyDigits(value ?? "").slice(0, 8);

  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

function joinStreet(tipo?: string, logradouro?: string) {
  return [tipo?.trim(), logradouro?.trim()].filter(Boolean).join(" ");
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
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [form, setForm] = useState(initialClientForm);
  const [contacts, setContacts] = useState<ClientContactForm[]>([
    emptyClientContact(),
  ]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const isManagement = user?.role === "GESTAO" || user?.role === "ADMIN";
  const canManageClients = user?.role
    ? ["ADMIN", "GESTAO", "COMERCIAL"].includes(user.role)
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
        getCrmClientSummaries(token),
        canManageClients
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
            client.city,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchesStatus && matchesSearch;
      })
      .sort((first, second) =>
        getClientDisplayName(first).localeCompare(
          getClientDisplayName(second),
          "pt-BR",
          { sensitivity: "base" },
        ),
      );
  }, [clients, search, statusFilter]);

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
  }, [rowsPerPage, search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const summary = useMemo(() => {
    const active = clients.filter((client) => client.status === "ATIVO").length;
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

  async function handleSearchCnpj() {
    const cnpj = onlyDigits(form.document);

    if (cnpj.length !== 14) {
      setToast({
        title: "CNPJ inválido",
        message: "Informe os 14 números do CNPJ para buscar na Receita.",
        variant: "error",
      });
      return;
    }

    try {
      setSearchingCnpj(true);

      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
      );
      const data = (await response
        .json()
        .catch(() => null)) as ReceitaCnpjResponse | null;

      if (!response.ok) {
        throw new Error(
          data?.message || "Não foi possível consultar esse CNPJ.",
        );
      }

      const street = joinStreet(
        data?.descricao_tipo_logradouro,
        data?.logradouro,
      );
      const cnae = data?.cnae_fiscal ? String(data.cnae_fiscal) : "";
      const taxRegime =
        data?.opcao_pelo_simples === true ? "Simples Nacional" : "";

      setForm((current) => ({
        ...current,
        document: formatCnpj(cnpj),
        legalName: data?.razao_social || current.legalName,
        tradeName: data?.nome_fantasia || current.tradeName,
        companyName:
          data?.nome_fantasia || data?.razao_social || current.companyName,
        cnae: cnae || current.cnae,
        businessActivity:
          data?.cnae_fiscal_descricao || current.businessActivity,
        segment: data?.cnae_fiscal_descricao || current.segment,
        taxRegime: taxRegime || current.taxRegime,
        zipCode: formatCep(data?.cep) || current.zipCode,
        street: street || current.street,
        number: data?.numero || current.number,
        complement: data?.complemento || current.complement,
        neighborhood: data?.bairro || current.neighborhood,
        city: data?.municipio || current.city,
        state: data?.uf || current.state,
      }));

      const situacao = data?.descricao_situacao_cadastral?.trim();

      setToast({
        title: "CNPJ encontrado",
        message:
          situacao && situacao.toUpperCase() !== "ATIVA"
            ? `Dados preenchidos. Situação cadastral: ${situacao}.`
            : "Dados fiscais e cadastrais preenchidos automaticamente.",
        variant: "success",
      });
    } catch (error) {
      setToast({
        title: "Falha na consulta",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao consultar CNPJ na Receita.",
        variant: "error",
      });
    } finally {
      setSearchingCnpj(false);
    }
  }

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
      const createdClient = await createClient(
        {
          name: displayName,
          companyName:
            form.companyName.trim() ||
            form.tradeName.trim() ||
            form.legalName.trim() ||
            displayName,
          legalName: form.legalName.trim() || undefined,
          tradeName: form.tradeName.trim() || undefined,
          phone: primaryContact?.phone || undefined,
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
          internalOwnerId: user?.id,
          contacts: validContacts,
        },
        token,
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
          ? "Cliente criado com aviso"
          : "Cliente criado",
        message: documentUploadFailed
          ? "O cliente foi criado, mas um ou mais documentos não foram anexados."
          : "Novo cliente registrado na base com os documentos.",
        variant: documentUploadFailed ? "error" : "success",
      });

      setForm(initialClientForm);
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
      await requestClientDeletion(
        deletionModalClient.id,
        { reason: deletionReason.trim() || undefined },
        token,
      );
      setToast({
        title: "Solicitação enviada",
        message: "A exclusão do cliente foi enviada para aprovação da Gestão.",
        variant: "success",
      });
      setDeletionModalClient(null);
      setDeletionReason("");
      await loadClients();
    } catch (error) {
      setToast({
        title: "Falha ao solicitar exclusão",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao solicitar exclusão.",
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
      <CrmPageShell>
        <CrmPageHeader
          eyebrow="CRM"
          title="Gestão de clientes"
          description="Base de clientes do sistema."
          icon={<UsersRound size={30} />}
          aside={
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              sx={{
                alignItems: "stretch",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<RefreshCcw size={17} />}
                onClick={() => loadClients()}
                disabled={loading}
                sx={{
                  minHeight: 44,
                  borderRadius: "10px",
                  fontWeight: 800,
                }}
              >
                Atualizar
              </Button>

              <Button
                variant="outlined"
                startIcon={<Download size={17} />}
                onClick={() => exportClients(filteredClients)}
                disabled={filteredClients.length === 0}
                sx={{
                  minHeight: 44,
                  borderRadius: "10px",
                  fontWeight: 800,
                }}
              >
                Exportar lista
              </Button>

              {canManageClients ? (
                <Button
                  variant="contained"
                  startIcon={<PlusCircle size={17} />}
                  onClick={() => setIsModalOpen(true)}
                  sx={{
                    minHeight: 44,
                    borderRadius: "10px",
                    px: 2.25,
                    bgcolor: crmPalette.orange,
                    fontWeight: 800,
                    boxShadow: "0 12px 24px rgba(255,77,0,0.20)",

                    "&:hover": {
                      bgcolor: crmPalette.orangeDark,
                    },
                  }}
                >
                  Novo cliente
                </Button>
              ) : null}
            </Stack>
          }
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
            alignItems: "stretch",
            }}
          >
            <CrmKpiCard
              title="Total de clientes"
              value={summary.total}
              icon={<UsersRound size={22} />}
              accent="#ff5805"
              softColor="#ff58051a"
              sx={{
                minHeight: 140,
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
                minHeight: 140,
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
                minHeight: 140,
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
                minHeight: 140,
                height: "100%",
              }}
            />
          </Box>

        {isManagement && pendingDeletionRequests.length > 0 ? (
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
                  Gestão aprova ou recusa a remoção definitiva de clientes.
                </Typography>
              </Box>

              <Chip
                label={`${pendingDeletionRequests.length} ${
                  pendingDeletionRequests.length === 1
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
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
            bgcolor: "#fffaf7",
            border: "1px solid rgba(255,88,5,0.10)",
            borderRadius: "18px",
            boxShadow: "0 10px 35px rgba(15,23,42,0.05)",
          }}
        >
          <Stack spacing={2.5} sx={{ width: "100%" }}>
            <Box>
              <Typography
                sx={{
                  color: crmPalette.orangeDark,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                }}
              >
                Base comercial
              </Typography>
              <Typography component="h2" sx={{ mt: 0.5, fontSize: 26, fontWeight: 900 }}>
                Buscar clientes
              </Typography>
              <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
                Localize clientes por nome, e-mail, empresa, CNPJ ou segmento.
              </Typography>
            </Box>

            <Box
              sx={{
                width: "100%",
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "minmax(260px, 2fr) minmax(170px, 1fr)",
                },
                alignItems: "end",
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
                  fontSize: 18,
                  fontWeight: 900,
                  lineHeight: 1.2,
                }}
              >
                Base de clientes
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color: crmPalette.muted,
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {filteredClients.length} cliente(s) encontrados
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
                Carregando clientes...
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
                        borderRadius: "14px",
                        bgcolor: "#ffffff",
                        transition:
                          "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",

                        "&:hover": {
                          transform: "translateY(-1px)",
                          borderColor: "rgba(255,77,0,0.35)",
                          boxShadow: "0 16px 36px rgba(15,23,42,0.08)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gap: 2,
                          gridTemplateColumns: {
                            xs: "1fr",
                            lg: "1.6fr .8fr .8fr 1fr auto",
                          },
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: "#020617", fontSize: 16, fontWeight: 900 }}>
                            {getClientDisplayName(client)}
                          </Typography>
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
                          <Typography sx={{ color: crmPalette.muted, fontSize: 11, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
                            CNPJ
                          </Typography>
                          <Typography sx={{ mt: 0.75, color: crmPalette.text, fontSize: 13, fontWeight: 800 }}>
                            {client.document || "-"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography sx={{ color: crmPalette.muted, fontSize: 11, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
                            Cidade
                          </Typography>
                          <Typography sx={{ mt: 0.75, color: crmPalette.text, fontSize: 13, fontWeight: 800 }}>
                            {client.city || "-"}
                          </Typography>
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: crmPalette.muted, fontSize: 11, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
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
                            href={`/clientes/${client.id}`}
                            type="button"
                            variant="outlined"
                            endIcon={<ArrowRight size={16} />}
                            sx={{
                              borderRadius: "10px",
                              fontWeight: 800,
                              textTransform: "none",
                            }}
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
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                sx={{
                  px: 2,
                  py: 1.5,
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
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                  sx={{ alignItems: { xs: "stretch", sm: "center" } }}
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
                        fontWeight: 800,
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: 12,
                        fontWeight: 800,
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
              borderRadius: "20px",
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
                  Novo cliente
                </Typography>

                <Typography
                  component="h2"
                  sx={{
                    mt: 0.5,
                    color: crmPalette.text,
                    fontSize: { xs: 21, md: 25 },
                    fontWeight: 900,
                    lineHeight: 1.2,
                  }}
                >
                  Cadastro completo do cliente
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
              px: { xs: 2.5, md: 3 },
              py: 3,
              bgcolor: "#f8fafc",
            }}
          >
            <ClientForm
              form={form}
              setForm={setForm}
              contacts={contacts}
              setContacts={setContacts}
              documentFiles={documentFiles}
              setDocumentFiles={setDocumentFiles}
              loading={saving}
              searchingCnpj={searchingCnpj}
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
                    Solicitar aprovação da Gestão
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
                    só será excluído após aprovação formal da Gestão.
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
                Esta ação não exclui o cliente imediatamente. A solicitação será
                enviada para análise da Gestão.
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
                {saving ? "Enviando..." : "Enviar para Gestão"}
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
                  Análise da Gestão
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
              label="Parecer da Gestão"
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
