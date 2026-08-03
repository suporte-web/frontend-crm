"use client";

import type * as React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import {
  Edit3,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { crmPalette } from "@/components/mui/crm-primitives";
import { API_BASE_URL } from "@/services/api";
import type { LeadDetail, LeadStatus } from "@/types/crm";

export const OPPORTUNITY_PROPOSAL_DOCUMENT_CATEGORY = "OPORTUNIDADE_PROPOSTA";

export const TRANSPORT_PROPOSAL_OPTIONS = [
  "Distribuição Urbana",
  "Last mile",
  "Ecommerce",
  "Transferência",
  "Dedicada",
  "Fracionada",
  "Inbound",
  "Spot",
  "Outbound",
] as const;

export const STORAGE_PROPOSAL_OPTIONS = [
  "Armazenagem (Posição Mensal)",
  "Recebimento (Entrada)",
  "Expedição (Picking)",
  "Sala Ponto Fiscal",
  "Seguro",
] as const;

export const VEHICLE_TYPE_OPTIONS = [
  "Van",
  "3/4",
  "Toco",
  "Truck",
  "Carreta",
  "Bitrem",
  "Rodotrem",
  "Double Deck",
  "Elétrico",
] as const;

export const TRANSPORT_PRICE_ITEMS = [
  "Frete Peso",
  "Carga",
  "GRIS",
  "ADV",
  "Pedágio",
  "Descarga",
  "Diária",
] as const;

export const statusStyles: Record<LeadStatus, object> = {
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

export const textFieldSx = {
  width: "100%",
  alignSelf: "start",

  "& .MuiInputLabel-root": {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: crmPalette.orangeDark,
  },

  "& .MuiOutlinedInput-root": {
    borderRadius: "9px",
    bgcolor: "#ffffff",
    color: "#1e293b",
    fontSize: 13,
    fontWeight: 600,

    transition: `
      border-color 160ms ease,
      box-shadow 160ms ease,
      background-color 160ms ease
    `,

    "& fieldset": {
      borderColor: "#dbe3ee",
    },

    "&:hover fieldset": {
      borderColor: "#f4a47f",
    },

    "&.Mui-focused": {
      bgcolor: "#ffffff",
      boxShadow: "0 0 0 3px rgba(255, 77, 0, 0.10)",
    },

    "&.Mui-focused fieldset": {
      borderWidth: "1px",
      borderColor: crmPalette.orange,
    },
  },

  // Aplica altura fixa apenas em campos normais.
  // Não interfere nos campos multiline.
  "& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)": {
    minHeight: 40,
    height: 40,
  },

  "& .MuiOutlinedInput-input": {
    padding: "9px 12px",
    fontSize: 13,
    fontWeight: 600,
  },

  "& .MuiInputBase-input::placeholder": {
    color: "#94a3b8",
    opacity: 1,
    fontWeight: 500,
  },

  "& .MuiSelect-select": {
    minHeight: "auto !important",
    padding: "9px 32px 9px 12px !important",
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 600,
  },

  "& .MuiFormHelperText-root": {
    mx: 0.25,
    mt: 0.5,
    color: crmPalette.muted,
    fontSize: 11,
    lineHeight: 1.4,
  },
};

export const compactMultilineSx = {
  "& .MuiOutlinedInput-root.MuiInputBase-multiline": {
    minHeight: 56,
    height: 56,
    alignItems: "flex-start",
    borderRadius: "9px",
  },

  "& .MuiInputBase-inputMultiline": {
    height: "100% !important",
    padding: "9px 12px !important",
    boxSizing: "border-box",
    overflow: "auto !important",
    fontSize: 13,
    lineHeight: 1.4,
  },
};

export const secondaryButtonSx = {
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

export const detailsGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    md: "repeat(2, minmax(0, 1fr))",
    lg: "repeat(3, minmax(0, 1fr))",
    xl: "repeat(4, minmax(0, 1fr))",
  },
  gap: 1.75,
};

export const formGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    md: "repeat(2, minmax(0, 1fr))",
  },
  gap: 1.5,
};

export const editFormSectionSx = {
  ...formGridSx,

  position: "relative",
  p: {
    xs: 1.75,
    sm: 2,
    md: 2.25,
  },

  overflow: "hidden",

  border: `1px solid ${crmPalette.border}`,
  borderRadius: "14px",

  bgcolor: "#ffffff",

  boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04)",

  transition: `
    border-color 180ms ease,
    box-shadow 180ms ease
  `,

  "&:hover": {
    borderColor: "#f3c5b0",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
  },
};

export const addressGridSx = {
  gridColumn: "1 / -1",

  display: "grid",

  gridTemplateColumns: {
    xs: "1fr",
    sm: "140px minmax(0, 1fr)",
    lg: "130px minmax(0, 2fr) 110px minmax(0, 1.2fr)",
  },

  gap: 1,
  p: 1.25,

  alignItems: "start",
  gridAutoRows: "min-content",

  border: `1px solid ${crmPalette.border}`,
  borderRadius: "12px",
  bgcolor: "#f8fafc",
};

