import type { UserRole } from "@/types/user";
import { crmPalette } from "@/components/mui/crm-primitives";
export const roles: UserRole[] = [
  "LIDER_ATENDIMENTO",
  "ATENDIMENTO",
  "ADMIN",
  "GESTAO",
  "COMERCIAL",
  "CONSULTORA",
  "OPERACAO",
  "MARKETING",
];

export const roleMeta: Record<
  UserRole,
  {
    label: string;
    accent: string;
    softColor: string;
    chipSx: object;
  }
> = {
  LIDER_ATENDIMENTO: {
    label: "Líder de Atendimento",
    accent: "#0369a1",
    softColor: "#e0f2fe",
    chipSx: { bgcolor: "#e0f2fe", color: "#0369a1" },
  },
  ATENDIMENTO: {
    label: "Atendimento",
    accent: "#0f766e",
    softColor: "#f0fdfa",
    chipSx: { bgcolor: "#f0fdfa", color: "#0f766e" },
  },
  ADMIN: {
    label: "Admin",
    accent: "#7c3aed",
    softColor: "#f5f3ff",
    chipSx: {
      bgcolor: "#f5f3ff",
      color: "#6d28d9",
      borderColor: "#ddd6fe",
    },
  },
  GESTAO: {
    label: "Gestão",
    accent: crmPalette.blue,
    softColor: "#eff6ff",
    chipSx: {
      bgcolor: "#eff6ff",
      color: "#1d4ed8",
      borderColor: "#bfdbfe",
    },
  },
  CONSULTORA: {
    label: "Consultora",
    accent: "#0288d1",
    softColor: "#e0f2fe",
    chipSx: { bgcolor: "#e0f2fe", color: "#0288d1" },
  },
  COMERCIAL: {
    label: "Comercial",
    accent: crmPalette.orange,
    softColor: "#fff7ed",
    chipSx: {
      bgcolor: "#fff7ed",
      color: crmPalette.orangeDark,
      borderColor: "#fed7aa",
    },
  },
  OPERACAO: {
    label: "Operação",
    accent: "#0f766e",
    softColor: "#f0fdfa",
    chipSx: {
      bgcolor: "#f0fdfa",
      color: "#0f766e",
      borderColor: "#99f6e4",
    },
  },
  MARKETING: {
    label: "Marketing",
    accent: "#db2777",
    softColor: "#fdf2f8",
    chipSx: {
      bgcolor: "#fdf2f8",
      color: "#be185d",
      borderColor: "#fbcfe8",
    },
  },
  CLIENTE: {
    label: "Cliente",
    accent: crmPalette.green,
    softColor: "#ecfdf5",
    chipSx: {
      bgcolor: "#ecfdf5",
      color: "#047857",
      borderColor: "#bbf7d0",
    },
  },
};
