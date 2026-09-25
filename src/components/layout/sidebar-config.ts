import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ChartSpline,
  CircleHelp,
  FileText,
  Globe2,
  Handshake,
  History,
  Inbox,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  MessageCircle,
  PackageSearch,
  Plug,
  Ticket,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";

import type { ScreenKey } from "@/config/screens";

export const sidebarFontFamily =
  '"Inter Variable", Inter, system-ui, sans-serif';

export const screenIcons: Record<ScreenKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  bi: ChartSpline,
  entregas: Truck,
  trackings: PackageSearch,
  quotes: FileText,
  clients: Building2,
  leads: UserPlus,
  entradas: Inbox,
  tickets: Ticket,
  helpCenter: CircleHelp,
  chat: MessageCircle,
  suppliers: Handshake,
  users: Users,
  marketing: Megaphone,
  marketingIntegrations: Plug,
  siteRequests: Inbox,
  siteInstitutional: Globe2,
  logs: History,

  "entregas-por-placas": MapPinned,
};

export type SidebarSectionConfig = {
  id: string;
  title?: string;
  icon?: LucideIcon;
  keys: ScreenKey[];
};

export const sidebarSections: SidebarSectionConfig[] = [
  {
    id: "dashboard",
    keys: ["dashboard"],
  },
  {
    id: "crm-comercial",
    title: "Comercial",
    icon: ChartSpline,
    keys: ["clients", "leads", "quotes", "bi"],
  },
  {
    id: "operacao",
    title: "Operação",
    icon: Truck,
    keys: [
      "entregas",
      "trackings",
      "entregas-por-placas",
    ],
  },

  // {
  //   id: "atendimento",
  //   title: "Atendimento",
  //   icon: Inbox,
  //   keys: ["entradas", "tickets", "chat", "helpCenter"],
  // },

  {
    id: "marketing",
    title: "Marketing",
    icon: Megaphone,
    keys: ["marketing", "siteInstitutional", "marketingIntegrations", "siteRequests"],
  },
  {
    id: "administracao",
    title: "Administração",
    icon: Users,
    keys: ["users", "logs"],
  },
];

export const menuTextSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: sidebarFontFamily,
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: 0,
  color: "inherit",
};

export const subMenuTextSx = {
  ...menuTextSx,
  fontWeight: 500,
};

export const itemButtonSx = {
  minHeight: 55,
  borderRadius: "10px",
  px: 2,
  fontFamily: sidebarFontFamily,
  fontSize: 14,
  color: "#fff",
  transition:
    "background-color 160ms ease, color 160ms ease, box-shadow 160ms ease",

  "&:hover": {
    bgcolor: "rgba(255,255,255,0.08)",
    color: "#fff",
  },

  "&.Mui-selected": {
    bgcolor: "#ff4d00",
    color: "#fff",
    boxShadow: "0 18px 32px rgba(255,77,0,0.24)",
  },

  "&.Mui-selected:hover": {
    bgcolor: "#e64500",
  },

  ".MuiListItemIcon-root": {
    minWidth: 52,
    color: "#fab519",
    transition: "color 160ms ease",
  },

  "&.Mui-selected .MuiListItemIcon-root": {
    color: "#fff",
  },
};

export const subItemButtonSx = {
  minHeight: 45,
  borderRadius: "12px",
  px: 1.5,
  fontFamily: sidebarFontFamily,
  fontSize: 14,
  color: "#fff",
  transition:
    "background-color 160ms ease, color 160ms ease, box-shadow 160ms ease",

  "&:hover": {
    bgcolor: "rgba(255,255,255,0.08)",
    color: "#fff",
  },

  "&.Mui-selected": {
    bgcolor: "#ff4d00",
    color: "#fff",
    boxShadow: "0 14px 26px rgba(255,77,0,0.22)",
  },

  "&.Mui-selected:hover": {
    bgcolor: "#e64500",
  },

  ".MuiListItemIcon-root": {
    minWidth: 44,
    color: "inherit",
  },
};