export const UF_OPTIONS = [
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

export type FormularioEnderecoCliente = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type FormularioContatoCliente = {
  id?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  whatsapp: string;
  linkedin: string;
  notes: string;
};

export const modernListSx = {
  p: 0,
  overflow: "hidden",
  border: `1px solid ${crmPalette.border}`,
  borderRadius: "14px",
  bgcolor: "#ffffff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
};

export const listItemSx = {
  px: {
    xs: 1.75,
    sm: 2,
    md: 2.5,
  },

  py: {
    xs: 1.5,
    md: 1.75,
  },

  minHeight: 72,
  alignItems: "center",

  borderBottom: `1px solid ${crmPalette.border}`,

  transition: "background-color 160ms ease",

  "&:last-of-type": {
    borderBottom: 0,
  },

  "&:hover": {
    bgcolor: "#fffaf7",
  },
};

export type FormularioNovoContatoCliente = {
  nomeContato: string;
  cargo: string;
  email: string;
  telefone: string;
  whatsapp: string;
  linkedin: string;
};

export type DadosBancariosCliente = {
  bankName: string;
  customBankName: string;
  bankAgency: string;
  bankAccount: string;
  bankAccountType: string;
};

export type FormularioCondicoesComerciais = {
  paymentMethod: string;
  paymentMethods: string[];
  nextPaymentMethod: string;
  customPaymentMethod: string;
  paymentTerm: string;
  contractValidity: string;
  priceAdjustment: string;
  invoiceContactName: string;
  invoiceContactEmail: string;
  invoiceContactPhone: string;
  bankDetails: string;
  bankAccounts: DadosBancariosCliente[];
  bankName: string;
  customBankName: string;
  bankAgency: string;
  bankAccount: string;
  bankAccountType: string;
  commercialTermsNotes: string;
};

export type FormularioPropostaOportunidade = {
  title: string;
  proposalType: "" | "TRANSPORTE_RODOVIARIO" | "ARMAZENAGEM";
  transportOptions: string[];
  storageOptions: string[];
  customOption: string;
  origin: string;
  destination: string;
  vehicleType: string;
  cargoType: string;
  averageWeight: string;
  aggregateValue: string;
  cubage: string;
  monthlyShipments: string;
  dangerousGoods: "" | "SIM" | "NAO";
  dangerousGoodsInfo: string;
  transportValues: Record<string, string>;
};

export const contatoClienteVazio = (): FormularioContatoCliente => ({
  name: "",
  role: "",
  email: "",
  phone: "",
  whatsapp: "",
  linkedin: "",
  notes: "",
});

export const novoContatoClienteVazio = (): FormularioNovoContatoCliente => ({
  nomeContato: "",
  cargo: "",
  email: "",
  telefone: "",
  whatsapp: "",
  linkedin: "",
});

export const formularioCondicoesComerciaisVazio = (): FormularioCondicoesComerciais => ({
  paymentMethod: "",
  paymentMethods: [],
  nextPaymentMethod: "",
  customPaymentMethod: "",
  paymentTerm: "",
  contractValidity: "",
  priceAdjustment: "",
  invoiceContactName: "",
  invoiceContactEmail: "",
  invoiceContactPhone: "",
  bankDetails: "",
  bankAccounts: [],
  bankName: "",
  customBankName: "",
  bankAgency: "",
  bankAccount: "",
  bankAccountType: "",
  commercialTermsNotes: "",
});

export const formularioPropostaOportunidadeVazio = (): FormularioPropostaOportunidade => ({
  title: "",
  proposalType: "",
  transportOptions: [],
  storageOptions: [],
  customOption: "",
  origin: "",
  destination: "",
  vehicleType: "",
  cargoType: "",
  averageWeight: "",
  aggregateValue: "",
  cubage: "",
  monthlyShipments: "",
  dangerousGoods: "",
  dangerousGoodsInfo: "",
  transportValues: Object.fromEntries(
    TRANSPORT_PRICE_ITEMS.map((item) => [item, ""]),
  ) as Record<string, string>,
});

export function propostaParaFormulario(
  opportunity: LeadDetail["opportunities"][number],
): FormularioPropostaOportunidade {
  const form = formularioPropostaOportunidadeVazio();

  form.title = opportunity.title ?? "";

  const notes = opportunity.preContractNotes ?? "";

  if (!notes.trim()) {
    return form;
  }

  const fields = new Map<string, string>();

  notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return;
      }

      const label = line
        .slice(0, separatorIndex)
        .trim()
        .toLowerCase();

      const value = line
        .slice(separatorIndex + 1)
        .trim();

      fields.set(label, value);
    });

  const proposalType = fields.get("tipo de proposta") ?? "";

  if (proposalType.toLowerCase().includes("armazenagem")) {
    form.proposalType = "ARMAZENAGEM";
  }

  if (proposalType.toLowerCase().includes("transporte")) {
    form.proposalType = "TRANSPORTE_RODOVIARIO";
  }

  const options = (fields.get("opções") ?? "")
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);

  if (form.proposalType === "ARMAZENAGEM") {
    form.storageOptions = options;
  }

  if (form.proposalType === "TRANSPORTE_RODOVIARIO") {
    form.transportOptions = options;
  }

  form.origin = fields.get("origem") ?? "";
  form.destination = fields.get("destino") ?? "";
  form.vehicleType = fields.get("tipo de veículo") ?? "";
  form.cargoType = fields.get("tipo de carga") ?? "";
  form.averageWeight = fields.get("peso médio") ?? "";
  form.aggregateValue = fields.get("valor agregado") ?? "";
  form.cubage = fields.get("cubagem") ?? "";

  form.monthlyShipments =
    fields.get("quantidade de embarques/mês") ?? "";

  const dangerousGoods = (
    fields.get("produto perigoso") ?? ""
  ).toLowerCase();

  if (dangerousGoods === "sim") {
    form.dangerousGoods = "SIM";
  }

  if (
    dangerousGoods === "não" ||
    dangerousGoods === "nao"
  ) {
    form.dangerousGoods = "NAO";
  }

  form.dangerousGoodsInfo =
    fields.get("fds/ficha de emergência") ?? "";

  const transportValuesText = fields.get("valores") ?? "";

  transportValuesText
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const separatorIndex = item.indexOf(":");

      if (separatorIndex === -1) {
        return;
      }

      const label = item
        .slice(0, separatorIndex)
        .trim();

      const value = item
        .slice(separatorIndex + 1)
        .trim();

      if (label) {
        form.transportValues[label] = value;
      }
    });

  return form;
}

