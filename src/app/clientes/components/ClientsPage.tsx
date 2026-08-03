"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
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
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
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
  Download,
  Eye,
  FileText,
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

const initialClientForm = {
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

type ClientContactForm = {
  name: string;
  role: string;
  email: string;
  phone: string;
  notes: string;
};

const emptyClientContact = (): ClientContactForm => ({
  name: "",
  role: "",
  email: "",
  phone: "",
  notes: "",
});

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
    height: 52,
    minHeight: 52,
    borderRadius: "10px",
    bgcolor: "#ffffff",
    alignItems: "center",
  },

  "& .MuiInputBase-input": {
    height: "auto",
    paddingTop: 0,
    paddingBottom: 0,
  },

  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    height: "100% !important",
    paddingTop: "0 !important",
    paddingBottom: "0 !important",
  },

  "& .MuiInputAdornment-root": {
    height: 24,
    maxHeight: 24,
    alignItems: "center",
  },

  "& .MuiInputLabel-root": {
    fontWeight: 700,
  },
};

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

    return clients.filter((client) => {
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
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [clients, search, statusFilter]);

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

  function updateContact(
    index: number,
    field: keyof ClientContactForm,
    value: string,
  ) {
    setContacts((current) =>
      current.map((contact, currentIndex) =>
        currentIndex === index ? { ...contact, [field]: value } : contact,
      ),
    );
  }

  function addContact() {
    setContacts((current) => [...current, emptyClientContact()]);
  }

  function removeContact(index: number) {
    setContacts((current) =>
      current.length === 1
        ? [emptyClientContact()]
        : current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

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
            accent={crmPalette.blue}
            softColor="#eaf4ff"
          />

          <CrmKpiCard
            title="Clientes ativos"
            value={summary.active}
            icon={<UsersRound size={22} />}
            accent="#22a55a"
            softColor="#ecfdf5"
          />

          <CrmKpiCard
            title="Pendentes"
            value={summary.pending}
            icon={<UsersRound size={22} />}
            accent="#f4b000"
            softColor="#fff7df"
          />

          <CrmKpiCard
            title="Novos no mês"
            value={summary.newThisMonth}
            icon={<PlusCircle size={22} />}
            accent={crmPalette.orange}
            softColor="#fff0e8"
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
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1fr) 320px",
              },
              gap: 2,
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
            <TableContainer
              sx={{
                width: "100%",
                overflowX: "auto",
              }}
            >
              <Table
                sx={{
                  minWidth: 820,
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: "#f8fafc",
                    }}
                  >
                    {[
                      "Nome Fantasia",
                      "CNPJ",
                      "Cidade",
                      "Segmento",
                      "Ações",
                    ].map((title) => (
                      <TableCell
                        key={title}
                        align={title === "Ações" ? "center" : "left"}
                        sx={{
                          py: 1.75,
                          px: 2,
                          color: crmPalette.muted,
                          borderColor: crmPalette.border,
                          fontSize: 12,
                          fontWeight: 900,
                          letterSpacing: ".04em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {title}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredClients.map((client, index) => {
                    const pendingDeletion = pendingDeletionByClientId.get(
                      client.id,
                    );

                    const avatarColors = [
                      {
                        bgcolor: "#ffe6e8",
                        color: "#ec3139",
                      },
                      {
                        bgcolor: "#fff4d7",
                        color: "#b97900",
                      },
                      {
                        bgcolor: "#eee7ff",
                        color: "#6544ff",
                      },
                      {
                        bgcolor: "#eef1f5",
                        color: "#475569",
                      },
                    ];

                    const avatarColor =
                      avatarColors[index % avatarColors.length];

                    return (
                      <TableRow
                        key={client.id}
                        hover
                        sx={{
                          "&:last-child td": {
                            borderBottom: 0,
                          },

                          "&:hover": {
                            bgcolor: "#fafafa",
                          },
                        }}
                      >
                        {/* Nome Fantasia */}
                        <TableCell
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderColor: crmPalette.border,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{
                              alignItems: "center",
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 38,
                                height: 38,
                                bgcolor: avatarColor.bgcolor,
                                color: avatarColor.color,
                                fontSize: 15,
                                fontWeight: 800,
                              }}
                            >
                              {getClientInitial(client)}
                            </Avatar>

                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  color: crmPalette.text,
                                  fontSize: 13,
                                  fontWeight: 900,
                                  lineHeight: 1.4,
                                }}
                              >
                                {client.tradeName ||
                                  client.company ||
                                  client.name ||
                                  "Sem nome fantasia"}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* CNPJ */}
                        <TableCell
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderColor: crmPalette.border,
                          }}
                        >
                          <Typography
                            sx={{
                              color: crmPalette.text,
                              fontSize: 13,
                            }}
                          >
                            {client.document || "-"}
                          </Typography>
                        </TableCell>

                        {/* Cidade */}
                        <TableCell
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderColor: crmPalette.border,
                          }}
                        >
                          <Typography
                            sx={{
                              color: crmPalette.text,
                              fontSize: 13,
                            }}
                          >
                            {client.city || "-"}
                          </Typography>
                        </TableCell>

                        {/* Segmento */}
                        <TableCell
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderColor: crmPalette.border,
                          }}
                        >
                          <Typography
                            sx={{
                              color: crmPalette.text,
                              fontSize: 13,
                              lineHeight: 1.5,
                            }}
                          >
                            {client.segment || "-"}
                          </Typography>
                        </TableCell>

                        {/* Ações */}
                        <TableCell
                          align="center"
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderColor: crmPalette.border,
                          }}
                        >
                          <Stack
                            spacing={0.75}
                            sx={{
                              alignItems: "center",
                            }}
                          >
                            <Link
                              href={`/clientes/${client.id}`}
                              style={{
                                textDecoration: "none",
                              }}
                            >
                              <Button
                                type="button"
                                size="small"
                                variant="outlined"
                                startIcon={<Eye size={15} />}
                                sx={{
                                  minWidth: 92,
                                  borderRadius: "9px",
                                  borderColor: crmPalette.border,
                                  color: crmPalette.text,
                                  fontSize: 11,
                                  fontWeight: 800,

                                  "&:hover": {
                                    borderColor: crmPalette.orange,
                                    bgcolor: "#fff7f2",
                                  },
                                }}
                              >
                                Detalhes
                              </Button>
                            </Link>

                            {canManageClients ? (
                              <Button
                                type="button"
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<Trash2 size={15} />}
                                disabled={!!pendingDeletion}
                                onClick={() => {
                                  setDeletionModalClient(client);
                                  setDeletionReason("");
                                }}
                                sx={{
                                  minWidth: 92,
                                  borderRadius: "9px",
                                  fontSize: 11,
                                  fontWeight: 800,
                                }}
                              >
                                {pendingDeletion ? "Pendente" : "Excluir"}
                              </Button>
                            ) : null}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{
                          py: 6,
                          borderBottom: 0,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            color: crmPalette.muted,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          Nenhum cliente encontrado com os filtros atuais.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
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
          <Box
            component="form"
            onSubmit={handleCreateClient}
            sx={{
              display: "flex",
              minHeight: 0,
              flexDirection: "column",
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
                    Informe os dados fiscais, cadastrais, contatos e documentos.
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
              <Stack spacing={3}>
                {/* Dados fiscais */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: "16px",
                    borderColor: crmPalette.border,
                    bgcolor: "#ffffff",
                  }}
                >
                  <Typography
                    sx={{
                      color: crmPalette.text,
                      fontSize: 13,
                      fontWeight: 900,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Dados fiscais e cadastrais
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      mb: 2.25,
                      color: crmPalette.muted,
                      fontSize: 12,
                    }}
                  >
                    Preencha os dados da empresa para compor a base cadastral.
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "minmax(0, 1fr) auto",
                        },
                        gap: 1,
                        gridColumn: {
                          xs: "auto",
                          md: "1 / -1",
                        },
                        alignItems: "flex-start",
                      }}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        label="CNPJ"
                        value={form.document}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            document: formatCnpj(event.target.value),
                          }))
                        }
                        placeholder="00.000.000/0000-00"
                        sx={textFieldSx}
                      />

                      <Button
                        type="button"
                        variant="contained"
                        disabled={saving || searchingCnpj}
                        startIcon={
                          searchingCnpj ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <Search size={16} />
                          )
                        }
                        onClick={handleSearchCnpj}
                        sx={{
                          minHeight: 42,
                          px: 2.25,
                          borderRadius: "10px",
                          bgcolor: crmPalette.orange,
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                          boxShadow: "none",

                          "&:hover": {
                            bgcolor: crmPalette.orangeDark,
                            boxShadow: "none",
                          },
                        }}
                      >
                        {searchingCnpj ? "Buscando..." : "Buscar CNPJ"}
                      </Button>
                    </Box>

                    <TextField
                      fullWidth
                      size="small"
                      label="Razão social"
                      value={form.legalName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          legalName: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Nome fantasia"
                      value={form.tradeName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          tradeName: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Empresa / Grupo"
                      value={form.companyName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          companyName: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="CNAE"
                      value={form.cnae}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          cnae: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Inscrição estadual"
                      value={form.stateRegistration}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          stateRegistration: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Atividade comercial"
                      value={form.businessActivity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          businessActivity: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Segmento"
                      value={form.segment}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          segment: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Regime tributário"
                      value={form.taxRegime}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          taxRegime: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <Box
                      sx={{
                        gridColumn: {
                          xs: "auto",
                          md: "1 / -1",
                        },
                        mt: 0.25,
                        pt: 1.5,
                        borderTop: `1px solid ${crmPalette.border}`,
                      }}
                    >
                      <Typography
                        sx={{
                          color: crmPalette.text,
                          fontSize: 13,
                          fontWeight: 900,
                        }}
                      >
                        Endereço
                      </Typography>
                    </Box>

                    <TextField
                      fullWidth
                      size="small"
                      label="CEP"
                      value={form.zipCode}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          zipCode: event.target.value,
                        }))
                      }
                      placeholder="00000-000"
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Rua / Logradouro"
                      value={form.street}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          street: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Número"
                      value={form.number}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          number: event.target.value,
                        }))
                      }
                      placeholder="Número ou S/N"
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Complemento"
                      value={form.complement}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          complement: event.target.value,
                        }))
                      }
                      placeholder="Sala, bloco, galpão..."
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Bairro"
                      value={form.neighborhood}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          neighborhood: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Cidade"
                      value={form.city}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    />

                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Estado"
                      value={form.state}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          state: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    >
                      {[
                        "AC",
                        "AL",
                        "AP",
                        "AM",
                        "BA",
                        "CE",
                        "DF",
                        "ES",
                        "GO",
                        "MA",
                        "MT",
                        "MS",
                        "MG",
                        "PA",
                        "PB",
                        "PR",
                        "PE",
                        "PI",
                        "RJ",
                        "RN",
                        "RS",
                        "RO",
                        "RR",
                        "SC",
                        "SP",
                        "SE",
                        "TO",
                      ].map((uf) => (
                        <MenuItem key={uf} value={uf}>
                          {uf}
                        </MenuItem>
                      ))}
                    </TextField>

                    {/* <TextField
                      fullWidth
                      multiline
                      minRows={1}
                      label="Dados bancários"
                      value={form.bankDetails}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          bankDetails: event.target.value,
                        }))
                      }
                      sx={{
                        ...textFieldSx,
                        gridColumn: {
                          xs: "auto",
                          md: "1 / -1",
                        },
                      }}
                    /> */}

                    {/* <TextField
                      fullWidth
                      size="small"
                      label="Modalidade"
                      value={form.modality}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          modality: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    /> */}

                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Data de cadastro"
                      value={form.registrationDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          registrationDate: event.target.value,
                        }))
                      }
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                      sx={textFieldSx}
                    />

                    <TextField
                      select
                      size="small"
                      fullWidth
                      label="Status"
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value as LeadStatus,
                        }))
                      }
                      sx={textFieldSx}
                    >
                      <MenuItem value="PENDENTE">Pendente</MenuItem>
                      <MenuItem value="ATIVO">Ativo</MenuItem>
                      <MenuItem value="INATIVO">Inativo</MenuItem>
                    </TextField>
                  </Box>
                </Paper>

                {/* Contatos */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: "16px",
                    borderColor: crmPalette.border,
                    bgcolor: "#ffffff",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{
                      alignItems: { xs: "stretch", sm: "flex-start" },
                      justifyContent: "space-between",
                      mb: 2.25,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color: crmPalette.text,
                          fontSize: 13,
                          fontWeight: 900,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Contatos
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,
                          color: crmPalette.muted,
                          fontSize: 12,
                        }}
                      >
                        Cadastre um ou mais contatos do cliente. O primeiro
                        contato será tratado como principal.
                      </Typography>
                    </Box>

                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<PlusCircle size={16} />}
                      onClick={addContact}
                      sx={{
                        minHeight: 40,
                        borderRadius: "10px",
                        borderColor: crmPalette.border,
                        color: crmPalette.text,
                        fontWeight: 800,
                        whiteSpace: "nowrap",

                        "&:hover": {
                          borderColor: crmPalette.orange,
                          bgcolor: "#fff7f2",
                        },
                      }}
                    >
                      Adicionar contato
                    </Button>
                  </Stack>

                  <Stack spacing={2}>
                    {contacts.map((contact, index) => (
                      <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: "14px",
                          borderColor:
                            index === 0 ? "#fed7aa" : crmPalette.border,
                          bgcolor: index === 0 ? "#fff7f2" : "#ffffff",
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.5}
                          sx={{
                            alignItems: { xs: "stretch", sm: "center" },
                            justifyContent: "space-between",
                            mb: 1.75,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center" }}
                          >
                            <Chip
                              label={
                                index === 0
                                  ? "Contato principal"
                                  : `Contato ${index + 1}`
                              }
                              size="small"
                              sx={{
                                borderRadius: "8px",
                                bgcolor: index === 0 ? "#ffedd5" : "#f1f5f9",
                                color:
                                  index === 0
                                    ? crmPalette.orangeDark
                                    : crmPalette.text,
                                fontWeight: 900,
                              }}
                            />
                          </Stack>

                          <IconButton
                            type="button"
                            aria-label="Remover contato"
                            onClick={() => removeContact(index)}
                            disabled={
                              contacts.length === 1 &&
                              !Object.values(contact).some(Boolean)
                            }
                            sx={{
                              alignSelf: { xs: "flex-end", sm: "center" },
                              color: "#b91c1c",
                              bgcolor: "#fef2f2",

                              "&:hover": {
                                bgcolor: "#fee2e2",
                              },
                            }}
                          >
                            <Trash2 size={17} />
                          </IconButton>
                        </Stack>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              md: "repeat(2, minmax(0, 1fr))",
                            },
                            gap: 2,
                          }}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            label="Nome do contato"
                            value={contact.name}
                            onChange={(event) =>
                              updateContact(index, "name", event.target.value)
                            }
                            sx={textFieldSx}
                          />

                          <TextField
                            fullWidth
                            size="small"
                            label="Cargo / Função"
                            value={contact.role}
                            onChange={(event) =>
                              updateContact(index, "role", event.target.value)
                            }
                            sx={textFieldSx}
                          />

                          <TextField
                            fullWidth
                            size="small"
                            type="email"
                            label="E-mail"
                            value={contact.email}
                            onChange={(event) =>
                              updateContact(index, "email", event.target.value)
                            }
                            sx={textFieldSx}
                          />

                          <TextField
                            fullWidth
                            size="small"
                            label="Telefone"
                            value={contact.phone}
                            onChange={(event) =>
                              updateContact(index, "phone", event.target.value)
                            }
                            sx={textFieldSx}
                          />

                          <TextField
                            fullWidth
                            multiline
                            minRows={1}
                            label="Observações do contato"
                            value={contact.notes}
                            onChange={(event) =>
                              updateContact(index, "notes", event.target.value)
                            }
                            sx={{
                              ...textFieldSx,
                              gridColumn: {
                                xs: "auto",
                                md: "1 / -1",
                              },
                            }}
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>

                {/* Documentos */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: "16px",
                    borderStyle: "dashed",
                    borderColor: "#cbd5e1",
                    bgcolor: "#ffffff",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{
                      alignItems: { xs: "stretch", sm: "flex-start" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        borderRadius: "12px",
                        bgcolor: "#fff0e8",
                        color: crmPalette.orangeDark,
                      }}
                    >
                      <FileText size={19} />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: crmPalette.text,
                          fontSize: 14,
                          fontWeight: 900,
                        }}
                      >
                        Inserir documentos
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,
                          color: crmPalette.muted,
                          fontSize: 12,
                          lineHeight: 1.6,
                        }}
                      >
                        Anexe contratos, cartões CNPJ, comprovantes, planilhas
                        ou documentos do histórico.
                      </Typography>

                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<FileText size={16} />}
                        sx={{
                          mt: 1.5,
                          minHeight: 40,
                          borderRadius: "10px",
                          borderColor: crmPalette.border,
                          color: crmPalette.text,
                          fontWeight: 800,

                          "&:hover": {
                            borderColor: crmPalette.orange,
                            bgcolor: "#fff7f2",
                          },
                        }}
                      >
                        Selecionar arquivos
                        <Box
                          component="input"
                          type="file"
                          multiple
                          onChange={(
                            event: React.ChangeEvent<HTMLInputElement>,
                          ) =>
                            setDocumentFiles(
                              Array.from(event.target.files ?? []),
                            )
                          }
                          sx={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            p: 0,
                            m: -1,
                            overflow: "hidden",
                            clip: "rect(0 0 0 0)",
                            whiteSpace: "nowrap",
                            border: 0,
                          }}
                        />
                      </Button>

                      {documentFiles.length > 0 ? (
                        <Stack
                          spacing={0.75}
                          sx={{
                            mt: 1.5,
                          }}
                        >
                          {documentFiles.map((file) => (
                            <Chip
                              key={`${file.name}-${file.size}`}
                              label={file.name}
                              size="small"
                              onDelete={() =>
                                setDocumentFiles((current) =>
                                  current.filter(
                                    (currentFile) =>
                                      !(
                                        currentFile.name === file.name &&
                                        currentFile.size === file.size
                                      ),
                                  ),
                                )
                              }
                              sx={{
                                width: "fit-content",
                                maxWidth: "100%",
                                borderRadius: "8px",
                                bgcolor: "#f1f5f9",
                                color: crmPalette.text,
                                fontSize: 12,
                                fontWeight: 700,

                                "& .MuiChip-label": {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                },
                              }}
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography
                          sx={{
                            mt: 1.25,
                            color: "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          Nenhum arquivo selecionado.
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
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
                disabled={saving || searchingCnpj}
                onClick={() => setIsModalOpen(false)}
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
                disabled={saving || searchingCnpj}
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PlusCircle size={16} />
                  )
                }
                sx={{
                  minHeight: 42,
                  borderRadius: "10px",
                  px: 2.5,
                  bgcolor: crmPalette.orange,
                  fontWeight: 800,
                  boxShadow: "none",

                  "&:hover": {
                    bgcolor: crmPalette.orangeDark,
                    boxShadow: "none",
                  },
                }}
              >
                {saving ? "Salvando..." : "Salvar cliente"}
              </Button>
            </DialogActions>
          </Box>
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
