"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  CrmPageShell,
  CrmSection,
  crmPalette,
} from "@/components/mui/crm-primitives";

import {
  Activity,
  ArrowLeft,
  Building2,
  ContactRound,
  Edit3,
  FileText,
  History,
  LayoutDashboard,
  Mail,
  Phone,
  PhoneCall,
  PlusCircle,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { TimelineSection } from "@/components/crm/timeline-section";
import { FeedbackToast } from "@/components/ui/feedback-toast";
import { useAuth } from "@/context/auth-context";
import { API_BASE_URL } from "@/services/api";
import {
  createTimelineContact,
  formatLeadStatus,
  getCrmLeadById,
  updateClient,
} from "@/services/crm.service";
import type { LeadDetail, LeadStatus } from "@/types/crm";

const contactChannels = [
  "Ligação",
  "WhatsApp",
  "E-mail",
  "Reunião",
  "Visita",
  "Videochamada",
  "Outro",
] as const;

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

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 34,
    borderRadius: "8px",
    bgcolor: "#ffffff",
  },
  "& .MuiInputBase-input": {
    py: "6px",
    fontSize: 13,
  },
  "& .MuiInputBase-inputMultiline": {
    py: 0,
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
  },
  "& .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 700,
  },
};

const secondaryButtonSx = {
  minHeight: 40,
  px: 2,
  borderRadius: "10px",
  borderColor: "#dbe3ee",
  color: crmPalette.text,
  fontSize: 13,
  fontWeight: 800,
  textTransform: "none",
  bgcolor: "#ffffff",
  transition: "all 180ms ease",

  "&:hover": {
    borderColor: crmPalette.orange,
    bgcolor: "#fff7f2",
    color: crmPalette.orangeDark,
  },
};

const detailsGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    lg: "repeat(3, minmax(0, 1fr))",
    xl: "repeat(4, minmax(0, 1fr))",
  },
  gap: 1.5,
};

const formGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    md: "repeat(2, minmax(0, 1fr))",
  },
  gap: 1.25,
};

const addressGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    lg: "140px minmax(0, 2fr) 120px minmax(0, 1.3fr)",
  },
  gap: 1.25,
  gridColumn: { xs: "auto", md: "1 / -1" },
  p: 1.5,
  border: `1px solid ${crmPalette.border}`,
  borderRadius: "10px",
  bgcolor: "#f8fafc",
};

const UF_OPTIONS = [
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
] as const;