export function montarObservacoesProposta(
  form: FormularioPropostaOportunidade,
): string {
  const selectedOptions =
    form.proposalType === "ARMAZENAGEM"
      ? form.storageOptions
      : form.transportOptions;

  const proposalTypeLabel =
    form.proposalType === "ARMAZENAGEM"
      ? "Armazenagem"
      : "Transporte rodoviário";

  const transportValueNotes = Object.entries(
    form.transportValues,
  )
    .filter(([, value]) => value.trim())
    .map(
      ([item, value]) =>
        `${item}: ${value.trim()}`,
    );

  const transportDetails =
    form.proposalType === "TRANSPORTE_RODOVIARIO"
      ? [
          `Origem: ${form.origin.trim()}`,
          `Destino: ${form.destination.trim()}`,
          `Tipo de veículo: ${form.vehicleType}`,
          `Tipo de carga: ${form.cargoType.trim()}`,
          `Peso médio: ${form.averageWeight.trim()}`,
          `Valor agregado: ${form.aggregateValue.trim()}`,

          form.cubage.trim()
            ? `Cubagem: ${form.cubage.trim()}`
            : null,

          form.monthlyShipments.trim()
            ? `Quantidade de embarques/mês: ${form.monthlyShipments.trim()}`
            : null,

          `Produto perigoso: ${
            form.dangerousGoods === "SIM"
              ? "Sim"
              : "Não"
          }`,

          form.dangerousGoods === "SIM"
            ? `FDS/Ficha de Emergência: ${form.dangerousGoodsInfo.trim()}`
            : null,

          transportValueNotes.length > 0
            ? `Valores: ${transportValueNotes.join(" | ")}`
            : null,
        ]
      : [];

  return [
    `Tipo de proposta: ${proposalTypeLabel}`,
    `Opções: ${selectedOptions.join(", ")}`,
    ...transportDetails,
  ]
    .filter(
      (item): item is string =>
        Boolean(item),
    )
    .join("\n");
}


export const PAYMENT_METHOD_OPTIONS = [
  "Boleto",
  "Pix",
  "Transferência",
  "Cartão",
  "Dinheiro",
  "Outro",
] as const;

export const BANK_OPTIONS = [
  "Banco do Brasil",
  "Bradesco",
  "Caixa Econômica Federal",
  "Itaú",
  "Santander",
  "Sicredi",
  "Sicoob",
  "Nubank",
  "Inter",
  "Outro banco",
] as const;

export const ACCOUNT_TYPE_OPTIONS = [
  "Conta corrente",
  "Conta poupança",
  "Conta pagamento",
  "Conta salário",
] as const;

export function formatarData(date?: string | null) {
  if (!date) {
    return "xx/xx/xxxx";
  }

  // Para datas no formato 2026-07-30
  const dataSemHorario = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dataSemHorario) {
    const [, ano, mes, dia] = dataSemHorario;

    return `${dia}/${mes}/${ano}`;
  }

  const dataConvertida = new Date(date);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "xx/xx/xxxx";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(dataConvertida);
}

export function paraValorInputData(date?: string | null) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

export function separarRuaENumero(value: string) {
  const [street, ...numberParts] = value.split(",");

  return {
    street: street?.trim() ?? "",
    number: numberParts.join(",").trim(),
  };
}

export function lerEnderecoCliente(address?: string | null): FormularioEnderecoCliente {
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
  const streetAndNumber = separarRuaENumero(parts[0] ?? "");
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

export function montarEnderecoCliente(address: FormularioEnderecoCliente) {
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

export function resolveUploadUrl(url: string) {
  if (url.startsWith("http")) {
    return url;
  }

  const apiBaseUrl = API_BASE_URL.replace(/\/$/, "");

  if (url.startsWith("/api/")) {
    return apiBaseUrl.replace(/\/api$/, "") + url;
  }

  if (url.startsWith("/uploads/")) {
    return `${apiBaseUrl}${url}`;
  }

  return `${apiBaseUrl}/${url.replace(/^\//, "")}`;
}

function uniqueFilledValues(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function parseFormasPagamento(value?: string | null) {
  if (!value) {
    return [];
  }

  return uniqueFilledValues(value.split(/\s*(?:\||;|\n)\s*/));
}

export function formatarFormasPagamento(values: string[]) {
  return uniqueFilledValues(values).join(" | ");
}

export function dadosBancariosVazio(): DadosBancariosCliente {
  return {
    bankName: "",
    customBankName: "",
    bankAgency: "",
    bankAccount: "",
    bankAccountType: "",
  };
}

export function temDadosBancarios(bankDetails: DadosBancariosCliente) {
  return Boolean(
    bankDetails.bankName.trim() ||
    bankDetails.customBankName.trim() ||
    bankDetails.bankAgency.trim() ||
    bankDetails.bankAccount.trim() ||
    bankDetails.bankAccountType.trim(),
  );
}

export function parseDadosBancarios(value?: string | null) {
  const result = dadosBancariosVazio();

  if (!value) {
    return result;
  }

  const lines = value
    .split(/\n|\|/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const [rawKey, ...rawValueParts] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const fieldValue = rawValueParts.join(":").trim();

    if (!fieldValue) {
      continue;
    }

    if (key === "banco") {
      if (BANK_OPTIONS.includes(fieldValue as (typeof BANK_OPTIONS)[number])) {
        result.bankName = fieldValue;
      } else {
        result.bankName = "Outro banco";
        result.customBankName = fieldValue;
      }
    }

    if (key === "agência" || key === "agencia") {
      result.bankAgency = fieldValue;
    }

    if (key === "conta") {
      result.bankAccount = fieldValue;
    }

    if (key === "tipo de conta") {
      result.bankAccountType = fieldValue;
    }
  }

  if (
    !result.bankName &&
    !result.bankAgency &&
    !result.bankAccount &&
    !result.bankAccountType
  ) {
    result.bankName = "Outro banco";
    result.customBankName = value.trim();
  }

  return result;
}

export function parseListaDadosBancarios(value?: string | null) {
  if (!value) {
    return [];
  }

  const blocks = value
    .split(/\n\s*\n|---+/)
    .map((block) => block.trim())
    .filter(Boolean);

  const parsedBlocks = blocks
    .map(parseDadosBancarios)
    .filter(temDadosBancarios);

  if (parsedBlocks.length > 0) {
    return parsedBlocks;
  }

  const singleBankDetails = parseDadosBancarios(value);

  return temDadosBancarios(singleBankDetails) ? [singleBankDetails] : [];
}

export function formatarDadosBancarios({
  bankName,
  customBankName,
  bankAgency,
  bankAccount,
  bankAccountType,
}: Pick<
  FormularioCondicoesComerciais,
  | "bankName"
  | "customBankName"
  | "bankAgency"
  | "bankAccount"
  | "bankAccountType"
>) {
  const resolvedBankName =
    bankName === "Outro banco" ? customBankName.trim() : bankName.trim();

  return [
    resolvedBankName ? `Banco: ${resolvedBankName}` : "",
    bankAgency.trim() ? `Agência: ${bankAgency.trim()}` : "",
    bankAccount.trim() ? `Conta: ${bankAccount.trim()}` : "",
    bankAccountType.trim() ? `Tipo de conta: ${bankAccountType.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatarListaDadosBancarios(values: DadosBancariosCliente[]) {
  return values
    .filter(temDadosBancarios)
    .map(formatarDadosBancarios)
    .filter(Boolean)
    .join("\n\n");
}

export function formatarDadosBancariosParaExibicao(value?: string | null) {
  const parsed = parseListaDadosBancarios(value);
  const formatted = formatarListaDadosBancarios(parsed);

  return formatted || value || "-";
}

export function extrairCampoDasObservacoesContato(
  notes: string | null | undefined,
  field: "WhatsApp" | "LinkedIn",
) {
  if (!notes) {
    return "";
  }

  const match = notes.match(
    new RegExp(`${field}:\\s*(.*?)(?=\\s+(?:WhatsApp|LinkedIn):|$)`, "i"),
  );

  return match?.[1]?.trim() ?? "";
}

export function limparObservacoesContato(notes: string | null | undefined) {
  if (!notes) {
    return "";
  }

  return notes
    .replace(/(?:^|\s)WhatsApp:\s*.*?(?=\s+LinkedIn:|$)/gi, " ")
    .replace(/(?:^|\s)LinkedIn:\s*.*?(?=\s+WhatsApp:|$)/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function clienteParaFormularioCliente(lead: LeadDetail) {
  const address = lerEnderecoCliente(lead.address);

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
    taxation: lead.taxation ?? "",
    address: lead.address ?? "",
    zipCode: address.zipCode,
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city || (lead.city === "-" ? "" : lead.city),
    state: address.state,
    bankDetails: lead.bankDetails ?? "",
    modality: lead.modality ?? "",
    registrationDate: paraValorInputData(lead.registrationDate),
    segment: lead.segment === "-" ? "" : lead.segment,
    status: lead.status,
    notes: lead.notes ?? "",
  };
}

export function contatosClienteParaFormulario(lead: LeadDetail) {
  if (lead.contacts.length === 0) {
    return [contatoClienteVazio()];
  }

  return lead.contacts.map((contact) => ({
    id: contact.id,
    name: contact.name ?? contact.nomeContato ?? "",
    role: contact.role ?? contact.cargo ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? contact.telefone ?? "",
    whatsapp:
      contact.whatsapp ??
      extrairCampoDasObservacoesContato(contact.notes, "WhatsApp"),
    linkedin:
      contact.linkedin ??
      extrairCampoDasObservacoesContato(contact.notes, "LinkedIn"),
    notes: limparObservacoesContato(contact.notes),
  }));
}

export function clienteParaFormularioCondicoesComerciais(
  lead: LeadDetail,
): FormularioCondicoesComerciais {
  const bankAccounts = parseListaDadosBancarios(lead.bankDetails);

  return {
    paymentMethod: lead.paymentMethod ?? "",
    paymentMethods: parseFormasPagamento(lead.paymentMethod),
    nextPaymentMethod: "",
    customPaymentMethod: "",
    paymentTerm: lead.paymentTerm ?? "",
    contractValidity: lead.contractValidity ?? "",
    priceAdjustment: lead.priceAdjustment ?? "",
    invoiceContactName: lead.invoiceContactName ?? "",
    invoiceContactEmail: lead.invoiceContactEmail ?? "",
    invoiceContactPhone: lead.invoiceContactPhone ?? "",
    bankDetails: lead.bankDetails ?? "",
    bankAccounts,
    ...dadosBancariosVazio(),
    commercialTermsNotes: lead.commercialTermsNotes ?? "",
  };
}

export function CartaoInformacao({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: 104,
        p: 2,
        overflow: "hidden",
        border: `1px solid ${crmPalette.border}`,
        borderRadius: "14px",
        bgcolor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth: 0,
        transition: "all 180ms ease",

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          bgcolor: crmPalette.orange,
          opacity: 0,
          transition: "opacity 180ms ease",
        },

        "&:hover": {
          borderColor: "#fed7c3",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.07)",
          transform: "translateY(-2px)",
        },

        "&:hover::before": {
          opacity: 1,
        },
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
          mt: 0.8,
          color: "#0f172a",
          fontSize: 14,
          fontWeight: 800,
          lineHeight: 1.5,
          overflowWrap: "anywhere",
        }}
      >
        {value || "-"}
      </Typography>
    </Box>
  );
}

export function ListaInformacoes({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <List component="div" disablePadding sx={modernListSx}>
      {items.map(([label, value], index) => (
        <ListItem component="div" key={`${label}-${index}`} sx={listItemSx}>
          <ListItemText
            sx={{
              m: 0,
              minWidth: 0,
            }}
            primary={label}
            secondary={value ?? "-"}
            slotProps={{
              primary: {
                component: "p",
                sx: {
                  m: 0,
                  color: "#94a3b8",
                  fontSize: 10,
                  fontWeight: 900,
                  lineHeight: 1.3,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                },
              },

              secondary: {
                component: "div",
                sx: {
                  mt: 0.8,
                  color: "#0f172a",
                  fontSize: 14,
                  fontWeight: 800,
                  lineHeight: 1.5,
                  overflowWrap: "anywhere",
                },
              },
            }}
          />
        </ListItem>
      ))}
    </List>
  );
}

export type PropriedadesCabecalhoSecao = {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

export function CabecalhoSecao({ eyebrow, title, description }: PropriedadesCabecalhoSecao) {
  return (
    <Stack
      spacing={0.75}
      sx={{
        minWidth: 0,
        maxWidth: 720,
      }}
    >
      {eyebrow ? (
        <Typography
          component="span"
          sx={{
            width: "fit-content",
            px: 1,
            py: 0.4,
            borderRadius: "999px",
            bgcolor: "#fff3ed",
            color: crmPalette.orangeDark,
            fontSize: 10,
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </Typography>
      ) : null}

      <Typography
        component="h2"
        sx={{
          m: 0,
          color: crmPalette.text,
          fontSize: {
            xs: 20,
            sm: 21,
            md: 23,
          },
          fontWeight: 900,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </Typography>

      {description ? (
        <Typography
          component="p"
          sx={{
            m: 0,
            maxWidth: 600,
            color: crmPalette.muted,
            fontSize: {
              xs: 12,
              sm: 13,
            },
            fontWeight: 500,
            lineHeight: 1.55,
            overflowWrap: "anywhere",
          }}
        >
          {description}
        </Typography>
      ) : null}
    </Stack>
  );
}

export type PropriedadesTituloSecaoFormulario = {
  icon: React.ReactNode;
  title: string;
  description?: string;
};

export function TituloSecaoFormulario({ icon, title, description }: PropriedadesTituloSecaoFormulario) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        gridColumn: "1 / -1",
        alignItems: "center",
        minWidth: 0,
        pb: 1.5,
        mb: 0.25,
        borderBottom: `1px solid ${crmPalette.border}`,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",

          borderRadius: "10px",
          bgcolor: "#fff3ed",
          color: crmPalette.orangeDark,
          border: "1px solid #fed7c3",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: "#1e293b",
            fontSize: 14,
            fontWeight: 900,
            lineHeight: 1.3,
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
              fontSize: 11.5,
              fontWeight: 500,
              lineHeight: 1.45,
            }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

export function ItemInformacaoContato({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        p: 1.25,
        border: `1px solid ${crmPalette.border}`,
        borderRadius: "10px",
        bgcolor: "#f8fafc",
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "9px",
          bgcolor: "#ffffff",
          color: crmPalette.orangeDark,
          border: "1px solid #fed7c3",

          "& svg": {
            fontSize: 18,
          },
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: 9.5,
            fontWeight: 900,
            lineHeight: 1.3,
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.25,
            color: crmPalette.text,
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.45,
            overflowWrap: "anywhere",
          }}
        >
          {value?.trim() || "Não informado"}
        </Typography>
      </Box>
    </Box>
  );
}

export function CartaoContatoCliente({
  contact,
  index,
  canEdit = false,
  canDelete = false,
  deleting = false,
  editing = false,
  saving = false,
  editForm,
  onEdit,
  onCancelEdit,
  onDelete,
  onEditFormChange,
  onSaveEdit,
}: {
  contact: LeadDetail["contacts"][number];
  index: number;
  canEdit?: boolean;
  canDelete?: boolean;
  deleting?: boolean;
  editing?: boolean;
  saving?: boolean;
  editForm?: FormularioContatoCliente;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onEditFormChange?: (field: keyof FormularioContatoCliente, value: string) => void;
  onSaveEdit?: () => void;
}) {
  const contactName = contact.name ?? contact.nomeContato;
  const contactRole = contact.role ?? contact.cargo;
  const contactPhone = contact.phone ?? contact.telefone;
  const contactWhatsApp =
    contact.whatsapp ??
    extrairCampoDasObservacoesContato(contact.notes, "WhatsApp");
  const contactLinkedIn =
    contact.linkedin ??
    extrairCampoDasObservacoesContato(contact.notes, "LinkedIn");
  const observacoesContato = limparObservacoesContato(contact.notes);
  const displayName = contactName || "Contato " + (index + 1);
  const actionsDisabled = deleting || saving;

  if (editing && editForm) {
    return (
      <ListItem
        disablePadding
        sx={{
          display: "block",
          border: 0,
          bgcolor: "transparent",
        }}
      >
        <Paper
          component="form"
          variant="outlined"
          onSubmit={(event) => {
            event.preventDefault();
            onSaveEdit?.();
          }}
          sx={{
            width: "100%",
            p: { xs: 1.75, md: 2 },
            borderRadius: "14px",
            borderColor: "#f59e0b",
            bgcolor: "#ffffff",
            boxShadow: "0 10px 26px rgba(15, 23, 42, 0.07)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Stack
              direction="row"
              spacing={1.25}
              sx={{ minWidth: 0, alignItems: "center" }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "12px",
                  bgcolor: "#fff7ed",
                  color: crmPalette.orangeDark,
                  border: "1px solid #fed7c3",
                }}
              >
                <EditOutlinedIcon sx={{ fontSize: 20 }} />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: crmPalette.text,
                    fontSize: 15,
                    fontWeight: 900,
                    lineHeight: 1.3,
                    overflowWrap: "anywhere",
                  }}
                >
                  Editando {displayName}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    color: crmPalette.muted,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                  }}
                >
                  Atualize os dados do contato e salve as alterações.
                </Typography>
              </Box>
            </Stack>

            {contact.isPrimary ? (
              <Chip
                label="Principal"
                size="small"
                sx={{
                  alignSelf: { xs: "flex-start", sm: "center" },
                  borderRadius: "8px",
                  bgcolor: "#ffedd5",
                  color: crmPalette.orangeDark,
                  fontWeight: 900,
                }}
              />
            ) : null}
          </Stack>

          <Box
            sx={{
              mt: 1.75,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 1.25,
            }}
          >
            <TextField
              required
              fullWidth
              size="small"
              label="Nome do contato"
              value={editForm.name}
              disabled={actionsDisabled}
              onChange={(event) => onEditFormChange?.("name", event.target.value)}
              sx={textFieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="Cargo"
              value={editForm.role}
              disabled={actionsDisabled}
              onChange={(event) => onEditFormChange?.("role", event.target.value)}
              sx={textFieldSx}
            />
            <TextField
              fullWidth
              size="small"
              type="email"
              label="E-mail"
              value={editForm.email}
              disabled={actionsDisabled}
              onChange={(event) => onEditFormChange?.("email", event.target.value)}
              sx={textFieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="Telefone"
              value={editForm.phone}
              disabled={actionsDisabled}
              onChange={(event) => onEditFormChange?.("phone", event.target.value)}
              sx={textFieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="WhatsApp"
              value={editForm.whatsapp}
              disabled={actionsDisabled}
              onChange={(event) =>
                onEditFormChange?.("whatsapp", event.target.value)
              }
              sx={textFieldSx}
            />
            <TextField
              fullWidth
              size="small"
              label="LinkedIn"
              value={editForm.linkedin}
              disabled={actionsDisabled}
              onChange={(event) =>
                onEditFormChange?.("linkedin", event.target.value)
              }
              sx={textFieldSx}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Observações"
              value={editForm.notes}
              disabled={actionsDisabled}
              onChange={(event) => onEditFormChange?.("notes", event.target.value)}
              sx={{
                ...textFieldSx,
                gridColumn: { xs: "auto", md: "1 / -1" },
              }}
            />
          </Box>

          <Divider sx={{ my: 1.75 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            {canDelete ? (
              <Button
                type="button"
                variant="outlined"
                disabled={actionsDisabled}
                startIcon={
                  deleting ? (
                    <CircularProgress size={15} color="inherit" />
                  ) : (
                    <Trash2 size={15} />
                  )
                }
                onClick={onDelete}
                sx={{
                  minHeight: 38,
                  borderRadius: "10px",
                  borderColor: "#fecaca",
                  color: "#b91c1c",
                  fontSize: 13,
                  fontWeight: 900,
                  textTransform: "none",
                  bgcolor: "#fffafa",
                  "&:hover": {
                    borderColor: "#fca5a5",
                    bgcolor: "#fef2f2",
                  },
                }}
              >
                {deleting ? "Excluindo..." : "Excluir contato"}
              </Button>
            ) : (
              <Box />
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                type="button"
                variant="outlined"
                disabled={actionsDisabled}
                startIcon={<X size={15} />}
                onClick={onCancelEdit}
                sx={secondaryButtonSx}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={actionsDisabled || !editForm.name.trim()}
                startIcon={
                  saving ? (
                    <CircularProgress size={15} color="inherit" />
                  ) : (
                    <Save size={15} />
                  )
                }
                sx={{
                  minHeight: 40,
                  borderRadius: "10px",
                  bgcolor: crmPalette.orange,
                  fontSize: 13,
                  fontWeight: 900,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: crmPalette.orangeDark,
                    boxShadow: "none",
                  },
                }}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </ListItem>
    );
  }

  return (
    <ListItem
      disablePadding
      sx={{
        display: "block",
        border: 0,
        bgcolor: "transparent",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          p: { xs: 1.75, md: 2 },
          borderRadius: "14px",
          borderColor: contact.isPrimary ? "#fdba74" : crmPalette.border,
          bgcolor: contact.isPrimary ? "#fffaf7" : "#ffffff",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
          transition: "border-color 180ms ease, box-shadow 180ms ease",
          "&:hover": {
            borderColor: "#f4a47f",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.07)",
          },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { xs: "stretch", sm: "flex-start" },
            justifyContent: "space-between",
          }}
        >
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ minWidth: 0, alignItems: "center" }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: "12px",
                bgcolor: "#fff3ed",
                color: crmPalette.orangeDark,
                border: "1px solid #fed7c3",
              }}
            >
              <PersonOutlineRoundedIcon sx={{ fontSize: 22 }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <Typography
                  sx={{
                    color: crmPalette.text,
                    fontSize: 15,
                    fontWeight: 900,
                    lineHeight: 1.3,
                    overflowWrap: "anywhere",
                  }}
                >
                  {displayName}
                </Typography>

                {contact.isPrimary ? (
                  <Chip
                    label="Principal"
                    size="small"
                    sx={{
                      height: 23,
                      borderRadius: "7px",
                      bgcolor: "#ffedd5",
                      color: crmPalette.orangeDark,
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  />
                ) : null}
              </Stack>

              <Stack
                direction="row"
                spacing={0.6}
                sx={{ mt: 0.4, alignItems: "center" }}
              >
                <BadgeOutlinedIcon
                  sx={{ color: crmPalette.muted, fontSize: 16 }}
                />
                <Typography
                  sx={{
                    color: crmPalette.muted,
                    fontSize: 12.5,
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {contactRole || "Cargo não informado"}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {canEdit || canDelete ? (
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                alignSelf: { xs: "flex-end", sm: "flex-start" },
                flexShrink: 0,
              }}
            >
              {canEdit ? (
                <IconButton
                  type="button"
                  aria-label={"Editar " + displayName}
                  title="Editar contato"
                  disabled={deleting}
                  onClick={onEdit}
                  sx={{
                    width: 34,
                    height: 34,
                    color: crmPalette.blue,
                    bgcolor: "#eaf4ff",
                    border: "1px solid #bfdbfe",
                    "&:hover": { bgcolor: "#dbeafe" },
                  }}
                >
                  <Edit3 size={16} />
                </IconButton>
              ) : null}

              {canDelete ? (
                <IconButton
                  type="button"
                  aria-label={"Excluir " + displayName}
                  title="Excluir contato"
                  disabled={deleting}
                  onClick={onDelete}
                  sx={{
                    width: 34,
                    height: 34,
                    color: "#b91c1c",
                    bgcolor: "#fef2f2",
                    border: "1px solid #fecaca",
                    "&:hover": { bgcolor: "#fee2e2" },
                  }}
                >
                  {deleting ? (
                    <CircularProgress size={15} color="inherit" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </IconButton>
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1,
          }}
        >
          <ItemInformacaoContato
            icon={<EmailOutlinedIcon />}
            label="E-mail"
            value={contact.email}
          />
          <ItemInformacaoContato
            icon={<PhoneOutlinedIcon />}
            label="Telefone"
            value={contactPhone}
          />
          <ItemInformacaoContato
            icon={<WhatsAppIcon />}
            label="WhatsApp"
            value={contactWhatsApp}
          />
          <ItemInformacaoContato
            icon={<LinkedInIcon />}
            label="LinkedIn"
            value={contactLinkedIn}
          />
        </Box>

        {observacoesContato ? (
          <Box sx={{ mt: 1 }}>
            <ItemInformacaoContato
              icon={<NotesOutlinedIcon />}
              label="Observações"
              value={observacoesContato}
            />
          </Box>
        ) : null}
      </Paper>
    </ListItem>
  );
}

export type FormularioCliente = ReturnType<typeof clienteParaFormularioCliente>;

export type PropriedadesAbaDetalhesCliente = {
  currentLead: LeadDetail;
  canEditClient: boolean;
  canEditCommercialData: boolean;
  clientForm: FormularioCliente;
  setFormularioCliente: React.Dispatch<React.SetStateAction<FormularioCliente>>;
  clientFormError: string;
  setFormularioClienteError: React.Dispatch<React.SetStateAction<string>>;
  isEditingClient: boolean;
  setIsEditingClient: React.Dispatch<React.SetStateAction<boolean>>;
  savingClient: boolean;
  handleUpdateClient: (event: React.FormEvent<HTMLFormElement>) => void;
  setClientContacts: React.Dispatch<React.SetStateAction<FormularioContatoCliente[]>>;
  commercialTermsForm: FormularioCondicoesComerciais;
  setFormularioCondicoesComerciais: React.Dispatch<
    React.SetStateAction<FormularioCondicoesComerciais>
  >;
  commercialTermsFormError: string;
  setFormularioCondicoesComerciaisError: React.Dispatch<React.SetStateAction<string>>;
  isEditingCommercialTerms: boolean;
  setIsEditingCommercialTerms: React.Dispatch<React.SetStateAction<boolean>>;
  savingCommercialTerms: boolean;
  handleUpdateCommercialTerms: (
    event: React.FormEvent<HTMLFormElement>,
  ) => void;
  startEditingCommercialTerms: (nextLead: LeadDetail) => void;
  newContactForm: FormularioNovoContatoCliente;
  setNewContactForm: React.Dispatch<
    React.SetStateAction<FormularioNovoContatoCliente>
  >;
  showNewContactForm: boolean;
  setShowNewContactForm: React.Dispatch<React.SetStateAction<boolean>>;
  savingContact: boolean;
  handleCreateContact: (event: React.FormEvent<HTMLFormElement>) => void;
  editingContactId: string | null;
  setEditingContactId: React.Dispatch<React.SetStateAction<string | null>>;
  editingContactForm: FormularioContatoCliente;
  setEditingContactForm: React.Dispatch<React.SetStateAction<FormularioContatoCliente>>;
  savingEditingContactId: string | null;
  deletingContactId: string | null;
  startEditingContact: (contact: LeadDetail["contacts"][number]) => void;
  updateEditingContactForm: (
    field: keyof FormularioContatoCliente,
    value: string,
  ) => void;
  handleUpdateContact: (contactId: string) => void;
  handleDeleteContact: (contactId: string) => void;
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploadingDocuments: boolean;
  handleUploadDocuments: () => void;
  handleOpenDocument: (
    clientDocument: LeadDetail["documents"][number],
  ) => void;
  openDeleteDocumentDialog: (
    clientDocument: LeadDetail["documents"][number],
  ) => void;
  cadastralDocuments: LeadDetail["documents"];
  proposalFiles: Record<string, File[]>;
  setProposalFiles: React.Dispatch<React.SetStateAction<Record<string, File[]>>>;
  uploadingProposalOpportunityId: string | null;
  handleUploadProposalDocuments: (opportunityId: string) => void;
  opportunityProposalDocuments: LeadDetail["documents"];
  opportunityProposalForm: FormularioPropostaOportunidade;
  setFormularioPropostaOportunidade: React.Dispatch<
    React.SetStateAction<FormularioPropostaOportunidade>
  >;
  opportunityProposalError: string;
  savingOpportunityProposal: boolean;
  editingOpportunityId: string | null;

  editingOpportunityForm: FormularioPropostaOportunidade;

  setEditingOpportunityForm: React.Dispatch<
    React.SetStateAction<FormularioPropostaOportunidade>
  >;

  savingEditingOpportunityId: string | null;
  deletingOpportunityId: string | null;
  handleCreateOpportunityProposal: (
    event: React.FormEvent<HTMLFormElement>,
  ) => void;
  startEditingOpportunity: (opportunity: LeadDetail["opportunities"][number]) => void;
  setEditingOpportunityId: React.Dispatch<React.SetStateAction<string | null>>;
  updateEditingOpportunityForm: <
    K extends keyof FormularioPropostaOportunidade,
  >(
    field: K,
    value: FormularioPropostaOportunidade[K],
  ) => void;
  handleUpdateOpportunity: (
    opportunityId: string,
    event: React.FormEvent<HTMLFormElement>,
  ) => void;
  handleDeleteOpportunity: (opportunityId: string) => void;
  toggleProposalOption: (option: string) => void;
  addCustomProposalOption: () => void;
};