type ClientAddressForm = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ClientContactForm = {
  id?: string;
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

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function toDateTimeLocalValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function toDateInputValue(date?: string | null) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

function splitStreetAndNumber(value: string) {
  const [street, ...numberParts] = value.split(",");

  return {
    street: street?.trim() ?? "",
    number: numberParts.join(",").trim(),
  };
}

function parseClientAddress(address?: string | null): ClientAddressForm {
  if (!address) {
    return {
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    };
  }

  const parts = address
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const streetAndNumber = splitStreetAndNumber(parts[0] ?? "");
  const cityState = parts[3] ?? "";
  const [city, state] = cityState.split(" - ").map((part) => part.trim());
  const zipCodePart =
    parts.find((part) => /^cep\s*:/i.test(part)) ?? parts[4] ?? "";

  return {
    zipCode: zipCodePart.replace(/^cep\s*:/i, "").trim(),
    street: streetAndNumber.street || address,
    number: streetAndNumber.number,
    complement: parts[1] ?? "",
    neighborhood: parts[2] ?? "",
    city: city ?? "",
    state: state ?? "",
  };
}

function buildClientAddress(address: ClientAddressForm) {
  const streetAndNumber = [address.street.trim(), address.number.trim()]
    .filter(Boolean)
    .join(", ");
  const cityAndState = [address.city.trim(), address.state.trim()]
    .filter(Boolean)
    .join(" - ");

  return [
    streetAndNumber,
    address.complement.trim(),
    address.neighborhood.trim(),
    cityAndState,
    address.zipCode.trim() ? `CEP: ${address.zipCode.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

function resolveUploadUrl(url: string) {
  if (url.startsWith("http")) {
    return url;
  }

  return API_BASE_URL.replace(/\/api\/?$/, "") + url;
}

function clientToFormState(lead: LeadDetail) {
  const address = parseClientAddress(lead.address);

  return {
    email: lead.email ?? "",
    companyName: lead.company ?? "",
    phone: lead.phone ?? "",
    document: lead.document ?? "",
    legalName: lead.legalName ?? "",
    tradeName: lead.tradeName ?? "",
    cnae: lead.cnae ?? "",
    stateRegistration: lead.stateRegistration ?? "",
    businessActivity: lead.businessActivity ?? "",
    taxRegime: lead.taxRegime ?? "",
    address: lead.address ?? "",
    zipCode: address.zipCode,
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    bankDetails: lead.bankDetails ?? "",
    modality: lead.modality ?? "",
    registrationDate: toDateInputValue(lead.registrationDate),
    segment: lead.segment === "-" ? "" : lead.segment,
    status: lead.status,
    notes: lead.notes ?? "",
  };
}

function leadContactsToFormState(lead: LeadDetail) {
  if (lead.contacts.length === 0) {
    return [emptyClientContact()];
  }

  return lead.contacts.map((contact) => ({
    id: contact.id,
    name: contact.name ?? "",
    role: contact.role ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    notes: contact.notes ?? "",
  }));
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        p: 1.75,
        minHeight: 82,
        border: `1px solid ${crmPalette.border}`,
        borderRadius: "12px",
        bgcolor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          color: "#94a3b8",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: ".08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>

      <Typography
        component="div"
        sx={{
          mt: 0.75,
          color: "#1e293b",
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1.45,
          overflowWrap: "anywhere",
        }}
      >
        {value || "-"}
      </Typography>
    </Box>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: _icon,
}: SectionHeaderProps) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        minWidth: 0,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? (
          <Typography
            sx={{
              color: crmPalette.orangeDark,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".14em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          component="h2"
          sx={{
            mt: eyebrow ? 0.5 : 0,
            color: crmPalette.text,
            fontSize: { xs: 19, md: 21 },
            fontWeight: 900,
            lineHeight: 1.2,
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            sx={{
              mt: 0.75,
              color: crmPalette.muted,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

type FormSectionTitleProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
};

function FormSectionTitle({
  icon: _icon,
  title,
  description,
}: FormSectionTitleProps) {
  return (
    <Stack
      direction="row"
      sx={{
        gridColumn: "1 / -1",
        alignItems: "center",
        minWidth: 0,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: crmPalette.text,
            fontSize: 14,
            fontWeight: 900,
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            sx={{
              mt: 0.25,
              color: crmPalette.muted,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

function ClientContactCard({
  contact,
  index,
}: {
  contact: LeadDetail["contacts"][number];
  index: number;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "12px",
        borderColor: contact.isPrimary ? "#fed7aa" : crmPalette.border,
        bgcolor: contact.isPrimary ? "#fff7f2" : "#ffffff",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: crmPalette.text,
              fontSize: 15,
              fontWeight: 900,
              overflowWrap: "anywhere",
            }}
          >
            {contact.name || `Contato ${index + 1}`}
          </Typography>
          <Typography
            sx={{
              mt: 0.35,
              color: crmPalette.muted,
              fontSize: 13,
              lineHeight: 1.5,
              overflowWrap: "anywhere",
            }}
          >
            {contact.role || "Cargo não informado"}
          </Typography>
        </Box>

        {contact.isPrimary ? (
          <Chip
            label="Principal"
            size="small"
            sx={{
              flexShrink: 0,
              borderRadius: "8px",
              bgcolor: "#ffedd5",
              color: crmPalette.orangeDark,
              fontWeight: 900,
            }}
          />
        ) : null}
      </Stack>

      <Stack spacing={1} sx={{ mt: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Mail size={15} color={crmPalette.muted} />
          <Typography
            sx={{
              minWidth: 0,
              color: crmPalette.text,
              fontSize: 13,
              overflowWrap: "anywhere",
            }}
          >
            {contact.email || "-"}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Phone size={15} color={crmPalette.muted} />
          <Typography
            sx={{
              minWidth: 0,
              color: crmPalette.text,
              fontSize: 13,
              overflowWrap: "anywhere",
            }}
          >
            {contact.phone || "-"}
          </Typography>
        </Stack>
      </Stack>

      {contact.notes ? (
        <Typography
          sx={{
            mt: 1.5,
            color: crmPalette.muted,
            fontSize: 13,
            lineHeight: 1.6,
            overflowWrap: "anywhere",
          }}
        >
          {contact.notes}
        </Typography>
      ) : null}
    </Paper>
  );
}

export default function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token, user } = useAuth();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState("");
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [savingClient, setSavingClient] = useState(false);
  const [clientFormError, setClientFormError] = useState("");
  const [clientForm, setClientForm] = useState({
    email: "",
    companyName: "",
    phone: "",
    document: "",
    legalName: "",
    tradeName: "",
    cnae: "",
    stateRegistration: "",
    businessActivity: "",
    taxRegime: "",
    address: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    bankDetails: "",
    modality: "",
    registrationDate: "",
    segment: "",
    status: "PENDENTE" as LeadStatus,
    notes: "",
  });
  const [clientContacts, setClientContacts] = useState<ClientContactForm[]>([
    emptyClientContact(),
  ]);
  const [contactForm, setContactForm] = useState({
    contactChannel: "Ligação",
    customContactChannel: "",
    contactPerson: "",
    contactedAt: toDateTimeLocalValue(),
    description: "",
  });
  const [savingContact, setSavingContact] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const canEditCommercialData = user?.role
    ? ["ADMIN", "GESTAO", "COMERCIAL"].includes(user.role)
    : false;
  const canEditClient = canEditCommercialData;

  useEffect(() => {
    let active = true;

    async function loadLead() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const { id } = await params;
        setClientId(id);
        const nextLead = await getCrmLeadById(id, token);

        if (!active) {
          return;
        }

        if (!nextLead) {
          setError("Cliente não encontrado.");
          setLead(null);
          return;
        }

        setLead(nextLead);
        setClientForm(clientToFormState(nextLead));
        setClientContacts(leadContactsToFormState(nextLead));
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Erro ao carregar o detalhe do cliente.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLead();

    return () => {
      active = false;
    };
  }, [params, token]);

  async function reloadClient() {
    if (!token || !clientId) {
      return;
    }

    const nextLead = await getCrmLeadById(clientId, token);
    setLead(nextLead);
    if (nextLead) {
      setClientForm(clientToFormState(nextLead));
      setClientContacts(leadContactsToFormState(nextLead));
    }
  }

  function updateClientContact(
    index: number,
    field: keyof ClientContactForm,
    value: string,
  ) {
    setClientContacts((current) =>
      current.map((contact, currentIndex) =>
        currentIndex === index ? { ...contact, [field]: value } : contact,
      ),
    );
  }

  function addClientContact() {
    setClientContacts((current) => [...current, emptyClientContact()]);
  }

  function removeClientContact(index: number) {
    setClientContacts((current) =>
      current.length === 1
        ? [emptyClientContact()]
        : current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  async function handleUpdateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    if (!clientForm.companyName.trim()) {
      setClientFormError("Informe o nome da empresa.");
      setToast({
        title: "Campo obrigatório",
        message: "Informe o nome da empresa.",
        variant: "error",
      });
      return;
    }

    const validContacts = clientContacts
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

    try {
      setSavingClient(true);
      setClientFormError("");
      const fullAddress = buildClientAddress(clientForm);

      await updateClient(
        lead.id,
        {
          name: clientForm.companyName.trim(),
          companyName: clientForm.companyName.trim(),
          phone: clientForm.phone.trim() || undefined,
          document: clientForm.document.trim() || undefined,
          legalName: clientForm.legalName.trim() || undefined,
          tradeName: clientForm.tradeName.trim() || undefined,
          cnae: clientForm.cnae.trim() || undefined,
          stateRegistration: clientForm.stateRegistration.trim() || undefined,
          businessActivity: clientForm.businessActivity.trim() || undefined,
          taxRegime: clientForm.taxRegime.trim() || undefined,
          address: fullAddress || clientForm.address.trim() || undefined,
          bankDetails: clientForm.bankDetails.trim() || undefined,
          modality: clientForm.modality.trim() || undefined,
          registrationDate: clientForm.registrationDate || undefined,
          segment: clientForm.segment.trim() || undefined,
          status: clientForm.status,
          notes: clientForm.notes.trim() || undefined,
          contacts: validContacts,
        },
        token,
      );
      await reloadClient();
      setIsEditingClient(false);
      setToast({
        title: "Cliente atualizado",
        message: "Cadastro salvo com sucesso.",
        variant: "success",
      });
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Erro ao atualizar cliente.";
      setClientFormError(message);
      setToast({
        title: "Falha ao atualizar cliente",
        message,
        variant: "error",
      });
    } finally {
      setSavingClient(false);
    }
  }

  async function handleCreateContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !lead) {
      return;
    }

    const description = contactForm.description.trim();
    const contactChannel =
      contactForm.contactChannel === "Outro"
        ? contactForm.customContactChannel.trim()
        : contactForm.contactChannel;

    if (!description) {
      setToast({
        title: "Resumo obrigatório",
        message: "Descreva o que foi tratado no contato.",
        variant: "error",
      });
      return;
    }

    if (!contactChannel) {
      setToast({
        title: "Canal obrigatório",
        message: "Informe como o cliente foi contatado.",
        variant: "error",
      });
      return;
    }

    try {
      setSavingContact(true);
      const nextEvent = await createTimelineContact(
        lead.id,
        {
          title: "Contato com cliente",
          description,
          contactChannel,
          contactPerson: contactForm.contactPerson.trim() || undefined,
          contactedAt: contactForm.contactedAt || undefined,
        },
        token,
      );

      setLead((current) =>
        current
          ? {
              ...current,
              lastContactAt: nextEvent.createdAt,
              timeline: [nextEvent, ...current.timeline],
            }
          : current,
      );
      setContactForm({
        contactChannel: contactForm.contactChannel,
        customContactChannel:
          contactForm.contactChannel === "Outro"
            ? contactForm.customContactChannel
            : "",
        contactPerson: "",
        contactedAt: toDateTimeLocalValue(),
        description: "",
      });
      setToast({
        title: "Contato registrado",
        message: "Histórico do cliente atualizado com sucesso.",
        variant: "success",
      });
    } catch (contactError) {
      setToast({
        title: "Falha ao registrar contato",
        message:
          contactError instanceof Error
            ? contactError.message
            : "Erro ao registrar contato.",
        variant: "error",
      });
    } finally {
      setSavingContact(false);
    }
  }

  function startEditingClient(nextLead: LeadDetail) {
    setActiveTab(1);
    setIsEditingClient(true);
    setClientForm(clientToFormState(nextLead));
    setClientContacts(leadContactsToFormState(nextLead));
    setClientFormError("");
  }

  function renderHeader() {
    return (
      <CrmSection
        sx={{
          p: { xs: 2, md: 2.25 },
          borderRadius: "12px",
          border: `1px solid ${crmPalette.border}`,
          bgcolor: "#ffffff",
          boxShadow: "none",
        }}
      >
        <Stack spacing={1.5}>
          <Button
            component={Link}
            href="/clientes"
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            sx={{
              ...secondaryButtonSx,
              width: "fit-content",
              minHeight: 34,
              px: 1.6,
              borderRadius: "999px",
              fontSize: 12,
            }}
          >
            Voltar para clientes
          </Button>

          {loading ? (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <CircularProgress size={22} sx={{ color: crmPalette.orange }} />
              <Typography
                sx={{ color: crmPalette.muted, fontSize: 14, fontWeight: 700 }}
              >
                Carregando cliente...
              </Typography>
            </Stack>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: "12px" }}>
              {error}
            </Alert>
          ) : lead ? (
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              sx={{
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                minWidth: 0,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", flexWrap: "wrap" }}
                  >
                    <Typography
                      component="h1"
                      sx={{
                        color: "#020617",
                        fontSize: {
                          xs: 20,
                          sm: 23,
                          md: 26,
                        },
                        fontWeight: 900,
                        lineHeight: 1.2,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {lead.company}
                    </Typography>
                    <Chip
                      label={formatLeadStatus(lead.status)}
                      size="small"
                      variant="outlined"
                      sx={{
                        ...statusStyles[lead.status],
                        height: 26,
                        borderRadius: "8px",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 1, flexWrap: "wrap", rowGap: 0.75 }}
                  >
                    {[["CNPJ", lead.document ?? "-"]].map(([label, value]) => (
                      <Chip
                        key={label}
                        label={`${label}: ${value}`}
                        size="small"
                        sx={{
                          maxWidth: "100%",
                          height: "auto",
                          minHeight: 26,
                          borderRadius: "7px",
                          bgcolor: "#f8fafc",
                          color: "#475569",
                          border: `1px solid ${crmPalette.border}`,
                          fontSize: 11,
                          fontWeight: 700,

                          "& .MuiChip-label": {
                            px: 1,
                            py: 0.25,
                            overflowWrap: "anywhere",
                            whiteSpace: "normal",
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>

              {canEditClient ? (
                <Button
                  type="button"
                  variant="contained"
                  startIcon={<Edit3 size={16} />}
                  onClick={() => startEditingClient(lead)}
                  sx={{
                    width: { xs: "100%", sm: "fit-content" },
                    minHeight: 40,
                    px: 2,
                    borderRadius: "10px",
                    bgcolor: crmPalette.orange,
                    fontSize: 12,
                    fontWeight: 800,
                    boxShadow: "none",
                    whiteSpace: "nowrap",

                    "&:hover": {
                      bgcolor: crmPalette.orangeDark,
                      boxShadow: "none",
                    },
                  }}
                >
                  Editar cliente
                </Button>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      </CrmSection>
    );
  }

  function renderTabs() {
    if (!lead) {
      return null;
    }

    return (
      <CrmSection
        sx={{
          p: 0,
          overflow: "hidden",
          borderRadius: "12px",
          border: `1px solid ${crmPalette.border}`,
          bgcolor: "#ffffff",
          boxShadow: "none",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue: number) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, md: 1.5 },
            bgcolor: "#ffffff",

            "& .MuiTab-root": {
              minHeight: 50,
              minWidth: "auto",
              px: { xs: 1.25, md: 1.75 },
              color: crmPalette.muted,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "none",
            },

            "& .MuiTab-root:hover": {
              color: crmPalette.orangeDark,
              bgcolor: "#fffaf7",
            },

            "& .Mui-selected": {
              color: `${crmPalette.orangeDark} !important`,
            },

            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
              bgcolor: crmPalette.orange,
            },
          }}
        >
          <Tab
            icon={<LayoutDashboard size={17} />}
            iconPosition="start"
            label="Visão geral"
          />
          <Tab
            icon={<Building2 size={17} />}
            iconPosition="start"
            label="Cadastro"
          />
          <Tab
            icon={<ContactRound size={17} />}
            iconPosition="start"
            label="Contatos"
          />
          <Tab
            icon={<FileText size={17} />}
            iconPosition="start"
            label="Documentos"
          />
          <Tab
            icon={<History size={17} />}
            iconPosition="start"
            label="Histórico"
          />
        </Tabs>
      </CrmSection>
    );
  }

  function renderOverviewTab(currentLead: LeadDetail) {
    return (
      <CrmSection
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: "12px",
          border: `1px solid ${crmPalette.border}`,
          bgcolor: "#ffffff",
          boxShadow: "none",
        }}
      >
        <Stack spacing={2.5}>
          <SectionHeader
            eyebrow="Visão geral"
            title="Visão geral do cliente"
            description="Resumo da conta para consulta rápida."
            icon={<LayoutDashboard size={20} />}
          />

          <Box sx={detailsGridSx}>
            {[
              ["Empresa", currentLead.company],
              ["CNPJ", currentLead.document ?? "-"],
              ["Razão social", currentLead.legalName ?? "-"],
              ["Nome fantasia", currentLead.tradeName ?? "-"],
              ["Status", formatLeadStatus(currentLead.status)],
              ["Segmento", currentLead.segment],
              ["Modalidade", currentLead.modality ?? "-"],
              ["Telefone", currentLead.phone ?? "-"],
              ["Quantidade de contatos", currentLead.contacts.length],
              ["Quantidade de documentos", currentLead.documents.length],
            ].map(([label, value]) => (
              <InfoCard
                key={String(label)}
                label={String(label)}
                value={value}
              />
            ))}
          </Box>
        </Stack>
      </CrmSection>
    );
  }

  function renderClientContactEditor() {
    return (
      <Paper
        variant="outlined"
        sx={{
          mt: 2,
          p: { xs: 1.75, md: 2 },
          borderRadius: "12px",
          borderColor: crmPalette.border,
          bgcolor: "#ffffff",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{ color: crmPalette.text, fontSize: 13, fontWeight: 900 }}
            >
              Contatos do cliente
            </Typography>
            <Typography
              sx={{ mt: 0.25, color: crmPalette.muted, fontSize: 12 }}
            >
              O primeiro contato salvo fica como principal.
            </Typography>
          </Box>

          <Button
            type="button"
            variant="outlined"
            startIcon={<PlusCircle size={15} />}
            onClick={addClientContact}
            sx={{
              minHeight: 36,
              borderRadius: "8px",
              borderColor: crmPalette.border,
              color: crmPalette.text,
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            Adicionar contato
          </Button>
        </Stack>

        <Stack spacing={1.25}>
          {clientContacts.map((contact, index) => (
            <Paper
              key={contact.id ?? index}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: "10px",
                borderColor: index === 0 ? "#fed7aa" : crmPalette.border,
                bgcolor: index === 0 ? "#fff7f2" : "#ffffff",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                  mb: 1.25,
                }}
              >
                <Chip
                  label={
                    index === 0 ? "Contato principal" : `Contato ${index + 1}`
                  }
                  size="small"
                  sx={{
                    width: "fit-content",
                    borderRadius: "8px",
                    bgcolor: index === 0 ? "#ffedd5" : "#f1f5f9",
                    color:
                      index === 0 ? crmPalette.orangeDark : crmPalette.text,
                    fontWeight: 900,
                  }}
                />

                <IconButton
                  type="button"
                  aria-label="Remover contato"
                  onClick={() => removeClientContact(index)}
                  disabled={
                    clientContacts.length === 1 &&
                    !Object.entries(contact).some(
                      ([key, value]) => key !== "id" && !!value,
                    )
                  }
                  sx={{
                    alignSelf: { xs: "flex-end", sm: "center" },
                    width: 34,
                    height: 34,
                    color: "#b91c1c",
                    bgcolor: "#fef2f2",
                    "&:hover": { bgcolor: "#fee2e2" },
                  }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Stack>

              <Box sx={formGridSx}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nome"
                  value={contact.name}
                  onChange={(event) =>
                    updateClientContact(index, "name", event.target.value)
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Cargo / Função"
                  value={contact.role}
                  onChange={(event) =>
                    updateClientContact(index, "role", event.target.value)
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
                    updateClientContact(index, "email", event.target.value)
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Telefone"
                  value={contact.phone}
                  onChange={(event) =>
                    updateClientContact(index, "phone", event.target.value)
                  }
                  sx={textFieldSx}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  label="Observações"
                  value={contact.notes}
                  onChange={(event) =>
                    updateClientContact(index, "notes", event.target.value)
                  }
                  sx={{
                    ...textFieldSx,
                    gridColumn: { xs: "auto", md: "1 / -1" },
                  }}
                />
              </Box>
            </Paper>
          ))}
        </Stack>
      </Paper>
    );
  }

  function renderCadastroTab(currentLead: LeadDetail) {
    return (
      <CrmSection sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "stretch", md: "flex-start" },
              justifyContent: "space-between",
            }}
          >
            <SectionHeader
              eyebrow="Cadastro"
              title="Dados do cliente"
              description="Dados cadastrais, fiscais e comerciais da conta."
              icon={<Building2 size={20} />}
            />

            {canEditClient ? (
              <Button
                type="button"
                variant="outlined"
                startIcon={
                  isEditingClient ? <X size={16} /> : <Edit3 size={16} />
                }
                onClick={() => {
                  setIsEditingClient((current) => !current);
                  setClientForm(clientToFormState(currentLead));
                  setClientContacts(leadContactsToFormState(currentLead));
                  setClientFormError("");
                }}
                sx={{
                  minHeight: 40,
                  borderRadius: "10px",
                  borderColor: crmPalette.border,
                  color: crmPalette.text,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                {isEditingClient ? "Cancelar edição" : "Editar cadastro"}
              </Button>
            ) : null}
          </Stack>

          {isEditingClient ? (
            <Box component="form" onSubmit={handleUpdateClient}>
              {clientFormError ? (
                <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
                  {clientFormError}
                </Alert>
              ) : null}

              <Stack spacing={2}>
                <Box sx={formGridSx}>
                  <FormSectionTitle
                    icon={<Building2 size={18} />}
                    title="Informações principais"
                    description="Identificação do cliente no CRM."
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Empresa"
                    value={clientForm.companyName}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Razão social"
                    value={clientForm.legalName}
                    onChange={(event) =>
                      setClientForm((current) => ({
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
                    value={clientForm.tradeName}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        tradeName: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="CNPJ"
                    value={clientForm.document}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        document: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Status"
                    value={clientForm.status}
                    onChange={(event) =>
                      setClientForm((current) => ({
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

                <Divider />

                <Box sx={formGridSx}>
                  <FormSectionTitle
                    icon={<Activity size={18} />}
                    title="Informações fiscais"
                    description="Dados tributários e atividade fiscal."
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="CNAE"
                    value={clientForm.cnae}
                    onChange={(event) =>
                      setClientForm((current) => ({
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
                    value={clientForm.stateRegistration}
                    onChange={(event) =>
                      setClientForm((current) => ({
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
                    value={clientForm.businessActivity}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        businessActivity: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Regime tributário"
                    value={clientForm.taxRegime}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        taxRegime: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />
                </Box>

                <Divider />

                <Box sx={formGridSx}>
                  <FormSectionTitle
                    icon={<ShieldCheck size={18} />}
                    title="Informações comerciais"
                    description="Classificação, modalidade e contato principal."
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Segmento"
                    value={clientForm.segment}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        segment: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Modalidade"
                    value={clientForm.modality}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        modality: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Telefone"
                    value={clientForm.phone}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    sx={textFieldSx}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Data do cadastro"
                    type="date"
                    value={clientForm.registrationDate}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        registrationDate: event.target.value,
                      }))
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={textFieldSx}
                  />
                </Box>

                <Divider />

                <Box sx={formGridSx}>
                  <FormSectionTitle
                    icon={<FileText size={18} />}
                    title="Informações complementares"
                    description="Endereço, dados bancários e observações internas."
                  />
                  <Box sx={addressGridSx}>
                    <Typography
                      sx={{
                        gridColumn: "1 / -1",
                        color: crmPalette.text,
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      Endereço
                    </Typography>

                    <TextField
                      fullWidth
                      size="small"
                      label="CEP"
                      value={clientForm.zipCode}
                      onChange={(event) =>
                        setClientForm((current) => ({
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
                      value={clientForm.street}
                      onChange={(event) =>
                        setClientForm((current) => ({
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
                      value={clientForm.number}
                      onChange={(event) =>
                        setClientForm((current) => ({
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
                      value={clientForm.complement}
                      onChange={(event) =>
                        setClientForm((current) => ({
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
                      value={clientForm.neighborhood}
                      onChange={(event) =>
                        setClientForm((current) => ({
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
                      value={clientForm.city}
                      onChange={(event) =>
                        setClientForm((current) => ({
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
                      label="UF"
                      value={clientForm.state}
                      onChange={(event) =>
                        setClientForm((current) => ({
                          ...current,
                          state: event.target.value,
                        }))
                      }
                      sx={textFieldSx}
                    >
                      {UF_OPTIONS.map((uf) => (
                        <MenuItem key={uf} value={uf}>
                          {uf}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    minRows={1}
                    label="Dados bancários"
                    value={clientForm.bankDetails}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        bankDetails: event.target.value,
                      }))
                    }
                    sx={{
                      ...textFieldSx,
                      gridColumn: { xs: "auto", md: "1 / -1" },
                    }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={1}
                    label="Observações cadastrais"
                    value={clientForm.notes}
                    onChange={(event) =>
                      setClientForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    sx={{
                      ...textFieldSx,
                      gridColumn: { xs: "auto", md: "1 / -1" },
                    }}
                  />
                </Box>
              </Stack>

              {renderClientContactEditor()}

              <Stack direction="row" sx={{ mt: 2, justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingClient}
                  startIcon={
                    savingClient ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Save size={16} />
                    )
                  }
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    minHeight: 40,
                    borderRadius: "10px",
                    bgcolor: crmPalette.orange,
                    fontWeight: 800,
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: crmPalette.orangeDark,
                      boxShadow: "none",
                    },
                  }}
                >
                  {savingClient ? "Salvando..." : "Salvar cadastro"}
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box sx={detailsGridSx}>
              {[
                ["Empresa", currentLead.company],
                ["Telefone", currentLead.phone ?? "-"],
                ["CNPJ", currentLead.document ?? "-"],
                ["Razão social", currentLead.legalName ?? "-"],
                ["Nome fantasia", currentLead.tradeName ?? "-"],
                ["CNAE", currentLead.cnae ?? "-"],
                ["Inscrição estadual", currentLead.stateRegistration ?? "-"],
                ["Atividade comercial", currentLead.businessActivity ?? "-"],
                ["Regime tributário", currentLead.taxRegime ?? "-"],
                ["Endereço", currentLead.address ?? "-"],
                ["Dados bancários", currentLead.bankDetails ?? "-"],
                ["Modalidade", currentLead.modality ?? "-"],
                [
                  "Data do cadastro",
                  formatDate(
                    currentLead.registrationDate ?? currentLead.createdAt,
                  ),
                ],
                ["Segmento", currentLead.segment],
                ["Status", formatLeadStatus(currentLead.status)],
                ["Observações", currentLead.notes ?? "-"],
              ].map(([label, value]) => (
                <InfoCard
                  key={String(label)}
                  label={String(label)}
                  value={value}
                />
              ))}
            </Box>
          )}
        </Stack>
      </CrmSection>
    );
  }

  function renderContactsTab(currentLead: LeadDetail) {
    return (
      <CrmSection sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={3}>
          <SectionHeader
            eyebrow="Contatos"
            title="Contatos do cliente"
            description="Pessoas cadastradas e histórico de contato comercial."
            icon={<ContactRound size={20} />}
          />

          <Box>
            <Typography
              sx={{ color: crmPalette.text, fontSize: 15, fontWeight: 900 }}
            >
              Contatos cadastrados
            </Typography>

            {currentLead.contacts.length > 0 ? (
              <Box
                sx={{
                  mt: 1.5,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {currentLead.contacts.map((contact, index) => (
                  <ClientContactCard
                    key={contact.id}
                    contact={contact}
                    index={index}
                  />
                ))}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mt: 1.5, borderRadius: "12px" }}>
                Nenhum contato cadastrado para este cliente.
              </Alert>
            )}
          </Box>

          {canEditClient ? (
            <>
              <Divider />

              <Box>
                <SectionHeader
                  eyebrow="Contato"
                  title="Registrar contato com o cliente"
                  description="Cada registro entra na linha do tempo com quem fez o contato."
                  icon={<PhoneCall size={20} />}
                />

                <Box
                  component="form"
                  onSubmit={handleCreateContact}
                  sx={{ mt: 2 }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        lg: "repeat(4, minmax(0, 1fr))",
                      },
                      gap: 1.5,
                      alignItems: "center",
                    }}
                  >
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Canal"
                      value={contactForm.contactChannel}
                      onChange={(event) =>
                        setContactForm((current) => ({
                          ...current,
                          contactChannel: event.target.value,
                          customContactChannel:
                            event.target.value === "Outro"
                              ? current.customContactChannel
                              : "",
                        }))
                      }
                      sx={textFieldSx}
                    >
                      {contactChannels.map((channel) => (
                        <MenuItem key={channel} value={channel}>
                          {channel}
                        </MenuItem>
                      ))}
                    </TextField>

                    {contactForm.contactChannel === "Outro" ? (
                      <TextField
                        fullWidth
                        size="small"
                        label="Canal personalizado"
                        value={contactForm.customContactChannel}
                        onChange={(event) =>
                          setContactForm((current) => ({
                            ...current,
                            customContactChannel: event.target.value,
                          }))
                        }
                        sx={textFieldSx}
                      />
                    ) : null}

                    <TextField
                      fullWidth
                      size="small"
                      label="Pessoa contatada"
                      value={contactForm.contactPerson}
                      onChange={(event) =>
                        setContactForm((current) => ({
                          ...current,
                          contactPerson: event.target.value,
                        }))
                      }
                      sx={{
                        ...textFieldSx,
                        "& .MuiOutlinedInput-root": {
                          minHeight: 40,
                          height: 40,
                          borderRadius: "8px",
                          bgcolor: "#ffffff",
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Data e hora"
                      type="datetime-local"
                      value={contactForm.contactedAt}
                      onChange={(event) =>
                        setContactForm((current) => ({
                          ...current,
                          contactedAt: event.target.value,
                        }))
                      }
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{
                        ...textFieldSx,
                        "& .MuiOutlinedInput-root": {
                          minHeight: 40,
                          height: 40,
                          borderRadius: "8px",
                          bgcolor: "#ffffff",
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={savingContact}
                      startIcon={
                        savingContact ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <PhoneCall size={16} />
                        )
                      }
                      sx={{
                        minHeight: 40,
                        height: 40,
                        alignSelf: "center",
                        whiteSpace: "nowrap",
                        borderRadius: "10px",
                        bgcolor: crmPalette.orange,
                        fontWeight: 800,
                        boxShadow: "none",
                        "&:hover": {
                          bgcolor: crmPalette.orangeDark,
                          boxShadow: "none",
                        },
                      }}
                    >
                      {savingContact ? "Registrando..." : "Registrar contato"}
                    </Button>
                    <TextField
                      fullWidth
                      multiline
                      minRows={1}
                      label="Resumo do contato"
                      value={contactForm.description}
                      onChange={(event) =>
                        setContactForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Resumo do contato, retorno combinado ou próxima ação"
                      sx={{ ...textFieldSx, gridColumn: "1 / -1" }}
                    />
                  </Box>
                </Box>
              </Box>
            </>
          ) : null}
        </Stack>
      </CrmSection>
    );
  }

  function renderDocumentsTab(currentLead: LeadDetail) {
    return (
      <CrmSection sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2.5}>
          <SectionHeader
            eyebrow="Documentos"
            title="Histórico documental"
            description="Arquivos cadastrados no histórico deste cliente."
            icon={<FileText size={20} />}
          />

          {currentLead.documents.length > 0 ? (
            <Stack spacing={1.25}>
              {currentLead.documents.map((document) => (
                <Paper
                  key={document.id}
                  component="a"
                  href={resolveUploadUrl(document.url)}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    borderColor: crmPalette.border,
                    color: "inherit",
                    textDecoration: "none",
                    bgcolor: "#ffffff",
                    transition:
                      "background-color 160ms ease, border-color 160ms ease",
                    "&:hover": {
                      bgcolor: "#fff7f2",
                      borderColor: crmPalette.orange,
                    },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "space-between",
                      minWidth: 0,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.25}
                      sx={{ alignItems: "center", minWidth: 0 }}
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
                        <FileText size={18} />
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            color: crmPalette.text,
                            fontSize: 14,
                            fontWeight: 900,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {document.originalName}
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.4,
                            color: crmPalette.muted,
                            fontSize: 13,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {document.description || "Documento cadastral"} •{" "}
                          {formatDate(document.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      label="Abrir"
                      size="small"
                      sx={{
                        flexShrink: 0,
                        borderRadius: "8px",
                        bgcolor: "#eaf4ff",
                        color: crmPalette.blue,
                        fontWeight: 900,
                      }}
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Alert severity="info" sx={{ borderRadius: "12px" }}>
              Nenhum documento anexado a este cliente.
            </Alert>
          )}
        </Stack>
      </CrmSection>
    );
  }

  function renderActiveTab(currentLead: LeadDetail) {
    if (activeTab === 0) {
      return renderOverviewTab(currentLead);
    }

    if (activeTab === 1) {
      return renderCadastroTab(currentLead);
    }

    if (activeTab === 2) {
      return renderContactsTab(currentLead);
    }

    if (activeTab === 3) {
      return renderDocumentsTab(currentLead);
    }

    return <TimelineSection events={currentLead.timeline} darkMode={false} />;
  }

  return (
    <AppLayout>
      <CrmPageShell>
        {renderHeader()}
        {renderTabs()}

        {lead ? (
          renderActiveTab(lead)
        ) : loading || error ? null : (
          <CrmSection sx={{ p: 5, textAlign: "center" }}>
            <Typography sx={{ color: crmPalette.muted, fontSize: 14 }}>
              Não foi possível carregar os dados deste cliente.
            </Typography>

            <Button
              component={Link}
              href="/clientes"
              variant="contained"
              sx={{
                mt: 2,
                minHeight: 40,
                borderRadius: "10px",
                bgcolor: crmPalette.orange,
                fontWeight: 800,
                boxShadow: "none",

                "&:hover": {
                  bgcolor: crmPalette.orangeDark,
                  boxShadow: "none",
                },
              }}
            >
              Voltar para a lista
            </Button>
          </CrmSection>
        )}
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
